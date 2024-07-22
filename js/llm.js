import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
import { updateLLMStatus, updateMessage } from "./ui.js";
import { highlightCountries } from "./map.js";
import { countryData } from "./data.js";

let engine;
let availableStats;
let exampleCountry;

export async function initWebLLM() {
	const initProgressCallback = (progressObj) => {
		const progressText = `Initializing WebLLM: ${
			progressObj.text
		} (${progressObj.progress.toFixed(2)}%)`;
		updateLLMStatus(progressText);
	};

	try {
		console.log("Starting WebLLM initialization...");
		engine = await CreateMLCEngine("Phi-3-mini-4k-instruct-q4f16_1-MLC-1k", {
			initProgressCallback,
			context_window_size: 1024,
		});
		console.log("WebLLM initialized successfully");
		updateLLMStatus("WebLLM ready");

		// Extract available stats and example country data
		extractAvailableStatsAndExampleCountry();
	} catch (error) {
		console.error("Error initializing WebLLM:", error);
		updateLLMStatus("Failed to initialize WebLLM");
	}
}

function extractAvailableStatsAndExampleCountry() {
	exampleCountry = Object.values(countryData)[0];
	availableStats = Object.keys(exampleCountry).filter(
		(key) => typeof exampleCountry[key] !== "object" && key !== "ISO_A3"
	);
	console.log("Available stats:", availableStats);
	console.log("Example country data:", exampleCountry);
}

async function generateQueryPlan(query) {
	console.log("Generating query plan for:", query);

	const prompt = `You are an AI assistant specializing in geographical data analysis. You're working with a comprehensive dataset of country information from restcountries.com. Your task is to create a precise query plan to answer questions about countries.

	Available fields in the dataset:
	${availableStats.join(", ")}

	Example country data:
	${JSON.stringify(exampleCountry, null, 2)}

	User Query: "${query}"

	Create a query plan that includes:
	1. Relevant statistics: Choose fields from the available list that are necessary to answer the query.
	2. Filters: Specify conditions to narrow down the countries based on the query. Include ALL relevant aspects, such as geographical constraints, numerical comparisons, and text searches.
	3. Sorting: If the query implies an order, specify how to sort the results.
	4. Limit: Determine if a specific number of results is required.

	Guidelines:
	- Use 'region' or 'subregion' for continental or geographical area filters.
	- Use 'flagColors' for queries about flag characteristics.
	- For population or area queries, use numerical comparisons (greaterThan, lessThan).
	- For language queries, use the 'contains' operation on the 'languages' field.
	- Be precise with filter values, matching them exactly to the data format (e.g., "North America" for region, not just "America").

	Respond ONLY with a single JSON object in this format:
	{
	"relevantStats": ["stat1", "stat2", ...],
	"filters": [
		{ "field": "statName", "operation": "equals|contains|greaterThan|lessThan", "value": "filterValue" }
	],
	"sort": { "field": "statName", "order": "asc|desc" } or null,
	"limit": number or null
	}

	If you cannot generate a valid query plan, respond with: { "error": "Unable to generate query plan" }`;

	console.log("Prompt being sent to LLM:", prompt);

	try {
		console.log("Sending query to WebLLM for query plan generation");
		const reply = await engine.chat.completions.create({
			messages: [{ role: "user", content: prompt }],
			temperature: 0.3,
			max_tokens: 300,
		});

		const content = reply.choices[0].message.content.trim();
		console.log("Received raw response from WebLLM:", content);

		// Extract the first JSON object from the response
		const jsonRegex = /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/;
		const jsonMatch = content.match(jsonRegex);
		if (!jsonMatch) {
			throw new Error("No valid JSON found in the response");
		}

		let jsonContent = jsonMatch[0];
		console.log("Extracted JSON content:", jsonContent);

		// Remove trailing commas
		jsonContent = jsonContent.replace(/,\s*([\]}])/g, "$1");

		const queryPlan = JSON.parse(jsonContent);
		console.log("Parsed query plan:", queryPlan);

		if (queryPlan.error) {
			throw new Error(queryPlan.error);
		}

		if (!queryPlan.relevantStats || !Array.isArray(queryPlan.relevantStats)) {
			throw new Error("Invalid query plan: missing or invalid relevantStats");
		}

		if (!queryPlan.filters || !Array.isArray(queryPlan.filters)) {
			throw new Error("Invalid query plan: missing or invalid filters");
		}

		return queryPlan;
	} catch (error) {
		console.error("Error generating query plan:", error);
		throw new Error(`Failed to generate query plan: ${error.message}`);
	}
}

function executeQueryPlan(queryPlan) {
	console.log("Executing query plan:", queryPlan);

	if (!queryPlan.filters || !Array.isArray(queryPlan.filters)) {
		console.warn("Query plan has no filters, returning all countries");
		return Object.values(countryData);
	}

	let result = Object.values(countryData);

	// Apply filters
	queryPlan.filters.forEach((filter) => {
		result = result.filter((country) => {
			if (!country.hasOwnProperty(filter.field)) {
				console.warn(`Field "${filter.field}" not found in country data`);
				return true; // Skip this filter if the field doesn't exist
			}
			const value = country[filter.field];
			switch (filter.operation) {
				case "equals":
					return value === filter.value;
				case "contains":
					if (Array.isArray(value)) {
						return value.some((v) =>
							v.toLowerCase().includes(filter.value.toLowerCase())
						);
					} else if (typeof value === "string") {
						return value.toLowerCase().includes(filter.value.toLowerCase());
					}
					return false;
				case "greaterThan":
					return value > filter.value;
				case "lessThan":
					return value < filter.value;
				default:
					console.warn(
						`Unknown operation "${filter.operation}" for field "${filter.field}"`
					);
					return true;
			}
		});
	});

	// Apply sort
	if (queryPlan.sort?.field) {
		if (result.length > 0 && result[0].hasOwnProperty(queryPlan.sort.field)) {
			const { field, order } = queryPlan.sort;
			result.sort((a, b) => {
				if (order === "asc") {
					return a[field] > b[field] ? 1 : -1;
				} else {
					return a[field] < b[field] ? 1 : -1;
				}
			});
		} else {
			console.warn(
				`Sort field "${queryPlan.sort.field}" not found in country data`
			);
		}
	}

	// Apply limit
	if (queryPlan.limit) {
		result = result.slice(0, queryPlan.limit);
	}

	return result.map((country) => {
		const relevantData = { name: country.name, ISO_A3: country.ISO_A3 };
		queryPlan.relevantStats.forEach((stat) => {
			if (country.hasOwnProperty(stat)) {
				relevantData[stat] = country[stat];
			} else {
				console.warn(`Relevant stat "${stat}" not found in country data`);
			}
		});
		return relevantData;
	});
}

function formatResponse(queryResult, query, queryPlan, processingTime) {
	console.log("Formatting response for query:", query);

	const countryCount = queryResult.length;

	// Create a concise description of the filters
	const filterDescription = queryPlan.filters
		.map((filter) => `${filter.field} ${filter.operation} ${filter.value}`)
		.join(", ");

	// Create the concise result message
	const resultMessage = `${filterDescription}. ${countryCount} ${
		countryCount === 1 ? "country" : "countries"
	} found. Time: ${processingTime}ms`;

	console.log("Formatted result message:", resultMessage);
	console.log(
		"Countries to highlight:",
		queryResult.map((country) => country.ISO_A3)
	);

	return {
		answer: resultMessage,
		highlight: queryResult.map((country) => country.ISO_A3),
		description: resultMessage,
	};
}

export async function processQuery() {
	if (!engine) {
		updateMessage("WebLLM is not initialized. Please initialize it first.");
		return;
	}

	const query = document.getElementById("query-input").value;
	console.log("Processing query:", query);
	updateMessage("Processing query...");

	const startTime = performance.now();

	try {
		console.time("Query processing");

		console.time("Generate query plan");
		const queryPlan = await generateQueryPlan(query);
		console.timeEnd("Generate query plan");

		console.time("Execute query plan");
		const queryResult = executeQueryPlan(queryPlan);
		console.timeEnd("Execute query plan");

		const endTime = performance.now();
		const processingTime = (endTime - startTime).toFixed(2);

		console.time("Format response");
		const response = formatResponse(
			queryResult,
			query,
			queryPlan,
			processingTime
		);
		console.timeEnd("Format response");

		console.timeEnd("Query processing");

		console.log("Final response:", response);

		updateMessage(response.answer);

		highlightCountries(
			(country) =>
				response.highlight.includes(country.feature.properties.ISO_A3),
			response.description
		);
	} catch (error) {
		console.error("Error processing query:", error);
		updateMessage(
			`An error occurred while processing your query: ${error.message}. Please try rephrasing your question or check the console for more details.`
		);
	}
}
