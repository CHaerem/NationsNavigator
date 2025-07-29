import { CreateMLCEngine, deleteModelAllInfoInCache } from "https://esm.run/@mlc-ai/web-llm";
import { uiService } from "./services/UIService.js";
import { highlightCountries } from "./map.js";
import { getAvailableStats, getExampleCountry, executeQuery } from "./data.js";
import { debugLog, debugTime, debugTimeEnd } from "./debug.js";
import { retryOperation, createRetryButton, formatError, isOnline, QueryCache, PerformanceMonitor, debounce } from "./utils.js";
import { MODEL_CONFIGS, DEFAULT_MODEL, HardwareRecommendation } from "./config/ModelConfig.js";
import { QueryAnalyzer } from "./QueryAnalyzer.js";
import { CountryTools, formatToolResult } from "./CountryTools.js";

let engine;
const queryCache = new QueryCache();
const performanceMonitor = new PerformanceMonitor();

export async function initWebLLM(selectedModel) {
	// Provide default model if none selected (important for testing)
	const modelKey = selectedModel || DEFAULT_MODEL;
	const modelConfig = MODEL_CONFIGS[modelKey];

	if (!modelConfig) {
		console.error(`Unknown model: ${modelKey}`);
		uiService.updateLLMStatus("Failed to initialize WebLLM - Unknown model");
		return;
	}

	// Check network status and warn if offline (but still try to initialize)
	if (!isOnline()) {
		uiService.updateLLMStatus("⚠️ Offline mode - trying to use cached model files");
		uiService.updateMessage("<div class='processing'>⚠️ No internet connection. Attempting to load model from browser cache...</div>");
	}

	const initProgressCallback = (progressObj) => {
		const progressText = `Initializing WebLLM: ${
			progressObj.text
		} (${progressObj.progress.toFixed(2)}%)`;
		uiService.updateLLMStatus(progressText);
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
                uiService.updateLLMStatus("✅ WebLLM ready");
                if (!isOnline()) {
                	uiService.updateMessage("✅ Model loaded successfully from cache! The app is fully functional offline.");
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
                
                uiService.updateLLMStatus("❌ WebLLM initialization failed");
                uiService.updateMessage(`<div class='error'>${errorMessage}</div>`);
        }
}

// Enhanced function that returns both SQL and analysis
export async function generateEnhancedSQLQuery(query) {
	const availableStats = getAvailableStats();
	const exampleCountry = getExampleCountry();

	// Analyze the query for better understanding
	const queryAnalysis = QueryAnalyzer.analyzeQuery(query);
	debugLog("Query analysis result:", queryAnalysis);

        // Enhanced prompt with structured JSON output and analysis context
        const prompt = `You are a SQL expert helping users explore world countries data. Generate a structured response for the user's request.

QUERY ANALYSIS:
Intent: ${queryAnalysis.intent}
Complexity: ${queryAnalysis.complexity}
Extracted entities: ${JSON.stringify(queryAnalysis.entities)}
${queryAnalysis.suggestions.length > 0 ? `Suggestions: ${queryAnalysis.suggestions.join(', ')}` : ''}

DATABASE SCHEMA:
Table: countries
Available fields: ${availableStats.join(", ")}

SAMPLE DATA:
${JSON.stringify(exampleCountry, null, 2)}

IMPORTANT GUIDELINES:
1. ALWAYS include 'name' and 'ISO_A3' in SELECT clause
2. Use LIKE '%value%' for partial string matches (case-insensitive)
3. Fields like 'languages', 'currencies', 'borders' contain comma-separated values
4. For flag queries, use 'flagDescription' field (contains detailed flag descriptions)
5. Population and area are numeric fields - use comparison operators (>, <, =)
6. Common regions: Europe, Asia, Africa, Americas, Oceania
7. Add ORDER BY name for consistent results

QUERY PATTERNS & EXAMPLES:

Geographic Queries:
- "Countries in Europe" → SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' ORDER BY name
- "Largest countries by area" → SELECT name, ISO_A3 FROM countries ORDER BY area DESC LIMIT 10
- "Most populated countries" → SELECT name, ISO_A3 FROM countries ORDER BY population DESC LIMIT 10

Language & Culture:
- "Spanish speaking countries" → SELECT name, ISO_A3 FROM countries WHERE languages LIKE '%Spanish%' ORDER BY name
- "Countries using Euro" → SELECT name, ISO_A3 FROM countries WHERE currencies LIKE '%Euro%' ORDER BY name

Flag Descriptions:
- "Countries with red flags" → SELECT name, ISO_A3 FROM countries WHERE flagDescription LIKE '%red%' ORDER BY name
- "Countries with stars on flags" → SELECT name, ISO_A3 FROM countries WHERE flagDescription LIKE '%star%' ORDER BY name
- "Countries with crosses in flags" → SELECT name, ISO_A3 FROM countries WHERE flagDescription LIKE '%cross%' ORDER BY name

Complex Combinations:
- "European countries with crosses" → SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' AND flagDescription LIKE '%cross%' ORDER BY name
- "Island nations in Pacific" → SELECT name, ISO_A3 FROM countries WHERE (name LIKE '%island%' OR flagDescription LIKE '%island%') AND region = 'Oceania' ORDER BY name

Border Queries:
- "Countries bordering France" → SELECT name, ISO_A3 FROM countries WHERE borders LIKE '%France%' ORDER BY name

Size & Population:
- "Countries larger than 1 million km²" → SELECT name, ISO_A3 FROM countries WHERE area > 1000000 ORDER BY area DESC
- "Countries with population over 100M" → SELECT name, ISO_A3 FROM countries WHERE population > 100000000 ORDER BY population DESC

USER QUERY: "${query}"

Respond with ONLY a JSON object in this exact format:
{
  "sql": "THE_SQL_QUERY_HERE",
  "explanation": "Brief explanation of what this query does",
  "queryType": "geographic|population|language|flag|complex|other",
  "confidence": 0.95,
  "intent": "${queryAnalysis.intent}",
  "complexity": "${queryAnalysis.complexity}",
  "suggestions": []
}

Ensure the SQL query follows all guidelines above.`;

        debugLog("Prompt being sent to LLM:", prompt);

        try {
                debugLog("Sending query to WebLLM for enhanced SQL query generation");
                const reply = await engine.chat.completions.create({
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.3,
                        max_tokens: 400,
                        response_format: { type: "json_object" }
                });

                const rawResponse = reply.choices[0].message.content.trim();
                debugLog("Received enhanced structured response from WebLLM:", rawResponse);

		const structuredResponse = JSON.parse(rawResponse);
		
		// Validate the structured response
		if (!structuredResponse.sql || typeof structuredResponse.sql !== 'string') {
			throw new Error('Invalid structured response: missing or invalid SQL');
		}

		const sqlQuery = structuredResponse.sql.trim();
		
		if (!sqlQuery.toLowerCase().startsWith("select")) {
			throw new Error(`Generated SQL does not start with SELECT: ${sqlQuery}`);
		}

		// Return the full enhanced response
		return {
			sql: sqlQuery,
			analysis: queryAnalysis,
			llmResponse: structuredResponse
		};
	} catch (error) {
		console.error("Error generating enhanced SQL query:", error);
		throw new Error(`Failed to generate enhanced SQL query: ${error.message}`);
	}
}

// Note: Legacy generateSQLQuery function removed - use generateEnhancedSQLQuery instead

// Function calling query processing
export async function processQueryWithTools(query) {
	if (!engine) {
		uiService.updateMessage(
			"<div class='error'>WebLLM is not initialized. Please initialize it first.</div>"
		);
		return;
	}

	debugLog("Processing query with tools:", query);
	
	// Analyze the query first
	const queryAnalysis = QueryAnalyzer.analyzeQuery(query);
	
	// Check if this query might benefit from function calling
	const shouldUseFunctionCalling = queryAnalysis.complexity === 'medium' || 
		queryAnalysis.complexity === 'high' || 
		queryAnalysis.intent === 'complex';

	if (!shouldUseFunctionCalling) {
		// Fall back to regular SQL generation for simple queries
		return await processQuery();
	}

	uiService.updateMessage("<div class='processing'>🔧 Processing query with advanced tools...</div>");
	performanceMonitor.start('total-tool-processing');

	try {
		const tools = CountryTools.getToolDefinitions();
		
		const systemPrompt = `You are a country data expert assistant. You can use various tools to help answer questions about world countries. 

Available tools:
- search_countries: Find countries based on criteria
- get_country_details: Get detailed information about specific countries  
- compare_countries: Compare multiple countries
- get_statistics: Get statistical information

Use tools when appropriate to provide comprehensive answers. For simple queries, you can respond directly.`;

		performanceMonitor.start('llm-tool-call');
		const reply = await engine.chat.completions.create({
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: query }
			],
			tools: tools,
			tool_choice: "auto",
			temperature: 0.3,
			max_tokens: 500
		});
		const llmTime = performanceMonitor.end('llm-tool-call');

		const message = reply.choices[0].message;
		debugLog("LLM response with tools:", message);

		let finalResponse = "";
		let highlightCondition = null;

		// Handle tool calls if any
		if (message.tool_calls && message.tool_calls.length > 0) {
			performanceMonitor.start('tool-execution');
			
			for (const toolCall of message.tool_calls) {
				const { name, arguments: args } = toolCall.function;
				
				try {
					const parsedArgs = JSON.parse(args);
					const toolResult = await CountryTools.executeFunction(name, parsedArgs);
					
					// Format the result for display
					const formattedResult = formatToolResult(name, toolResult);
					finalResponse += formattedResult;
					
					// Create highlight condition if we have country results
					if (toolResult.countries && toolResult.countries.length > 0) {
						const countryIsos = toolResult.countries.map(c => c.ISO_A3);
						highlightCondition = (layer) => {
							const layerIso = layer.feature.properties.ISO_A3;
							return countryIsos.includes(layerIso);
						};
					}
					
				} catch (error) {
					debugLog(`Error executing tool ${name}:`, error);
					finalResponse += `<div class="error">Tool ${name} failed: ${error.message}</div>`;
				}
			}
			
			const toolTime = performanceMonitor.end('tool-execution');
			const totalTime = performanceMonitor.end('total-tool-processing');
			
			// Add performance info
			finalResponse += `
				<div class="tool-performance">
					<small>⚡ LLM: ${llmTime.toFixed(0)}ms, Tools: ${toolTime.toFixed(0)}ms, Total: ${totalTime.toFixed(0)}ms</small>
				</div>
			`;
			
		} else {
			// No tool calls, just return the LLM response
			finalResponse = `<div class="llm-response">${message.content}</div>`;
		}

		// Apply highlighting if we have a condition
		if (highlightCondition) {
			const highlightedCount = highlightCountries(highlightCondition);
			finalResponse += `<div class="highlight-info">${highlightedCount} countries highlighted on map</div>`;
		}

		uiService.updateMessage(finalResponse);

	} catch (error) {
		console.error("Error processing query with tools:", error);
		const errorMessage = `<div class='error'>Error using advanced tools: ${error.message}<br><br>Falling back to standard query processing...</div>`;
		uiService.updateMessage(errorMessage);
		
		// Fallback to regular processing
		setTimeout(() => processQuery(), 1000);
	}
}

// Create debounced version for input events
export const debouncedProcessQuery = debounce(processQuery, 300);
export const debouncedProcessQueryWithTools = debounce(processQueryWithTools, 300);

export async function processQuery() {
	if (!engine) {
		uiService.updateMessage(
			"<div class='error'>WebLLM is not initialized. Please initialize it first.</div>"
		);
		return;
	}

        const query = document.getElementById("query-input").value.trim();
        
        if (!query) {
        	uiService.updateMessage("<div class='error'>Please enter a question about countries.</div>");
        	return;
        }
        
        debugLog("Processing query:", query);
        
        // Check cache first
        const cacheKey = query.toLowerCase();
        const cachedResult = queryCache.get(cacheKey);
        
        if (cachedResult) {
        	debugLog("Using cached result for query:", query);
        	uiService.updateMessage(cachedResult.message);
        	highlightCountries(cachedResult.highlightCondition);
        	return;
        }
        
        uiService.updateMessage("<div class='processing'>🔍 Processing query...</div>");
        performanceMonitor.start('total-query-processing');

        try {
                performanceMonitor.start('sql-generation');
                const enhancedResult = await generateEnhancedSQLQuery(query);
                const sqlQuery = enhancedResult.sql;
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
                uiService.updateMessage(resultMessage);

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
		uiService.updateMessage(errorMessage);
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

	const message = `
	  <div class="query-results-simple">
		<div class="results-header">
			<span class="results-count">${countryCount} ${countryCount === 1 ? "country" : "countries"} found</span>
			<span class="results-time">${processingTime.toFixed(0)}ms</span>
		</div>
		
		<div class="countries-list-simple">
		  ${countriesList}
		</div>
		
		<div class="results-actions">
			<button class="show-sql-btn" data-target="sql-details">
				<span>Show SQL</span>
				<span class="sql-icon">▼</span>
			</button>
			<div class="sql-details" id="sql-details" style="display: none;">
				<pre>${sqlQuery}</pre>
				${performanceMetrics.sqlGenTime ? `<div class="perf-details">
					SQL Gen: ${performanceMetrics.sqlGenTime.toFixed(1)}ms, 
					Execution: ${performanceMetrics.sqlExecTime.toFixed(1)}ms
				</div>` : ''}
			</div>
		</div>
		
		<div class="highlight-status">
		  ${highlightInfo}
		</div>
	  </div>
	`;

        return message;
}

export async function clearAllModelCache() {
        for (const key of Object.keys(MODEL_CONFIGS)) {
                const modelId = MODEL_CONFIGS[key].model_id;
                try {
                        await deleteModelAllInfoInCache(modelId);
                } catch (err) {
                        console.error(`Failed to clear cache for ${modelId}:`, err);
                }
        }
        uiService.updateMessage("<div>✅ All model caches cleared</div>");
}

export async function deleteModelCache(modelId) {
        try {
                console.log(`Starting deletion of ${modelId}...`);
                
                // Step 1: Use WebLLM's built-in cache clearing
                await deleteModelAllInfoInCache(modelId);
                console.log(`WebLLM deleteModelAllInfoInCache completed for ${modelId}`);
                
                // Step 2: Manually clear Cache API entries (since WebLLM might not clear them all)
                if ('caches' in window) {
                        const cacheNames = ['webllm/model', 'webllm/config', 'webllm/wasm'];
                        
                        for (const cacheName of cacheNames) {
                                try {
                                        const cache = await caches.open(cacheName);
                                        const requests = await cache.keys();
                                        
                                        // Find and delete all requests that contain this model ID
                                        const deletedUrls = [];
                                        for (const request of requests) {
                                                if (request.url.includes(modelId) || 
                                                    request.url.toLowerCase().includes(modelId.toLowerCase())) {
                                                        await cache.delete(request);
                                                        deletedUrls.push(request.url);
                                                }
                                        }
                                        
                                        if (deletedUrls.length > 0) {
                                                console.log(`Deleted ${deletedUrls.length} entries from ${cacheName}:`, deletedUrls);
                                        }
                                } catch (err) {
                                        console.warn(`Failed to clear ${cacheName} for ${modelId}:`, err);
                                }
                        }
                }
                
                console.log(`✅ Successfully deleted ${modelId} from all caches`);
                return true;
        } catch (err) {
                console.error(`Failed to clear cache for ${modelId}:`, err);
                return false;
        }
}

export function getModelConfigs() {
        return MODEL_CONFIGS;
}

export async function checkModelCacheStatus(modelId) {
        try {
                // Models are stored in Cache API under 'webllm/model'
                if ('caches' in window) {
                        try {
                                const cache = await caches.open('webllm/model');
                                const requests = await cache.keys();
                                
                                // Check if any cached request URL contains this model ID
                                const hasModel = requests.some(request => {
                                        const url = request.url;
                                        return url.includes(modelId) || 
                                               url.toLowerCase().includes(modelId.toLowerCase());
                                });
                                
                                return hasModel;
                        } catch (err) {
                                console.warn(`Could not access webllm/model cache: ${err.message}`);
                        }
                }
                
                return false;
        } catch (err) {
                console.warn(`Could not check cache status for ${modelId}:`, err);
                return false;
        }
}



let currentActiveModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export function getCurrentActiveModel() {
        return currentActiveModel;
}

export function setCurrentActiveModel(modelId) {
        currentActiveModel = modelId;
}

// Hardware detection for model recommendations
export function detectHardwareCapabilities() {
	return HardwareRecommendation.detectCapabilities();
}


export function getModelRecommendation(hardware) {
	return HardwareRecommendation.getRecommendation(hardware);
}


// Debug function to inspect browser storage
export async function debugBrowserStorage() {
        console.log('=== BROWSER STORAGE DEBUG ===');
        
        // Check localStorage
        console.log('LocalStorage keys:', Object.keys(localStorage));
        
        // Check IndexedDB databases
        if ('indexedDB' in window) {
                try {
                        // Try to list all databases (modern browsers)
                        if (indexedDB.databases) {
                                const databases = await indexedDB.databases();
                                console.log('IndexedDB databases:', databases.map(db => db.name));
                                
                                // Check each database
                                for (const dbInfo of databases) {
                                        try {
                                                const request = indexedDB.open(dbInfo.name);
                                                request.onsuccess = (event) => {
                                                        const db = event.target.result;
                                                        console.log(`Database ${dbInfo.name} stores:`, Array.from(db.objectStoreNames));
                                                        db.close();
                                                };
                                        } catch (err) {
                                                console.log(`Could not inspect ${dbInfo.name}:`, err);
                                        }
                                }
                        } else {
                                console.log('indexedDB.databases() not supported, trying common names...');
                                const commonNames = ['webllm-cache', 'mlc-cache', 'model-cache', 'huggingface-cache'];
                                for (const name of commonNames) {
                                        try {
                                                const request = indexedDB.open(name);
                                                request.onsuccess = (event) => {
                                                        const db = event.target.result;
                                                        console.log(`Database ${name} stores:`, Array.from(db.objectStoreNames));
                                                        db.close();
                                                };
                                                request.onerror = () => {
                                                        console.log(`Database ${name}: not found`);
                                                };
                                        } catch (err) {
                                                console.log(`Could not check ${name}:`, err);
                                        }
                                }
                        }
                } catch (err) {
                        console.log('Error checking IndexedDB:', err);
                }
        }
        
        // Check Cache API with detailed URL inspection
        if ('caches' in window) {
                try {
                        const cacheNames = await caches.keys();
                        console.log('Cache API caches:', cacheNames);
                        
                        // Inspect the webllm/model cache specifically
                        for (const cacheName of cacheNames) {
                                try {
                                        const cache = await caches.open(cacheName);
                                        const requests = await cache.keys();
                                        console.log(`Cache "${cacheName}" contains ${requests.length} entries:`);
                                        
                                        // Log first 10 URLs to see the pattern
                                        requests.slice(0, 10).forEach((request, index) => {
                                                console.log(`  ${index + 1}. ${request.url}`);
                                        });
                                        
                                        if (requests.length > 10) {
                                                console.log(`  ... and ${requests.length - 10} more entries`);
                                        }
                                } catch (err) {
                                        console.log(`Could not inspect cache "${cacheName}":`, err);
                                }
                        }
                } catch (err) {
                        console.log('Error checking Cache API:', err);
                }
        }
        
        console.log('=== END DEBUG ===');
}


// Test helper function - only for testing
export function setEngineForTests(testEngine) {
	engine = testEngine;
}
