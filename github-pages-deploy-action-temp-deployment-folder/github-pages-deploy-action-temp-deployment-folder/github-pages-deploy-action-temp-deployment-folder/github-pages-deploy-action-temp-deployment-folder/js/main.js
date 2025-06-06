import { initMap, resetMap, highlightCountry } from "./map.js";
import { fetchCountryData } from "./data.js";
import { initWebLLM, processQuery } from "./llm.js";
import { setupEventListeners, updateMessage } from "./ui.js";
import { addNetworkListeners, isOnline } from "./utils.js";

async function init() {
	// Check network status at startup
	if (!isOnline()) {
		updateMessage("<div class='error'>⚠️ No internet connection detected. Some features may not work properly.</div>");
	}
	
	// Add network status monitoring
	addNetworkListeners((online) => {
		if (online) {
			updateMessage("🌐 Internet connection restored.");
		} else {
			updateMessage("<div class='error'>⚠️ Internet connection lost. Some features may not work properly.</div>");
		}
	});

	try {
		// Step 1: Load country data
		updateMessage("<div class='processing'>📦 Loading country data...</div>");
		await fetchCountryData();
		
		// Step 2: Initialize map
		updateMessage("<div class='processing'>🗺️ Initializing interactive map...</div>");
		await initMap();
		
		updateMessage(
			"✅ Map loaded successfully! You can click on countries while the AI model loads in the background."
		);
		
		// Step 3: Initialize WebLLM (non-blocking)
		const selectedModel = document.getElementById("llm-select").value;
		initWebLLM(selectedModel);
		
		// Step 4: Setup event listeners
		setupEventListeners();
		
	} catch (error) {
		console.error("Initialization error:", error);
		
		// Provide specific error messages based on failure point
		let errorMessage = "<div class='error'>";
		if (error.message.includes("country data")) {
			errorMessage += "❌ Failed to load country data. The map may not work properly.<br>";
			errorMessage += "💡 Please check your internet connection and refresh the page.";
		} else if (error.message.includes("map")) {
			errorMessage += "❌ Failed to initialize the map. Please check your browser compatibility.<br>";
			errorMessage += "💡 Ensure JavaScript is enabled and try refreshing the page.";
		} else {
			errorMessage += `❌ Application initialization failed: ${error.message}<br>`;
			errorMessage += "💡 Please refresh the page to try again.";
		}
		errorMessage += "</div>";
		
		updateMessage(errorMessage);
		
		// Try to at least setup basic event listeners
		try {
			setupEventListeners();
		} catch (listenerError) {
			console.error("Failed to setup event listeners:", listenerError);
		}
	}
}

// Initialize the application
init();

export { processQuery, resetMap, highlightCountry };
