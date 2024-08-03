import { initMap, resetMap, highlightCountry } from "./map.js";
import { fetchCountryData } from "./data.js";
import { initWebLLM, processQuery } from "./llm.js";
import { setupEventListeners, updateMessage } from "./ui.js";

async function init() {
	try {
		await fetchCountryData();
		await initMap();
		updateMessage(
			"Map loaded successfully. You can now interact with the map while the model loads."
		);
		initWebLLM();
		setupEventListeners();
	} catch (error) {
		console.error("Initialization error:", error);
		updateMessage(
			"Error initializing the application. Some features may be unavailable."
		);
	}
}

// Initialize the application
init();

export { processQuery, resetMap, highlightCountry };
