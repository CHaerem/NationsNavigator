import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
import { updateLLMStatus, updateMessage } from "./ui.js";
import { highlightCountries } from "./map.js";
import { countryData } from "./data.js";

let engine;

export async function initWebLLM() {
	const initProgressCallback = (progressObj) => {
		// console.log("WebLLM init progress:", progressObj);
		const progressText = `Initializing WebLLM: ${
			progressObj.text
		} (${progressObj.progress.toFixed(2)}%)`;
		updateLLMStatus(progressText);
	};

	try {
		console.log("Starting WebLLM initialization...");
		engine = await CreateMLCEngine("Llama-3-8B-Instruct-q4f32_1-MLC", {
			initProgressCallback,
			context_window_size: 8192,
		});
		console.log("WebLLM initialized successfully");
		updateLLMStatus("WebLLM ready");
	} catch (error) {
		console.error("Error initializing WebLLM:", error);
		updateLLMStatus("Failed to initialize WebLLM");
	}
}

async function generateQueryPlan(query) {
	console.log("Generating query plan for:", query);

	const systemPrompt = `You are an AI assistant tasked with creating a query plan to answer questions about countries. Given a user query, your task is to determine:
	1. Which statistics are needed to answer the query
	2. Any filtering or comparison operations needed
	3. How many countries should be considered (if applicable)
	
	Available statistics: name, population, languages, area, capital, region, subregion, flagColors, cca3
	
	Respond with a JSON object containing the following fields:
	{
	  "relevantStats": ["stat1", "stat2", ...],
	  "filterConditions": "JavaScript boolean expression for filtering, using 'country' as the object, e.g., 'country.region.toLowerCase().includes('europe')'",
	  "comparisonOperation": "JavaScript comparison function for sorting, e.g., '(a, b) => b.population - a.population'",
	  "limit": number of countries to consider (or "all" if not applicable),
	  "aggregation": "any aggregation operation needed, e.g., 'sum', 'average', 'count', or 'none'"
	}
	
	Your response should be a valid JSON object and nothing else. Do not include any explanations or additional text outside the JSON object.`;

	const messages = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: query },
	];

	try {
		console.log("Sending query to LLM for query plan generation");
		const reply = await Promise.race([
			engine.chat.completions.create({
				messages: messages,
				temperature: 0.3,
				max_tokens: 150,
			}),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error("LLM timeout")), 10000)
			),
		]);

		const content = reply.choices[0].message.content.trim();
		console.log("Received query plan from LLM:", content);
		const queryPlan = JSON.parse(content);
		console.log("Parsed query plan:", queryPlan);
		return queryPlan;
	} catch (error) {
		console.error("Error generating query plan:", error);
		return {
			relevantStats: ["name", "capital", "region"],
			filterConditions: "country.region.toLowerCase().includes('europe')",
			comparisonOperation: "none",
			limit: "all",
			aggregation: "none",
		};
	}
}

function executeQueryPlan(queryPlan) {
	console.log("Executing query plan:", queryPlan);

	const {
		relevantStats,
		filterConditions,
		comparisonOperation,
		limit,
		aggregation,
	} = queryPlan;

	console.log("Filtering relevant country data");
	let result = Object.values(countryData);

	// Inspect the structure of the first country object
	console.log(
		"Sample country data structure:",
		JSON.stringify(result[0], null, 2)
	);

	// Apply filter conditions
	if (filterConditions) {
		console.log("Applying filter conditions:", filterConditions);
		try {
			// Create a more flexible filter function
			const filterFunc = (country) => {
				// For safety, we'll check if the property exists before using it
				const regionInfo =
					(country.region && country.region.toLowerCase()) ||
					(country.subregion && country.subregion.toLowerCase()) ||
					"";
				return regionInfo.includes("europe");
			};

			const beforeFilterCount = result.length;
			result = result.filter(filterFunc);
			const afterFilterCount = result.length;

			console.log(
				`Filtered results: ${afterFilterCount} countries (before: ${beforeFilterCount})`
			);
			console.log(
				"Sample of filtered country data:",
				result.slice(0, 5).map((c) => c.name)
			);
		} catch (error) {
			console.error("Error applying filter:", error);
		}
	}

	// Apply comparison operation
	if (comparisonOperation && comparisonOperation !== "none") {
		console.log("Applying comparison operation:", comparisonOperation);
		try {
			const compareFunc = new Function(
				"a",
				"b",
				`return ${comparisonOperation}`
			);
			result.sort(compareFunc);
			console.log("Results sorted");
			console.log(
				"Sample of sorted country data:",
				result.slice(0, 5).map((c) => c.name)
			);
		} catch (error) {
			console.error("Error applying comparison:", error);
		}
	}

	// Apply limit
	if (limit !== "all" && typeof limit === "number") {
		console.log(`Limiting results to ${limit} countries`);
		result = result.slice(0, limit);
		console.log(
			"Limited country data:",
			result.map((c) => c.name)
		);
	}

	// Apply aggregation
	let aggregatedResult = result;
	if (aggregation !== "none") {
		console.log("Applying aggregation:", aggregation);
		switch (aggregation) {
			case "sum":
				aggregatedResult = result.reduce(
					(acc, country) => acc + country[relevantStats[0]],
					0
				);
				break;
			case "average":
				aggregatedResult =
					result.reduce((acc, country) => acc + country[relevantStats[0]], 0) /
					result.length;
				break;
			case "count":
				aggregatedResult = result.length;
				break;
		}
		console.log("Aggregated result:", aggregatedResult);
	}

	return { result, aggregatedResult };
}

function formatResponse(queryResult, query) {
	console.log("Formatting response for query:", query);
	const { result, aggregatedResult } = queryResult;
	let answer = "";
	let highlight = [];

	if (typeof aggregatedResult === "number") {
		answer = `The ${query} is ${aggregatedResult}.`;
	} else if (result.length === 0) {
		answer = "No countries match the given criteria.";
	} else {
		answer = `Here are the results for your query "${query}":\n\n`;
		result.forEach((country) => {
			answer += `${country.name}`;
			if (country.capital && country.capital.length > 0) {
				answer += ` (Capital: ${country.capital[0]})`;
			}
			answer += "\n";
			if (country.cca3) {
				highlight.push(country.cca3);
			} else if (country.ISO_A3) {
				highlight.push(country.ISO_A3);
			}
		});
	}

	console.log("Formatted answer:", answer);
	console.log("Countries to highlight:", highlight);

	return {
		answer,
		highlight,
		description: `Countries matching the query: ${query}`,
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

	try {
		console.time("Query processing");

		console.time("Generate query plan");
		const queryPlan = await generateQueryPlan(query);
		console.timeEnd("Generate query plan");

		console.time("Execute query plan");
		const queryResult = executeQueryPlan(queryPlan);
		console.timeEnd("Execute query plan");

		console.time("Format response");
		const response = formatResponse(queryResult, query);
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
			"An error occurred while processing your query. Please try again."
		);
	}
}
