import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
import { getRelevantData } from "./data.js";
import { updateLLMStatus, updateMessage } from "./ui.js";
import { highlightCountries } from "./map.js";

let engine;

export async function initWebLLM() {
	const initProgressCallback = (progressObj) => {
		console.log("WebLLM init progress:", progressObj);
		const progressText = `Initializing WebLLM: ${
			progressObj.text
		} (${progressObj.progress.toFixed(2)}%)`;
		updateLLMStatus(progressText);
	};

	try {
		engine = await CreateMLCEngine("Llama-3-8B-Instruct-q4f32_1-MLC", {
			initProgressCallback,
		});
		console.log("WebLLM initialized");
		updateLLMStatus("WebLLM ready");
	} catch (error) {
		console.error("Error initializing WebLLM:", error);
		updateLLMStatus("Failed to initialize WebLLM");
	}
}

async function determineRelevantStat(query) {
	const statTypes = [
		"name",
		"population",
		"languages",
		"area",
		"capital",
		"region",
		"subregion",
		"flagColors",
		"ISO_A3",
	];

	const systemPrompt = `You are an AI assistant tasked with determining the most relevant country statistic for a given query. You will be provided with a list of available statistics and a user query. Your task is to select the most relevant statistic or statistics that would be needed to answer the query accurately. If multiple statistics are relevant, list them all. If no specific statistic is relevant or if the query requires general information, respond with "all".

Available statistics: ${statTypes.join(", ")}

Respond with only the name(s) of the relevant statistic(s) or "all", without any additional explanation.`;

	const messages = [
		{ role: "system", content: systemPrompt },
		{ role: "user", content: query },
	];

	try {
		const reply = await engine.chat.completions.create({
			messages: messages,
			temperature: 0.3,
			max_tokens: 50,
		});

		return reply.choices[0].message.content.toLowerCase().split(", ");
	} catch (error) {
		console.error("Error determining relevant stat:", error);
		return ["all"];
	}
}

export async function processQuery() {
	if (!engine) {
		updateMessage("WebLLM is not initialized. Please initialize it first.");
		return;
	}

	const query = document.getElementById("query-input").value;
	updateMessage("Processing query...");

	try {
		const relevantStats = await determineRelevantStat(query);
		const contextData = getRelevantData(relevantStats);

		const context = JSON.stringify(contextData);

		const systemPrompt = `You are a helpful AI assistant specialized in geography. You have access to a world map visualization tool and the following country data: ${context}

    The data provided includes the country name, ISO_A3 code, and the following statistics for each country: ${relevantStats.join(
			", "
		)}. When answering questions about countries, use this data to provide accurate information. If the question requires information not provided in this data, provide a general answer based on your knowledge.

    Format your answer in the following JSON structure:
    {
    "answer": "Your text answer here",
    "highlight": ["ISO_A3 codes of countries to highlight"],
    "description": "Brief description of why these countries are highlighted"
    }
    Use ISO_A3 country codes for the highlight array. If no countries need to be highlighted, use an empty array.`;

		const messages = [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: query },
		];

		const reply = await engine.chat.completions.create({
			messages: messages,
			temperature: 0.7,
			max_tokens: 500,
		});

		const response = JSON.parse(reply.choices[0].message.content);

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
