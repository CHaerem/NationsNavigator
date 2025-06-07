import { CreateMLCEngine, deleteModelAllInfoInCache } from "https://esm.run/@mlc-ai/web-llm";
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
		size_mb: 5100, // ~5.1 GB
		description: "Llama-3.1-8B 💪 (Most Powerful)",
	},
	"Llama-3.2-3B-Instruct-q4f16_1-MLC": {
		model_id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
		size_mb: 1800, // ~1.8 GB
		description: "Llama-3.2-3B 🧠 (Balanced)",
	},
	"Llama-3.2-1B-Instruct-q4f16_1-MLC": {
		model_id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
		size_mb: 650, // ~650 MB
		description: "Llama-3.2-1B ⚡ (Fastest)",
	},
	"Qwen2.5-1.5B-Instruct-q4f16_1-MLC": {
		model_id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
		size_mb: 950, // ~950 MB
		description: "Qwen2.5-1.5B 🚀 (Efficient)",
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

        // Enhanced prompt with better guidance and examples
        const prompt = `You are a SQL expert helping users explore world countries data. Generate a SQL query for the countries table based on the user's request.

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

Generate ONLY the SQL query (no explanations). Ensure it follows the guidelines above.`;

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
        for (const key of Object.keys(modelConfigs)) {
                const modelId = modelConfigs[key].model_id;
                try {
                        await deleteModelAllInfoInCache(modelId);
                } catch (err) {
                        console.error(`Failed to clear cache for ${modelId}:`, err);
                }
        }
        updateMessage("<div>✅ All model caches cleared</div>");
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
        return modelConfigs;
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
        const capabilities = {
                ram: 'unknown',
                cores: 'unknown', 
                gpu: 'unknown',
                connection: 'unknown'
        };
        
        // RAM detection (only available in some browsers with certain flags)
        if ('deviceMemory' in navigator) {
                capabilities.ram = navigator.deviceMemory;
        }
        
        // CPU cores detection
        if ('hardwareConcurrency' in navigator) {
                capabilities.cores = navigator.hardwareConcurrency;
        }
        
        // Connection detection
        if ('connection' in navigator && navigator.connection) {
                capabilities.connection = navigator.connection.effectiveType || 'unknown';
        }
        
        // Try to detect GPU capabilities
        try {
                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        if (debugInfo) {
                                capabilities.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                        }
                }
        } catch (e) {
                // GPU detection failed, keep as 'unknown'
        }
        
        return capabilities;
}

export function getModelRecommendation(hardware) {
        const { ram, cores, connection, gpu } = hardware;
        
        // Calculate a hardware score for better recommendations
        let hardwareScore = 0;
        let limitations = [];
        let strengths = [];
        
        // RAM scoring and analysis
        if (ram && ram >= 16) {
                hardwareScore += 40;
                strengths.push(`${ram}GB RAM (Excellent)`);
        } else if (ram && ram >= 8) {
                hardwareScore += 25;
                strengths.push(`${ram}GB RAM (Good)`);
        } else if (ram && ram >= 4) {
                hardwareScore += 15;
                limitations.push(`${ram}GB RAM (Limited)`);
        } else if (ram) {
                hardwareScore += 5;
                limitations.push(`${ram}GB RAM (Very Limited)`);
        } else {
                limitations.push("RAM unknown (assume limited)");
        }
        
        // CPU scoring
        if (cores && cores >= 8) {
                hardwareScore += 20;
                strengths.push(`${cores} CPU cores (Excellent)`);
        } else if (cores && cores >= 4) {
                hardwareScore += 15;
                strengths.push(`${cores} CPU cores (Good)`);
        } else if (cores && cores >= 2) {
                hardwareScore += 10;
                limitations.push(`${cores} CPU cores (Basic)`);
        } else if (cores) {
                hardwareScore += 5;
                limitations.push(`${cores} CPU core (Limited)`);
        }
        
        // GPU detection bonus
        if (gpu && gpu !== 'unknown' && !gpu.includes('Software')) {
                hardwareScore += 10;
                strengths.push("Hardware GPU detected");
        }
        
        // Connection speed consideration
        let connectionAdjustment = "";
        if (connection === '4g' || connection === '5g') {
                strengths.push(`${connection.toUpperCase()} connection (Fast)`);
        } else if (connection === '3g') {
                limitations.push("3G connection (Slow downloads)");
                hardwareScore -= 10;
                connectionAdjustment = " Consider starting with smaller model due to slow connection.";
        } else if (connection === 'slow-2g' || connection === '2g') {
                limitations.push("2G connection (Very slow downloads)");
                hardwareScore -= 20;
                connectionAdjustment = " Strongly recommend smallest model due to very slow connection.";
        }
        
        // Determine recommendation based on score
        let recommended, reason, confidence;
        
        if (hardwareScore >= 60) {
                recommended = "Llama-3.1-8B-Instruct-q4f16_1-MLC";
                confidence = "High";
                reason = `🚀 Your hardware is excellent! The most powerful model should run smoothly.${connectionAdjustment}`;
        } else if (hardwareScore >= 40) {
                recommended = "Llama-3.2-3B-Instruct-q4f16_1-MLC";
                confidence = "Medium-High";
                reason = `⚡ Good hardware detected. Balanced model offers great performance without overloading your system.${connectionAdjustment}`;
        } else if (hardwareScore >= 25) {
                recommended = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
                confidence = "Medium";
                reason = `💡 Moderate hardware detected. Efficient model provides good results with reasonable resource usage.${connectionAdjustment}`;
        } else {
                recommended = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
                confidence = "Conservative";
                reason = `🔋 Optimized for your hardware. Fastest model ensures smooth operation on your device.${connectionAdjustment}`;
        }
        
        // Override for very slow connections regardless of other hardware
        if (connection === 'slow-2g' || connection === '2g') {
                recommended = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
                reason = "🐌 Very slow connection detected. Starting with smallest model (650MB) for faster download.";
                confidence = "Connection-Limited";
        }
        
        return { 
                modelId: recommended, 
                reason, 
                confidence,
                hardwareScore,
                strengths,
                limitations
        };
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

