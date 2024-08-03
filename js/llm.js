import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
import { updateLLMStatus, updateMessage } from "./ui.js";
import { highlightCountries } from "./map.js";
import { getAvailableStats, getExampleCountry, executeQuery } from "./data.js";

let engine;

const modelConfig = {
	model: "https://huggingface.co/mlc-ai/Llama-3.1-8B-Instruct-q4f16_1-MLC",
	model_id: "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k",
	context_window_size: 1024,
};

export async function initWebLLM() {
	const initProgressCallback = (progressObj) => {
		const progressText = `Initializing WebLLM: ${
			progressObj.text
		} (${progressObj.progress.toFixed(2)}%)`;
		updateLLMStatus(progressText);
	};

	try {
		console.log("Starting WebLLM initialization...");
		engine = await CreateMLCEngine(modelConfig.model_id, {
			initProgressCallback,
			context_window_size: modelConfig.context_window_size,
		});
		console.log("WebLLM initialized successfully");
		updateLLMStatus("WebLLM ready");
	} catch (error) {
		console.error("Error initializing WebLLM:", error);
		updateLLMStatus("Failed to initialize WebLLM");
	}
}

async function generateSQLQuery(query) {
	const availableStats = getAvailableStats();
	const exampleCountry = getExampleCountry();

	const prompt = `Generate a SQL query for the countries table based on the user's request.
  
  Available fields: ${availableStats.join(", ")}
  
  Example row:
  ${JSON.stringify(exampleCountry, null, 2)}
  
  Guidelines:
  1. Always include 'name' and 'ISO_A3' in SELECT
  2. Use LIKE '%value%' for partial string matches
  3. 'languages' and 'flagColors' are comma-separated strings
  4. Exact matches for region/subregion (e.g., 'Europe')
  
  User Query: "${query}"
  
  Respond with only the SQL query.`;

	console.log("Prompt being sent to LLM:", prompt);

	try {
		console.log("Sending query to WebLLM for SQL query generation");
		const reply = await engine.chat.completions.create({
			messages: [{ role: "user", content: prompt }],
			temperature: 0.3,
			max_tokens: 300,
		});

		const sqlQuery = reply.choices[0].message.content.trim();
		console.log("Received SQL query from WebLLM:", sqlQuery);

		if (!sqlQuery.toLowerCase().startsWith("select")) {
			throw new Error(`Failed to generate SQL query: ${sqlQuery}`);
		}

		return sqlQuery;
	} catch (error) {
		console.error("Error generating SQL query:", error);
		throw new Error(`Failed to generate SQL query: ${error.message}`);
	}
}

export async function processQuery() {
	if (!engine) {
		updateMessage(
			"<div class='error'>WebLLM is not initialized. Please initialize it first.</div>"
		);
		return;
	}

	const query = document.getElementById("query-input").value;
	console.log("Processing query:", query);
	updateMessage("<div class='processing'>Processing query...</div>");

	const startTime = performance.now();

	try {
		console.time("Query processing");

		console.time("Generate SQL query");
		const sqlQuery = await generateSQLQuery(query);
		console.timeEnd("Generate SQL query");

		console.time("Execute SQL query");
		const queryResult = executeQuery(sqlQuery);
		console.timeEnd("Execute SQL query");

		const endTime = performance.now();
		const processingTime = endTime - startTime;

		const countryCount = queryResult.length;
		let highlightedCount = 0;

		highlightCountries((country) => {
			const isHighlighted = queryResult.some(
				(result) => result.ISO_A3 === country.feature.properties.ISO_A3
			);
			if (isHighlighted) highlightedCount++;
			return isHighlighted;
		}, "");

		const highlightInfo =
			highlightedCount === 0
				? "No countries highlighted."
				: `${highlightedCount} ${
						highlightedCount === 1 ? "country" : "countries"
				  } highlighted.`;

		const resultMessage = createResultMessage(
			sqlQuery,
			queryResult,
			processingTime,
			highlightInfo
		);
		console.log("Query result:", queryResult);
		updateMessage(resultMessage);

		console.timeEnd("Query processing");
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
	highlightInfo
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
		  <strong>Processing time:</strong> ${processingTime.toFixed(2)}ms
		</div>
		<div class="highlight-info">
		  ${highlightInfo}
		</div>
	  </div>
	`;

	return message;
}
