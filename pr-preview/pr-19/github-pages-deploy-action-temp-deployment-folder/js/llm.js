import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
import { updateLLMStatus, updateMessage } from "./ui.js";
import { highlightCountries } from "./map.js";
import { getAvailableStats, getExampleCountry, executeQuery } from "./data.js";
import { debugLog, debugTime, debugTimeEnd } from "./debug.js";
import { retryOperation, createRetryButton, formatError, isOnline, QueryCache, PerformanceMonitor, debounce } from "./utils.js";

let engine;
const queryCache = new QueryCache();
const performanceMonitor = new PerformanceMonitor();

const modelConfigs = {
	"Llama-3.1-8B-Instruct-q4f16_1-MLC": {
		model_id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
	},
	"Llama-3.2-3B-Instruct-q4f16_1-MLC": {
		model_id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
	},
	"Llama-3.2-1B-Instruct-q4f16_1-MLC": {
		model_id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
	},
	"Qwen2.5-1.5B-Instruct-q4f16_1-MLC": {
		model_id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
	},
};

export async function initWebLLM(selectedModel) {
	// Provide default model if none selected (important for testing)
	const defaultModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
	const modelKey = selectedModel || defaultModel;
	const modelConfig = modelConfigs[modelKey];

	if (!modelConfig) {
		console.error(`Unknown model: ${modelKey}`);
		updateLLMStatus("Failed to initialize WebLLM - Unknown model");
		return;
	}

	// Check network status and warn if offline (but still try to initialize)
	if (!isOnline()) {
		updateLLMStatus("⚠️ Offline mode - trying to use cached model files");
		updateMessage("<div class='processing'>⚠️ No internet connection. Attempting to load model from browser cache...</div>");
	}

	const initProgressCallback = (progressObj) => {
		const progressText = `Initializing WebLLM: ${
			progressObj.text
		} (${progressObj.progress.toFixed(2)}%)`;
		updateLLMStatus(progressText);
	};

	const initializeEngine = async () => {
		debugLog("Starting WebLLM initialization...");
		engine = await CreateMLCEngine(modelConfig.model_id, {
			initProgressCallback,
			context_window_size: modelConfig.context_window_size,
		});
		debugLog("WebLLM initialized successfully");
		return engine;
	};

        try {
                await retryOperation(initializeEngine, 2, 2000);
                updateLLMStatus("✅ WebLLM ready");
                if (!isOnline()) {
                	updateMessage("✅ Model loaded successfully from cache! The app is fully functional offline.");
                }
        } catch (error) {
                console.error("Error initializing WebLLM:", error);
                
                // Provide more specific error messages
                const formattedError = formatError(error, "WebLLM initialization failed");
                let errorMessage = `❌ ${formattedError}`;
                
                if (!isOnline() && (error.message.includes('fetch') || error.message.includes('network'))) {
                	errorMessage += "<br>💡 Model not found in cache. Connect to internet to download it first.";
                } else if (error.message.includes('memory') || error.message.includes('GPU')) {
                	errorMessage += "<br>💡 Try selecting a smaller model from the dropdown.";
                } else if (error.message.includes('unsupported')) {
                	errorMessage += "<br>💡 Please use a modern browser like Chrome, Firefox, or Safari.";
                }
                
                // Add retry button
                const retryBtn = createRetryButton(() => initWebLLM(selectedModel), "🔄 Retry WebLLM");
                errorMessage += `<br>${retryBtn}`;
                
                updateLLMStatus("❌ WebLLM initialization failed");
                updateMessage(`<div class='error'>${errorMessage}</div>`);
        }
}

export async function generateSQLQuery(query) {
	const availableStats = getAvailableStats();
	const exampleCountry = getExampleCountry();

        const prompt = `Generate a SQL query for the countries table based on the user's request.
  
  Available fields: ${availableStats.join(", ")}
  
  Example row:
  ${JSON.stringify(exampleCountry, null, 2)}
  
  Guidelines:
  1. Always include 'name' and 'ISO_A3' in SELECT
  2. Use LIKE '%value%' for partial string matches
  3. 'languages', 'currencies', 'timezones', 'continents', and 'borders' are comma-separated strings
  4. For flag-related queries, use the 'flagDescription' field, which contains detailed text about the flag
  5. Use complex string matching for advanced flag queries
  
  Example queries:
  - "Countries with red in their flag": 
    SELECT name, ISO_A3 FROM countries WHERE flagDescription LIKE '%red%'
  - "Countries with stars on their flag":
    SELECT name, ISO_A3 FROM countries WHERE flagDescription LIKE '%star%'
  - "Countries with animals in their flag":
    SELECT name, ISO_A3 FROM countries WHERE 
      flagDescription LIKE '%animal%' 
      OR flagDescription LIKE '%bird%' 
      OR flagDescription LIKE '%eagle%' 
      OR flagDescription LIKE '%lion%'
  - "European countries with crosses in their flags":
    SELECT name, ISO_A3 FROM countries 
    WHERE region = 'Europe' AND flagDescription LIKE '%cross%'
  - "Countries with sun symbols in their flags":
    SELECT name, ISO_A3 FROM countries 
    WHERE flagDescription LIKE '%sun%' OR flagDescription LIKE '%rays%'
  
  User Query: "${query}"
  
  Respond with only the SQL query.`;

        debugLog("Prompt being sent to LLM:", prompt);

        try {
                debugLog("Sending query to WebLLM for SQL query generation");
                const reply = await engine.chat.completions.create({
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.3,
                        max_tokens: 300,
                });

                const rawResponse = reply.choices[0].message.content.trim();
                debugLog("Received SQL query from WebLLM:", rawResponse);

		// Extract SQL query from response (handle extra text)
		let sqlQuery = rawResponse;

		// Look for SELECT statement in the response
		const selectMatch = rawResponse.match(/SELECT[\s\S]*?(?=\n\n|\n[A-Z]|$)/i);
		if (selectMatch) {
			sqlQuery = selectMatch[0].trim();
		}

		// Clean up common prefixes and suffixes
		sqlQuery = sqlQuery.replace(
			/^(Here's the SQL query you need:|SQL Query:|Query:)\s*/i,
			""
		);
		sqlQuery = sqlQuery.replace(
			/\s*(This will find.*|This query.*|The above query.*)$/i,
			""
		);
		sqlQuery = sqlQuery.trim();

		if (!sqlQuery.toLowerCase().startsWith("select")) {
			throw new Error(`Failed to generate SQL query: ${rawResponse}`);
		}

		return sqlQuery;
	} catch (error) {
		console.error("Error generating SQL query:", error);
		throw new Error(`Failed to generate SQL query: ${error.message}`);
	}
}

// Create debounced version for input events
export const debouncedProcessQuery = debounce(processQuery, 300);

export async function processQuery() {
	if (!engine) {
		updateMessage(
			"<div class='error'>WebLLM is not initialized. Please initialize it first.</div>"
		);
		return;
	}

        const query = document.getElementById("query-input").value.trim();
        
        if (!query) {
        	updateMessage("<div class='error'>Please enter a question about countries.</div>");
        	return;
        }
        
        debugLog("Processing query:", query);
        
        // Check cache first
        const cacheKey = query.toLowerCase();
        const cachedResult = queryCache.get(cacheKey);
        
        if (cachedResult) {
        	debugLog("Using cached result for query:", query);
        	updateMessage(cachedResult.message);
        	highlightCountries(cachedResult.highlightCondition);
        	return;
        }
        
        updateMessage("<div class='processing'>🔍 Processing query...</div>");
        performanceMonitor.start('total-query-processing');

        try {
                performanceMonitor.start('sql-generation');
                const sqlQuery = await generateSQLQuery(query);
                const sqlGenTime = performanceMonitor.end('sql-generation');
                
                performanceMonitor.start('sql-execution');
                const queryResult = executeQuery(sqlQuery);
                const sqlExecTime = performanceMonitor.end('sql-execution');
                
                const totalProcessingTime = performanceMonitor.end('total-query-processing');



                // Create highlight condition function
                const highlightCondition = (layer) => {
                        const layerIso = layer.feature.properties.ISO_A3;
                        const layerName =
                                layer.feature.properties.NAME || layer.feature.properties.name;

                        debugLog("Evaluating layer", layerIso, layer.feature.properties);
                        const match = queryResult.some((result) => result.ISO_A3 === layerIso);
                        if (match) {
                                debugLog(`Matching country found: ${layerName} (${layerIso})`);
                        }
                        return match;
                };
                
                const highlightedCount = highlightCountries(highlightCondition);

		let highlightInfo;
		if (highlightedCount === 0) {
			highlightInfo = "No countries highlighted.";
		} else {
			const countryText = highlightedCount === 1 ? "country" : "countries";
			highlightInfo = `${highlightedCount} ${countryText} highlighted.`;
		}

                debugLog(
                        "Query result countries:",
                        queryResult.map((r) => `${r.name} (${r.ISO_A3})`)
                );
                
                const resultMessage = createResultMessage(
                        sqlQuery,
                        queryResult,
                        totalProcessingTime,
                        highlightInfo,
                        { sqlGenTime, sqlExecTime }
                );
                
                // Cache the result
                queryCache.set(cacheKey, {
                	message: resultMessage,
                	highlightCondition: highlightCondition
                });
                
                debugLog("Query result:", queryResult);
                updateMessage(resultMessage);

	} catch (error) {
		console.error("Error processing query:", error);
		let errorMessage = "<div class='error'>";
		if (error.message.startsWith("Failed to generate SQL query")) {
			errorMessage +=
				"I couldn't understand how to create a query for that request. Could you try rephrasing it?<br><br>";
			errorMessage += `LLM response: ${error.message.split(": ")[1]}`;
		} else if (error.message.startsWith("Error executing query")) {
			errorMessage +=
				"There was an error executing the SQL query. This might be due to an invalid query structure.<br><br>";
			errorMessage += `SQL Query: ${error.sqlQuery}<br>`;
			errorMessage += `Error details: ${error.message.split(": ")[1]}`;
		} else {
			errorMessage += `An unexpected error occurred: ${error.message}<br><br>`;
			if (error.sqlQuery) {
				errorMessage += `SQL Query: ${error.sqlQuery}`;
			}
		}
		errorMessage += "</div>";
		updateMessage(errorMessage);
	}
}

function createResultMessage(
	sqlQuery,
	queryResult,
	processingTime,
	highlightInfo,
	performanceMetrics = {}
) {
	queryResult.sort((a, b) => a.name.localeCompare(b.name));

	const countryCount = queryResult.length;
	const displayLimit = 5;
	let countriesList = "";
	let fullCountriesList = "";

	if (countryCount > 0) {
		const createCountryLink = (country) =>
			`<span class="country-link" data-iso="${country.ISO_A3}">${country.name}</span>`;

		const sampleCountries = queryResult
			.slice(0, displayLimit)
			.map(createCountryLink)
			.join(", ");
		fullCountriesList = queryResult.map(createCountryLink).join(", ");

		if (countryCount > displayLimit) {
			countriesList = `
		  <span>${sampleCountries}, and ${countryCount - displayLimit} more</span>
		  <a href="#" class="toggle-countries">(Show all)</a>
		  <span class="full-countries-list" style="display: none;">${fullCountriesList}</span>
		`;
		} else {
			countriesList = sampleCountries;
		}
	} else {
		countriesList = "No countries found";
	}

	let performanceDetails = "";
	if (performanceMetrics.sqlGenTime && performanceMetrics.sqlExecTime) {
		performanceDetails = `
			<div class="performance-breakdown" style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
				<strong>Performance:</strong> 
				SQL Generation: ${performanceMetrics.sqlGenTime.toFixed(1)}ms, 
				SQL Execution: ${performanceMetrics.sqlExecTime.toFixed(1)}ms
			</div>
		`;
	}

	const message = `
	  <div class="query-results">
		<h4>Query Results</h4>
		<div class="sql-query">
		  <strong>SQL Query:</strong>
		  <pre>${sqlQuery}</pre>
		</div>
		<div class="results-summary">
		  <strong>Results:</strong> ${countryCount} ${
		countryCount === 1 ? "country" : "countries"
	} found
		</div>
		<div class="countries-list">
		  <strong>Countries:</strong> ${countriesList}
		</div>
		<div class="processing-time">
		  <strong>Total processing time:</strong> ${processingTime.toFixed(2)}ms
		  ${performanceDetails}
		</div>
		<div class="highlight-info">
		  ${highlightInfo}
		</div>
	  </div>
	`;

	return message;
}
