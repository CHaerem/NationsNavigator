import { initMap, resetMap, highlightCountry } from "./map.js";
import { fetchCountryData } from "./data.js";
import { initWebLLM, processQuery, processQueryWithTools } from "./llm.js";
import { UIManager } from "./components/UIManager.js";
import { addNetworkListeners, isOnline } from "./utils.js";
import { uiService } from "./services/UIService.js";
// Dynamic import for development-only performance testing

// Create UI manager instance
const uiManager = new UIManager();

// Connect UI service to manager
uiService.setUIManager(uiManager);

async function init() {
	try {
		// Step 1: Initialize UI Manager first
		uiManager.init(handleQuerySubmit, handleAdvancedQuerySubmit);
		
		// Step 2: Check network status at startup
		if (!isOnline()) {
			uiManager.updateMessage("<div class='error'>⚠️ No internet connection detected. Some features may not work properly.</div>");
		}
		
		// Step 3: Add network status monitoring
		addNetworkListeners((online) => {
			if (online) {
				uiManager.updateMessage("🌐 Internet connection restored.");
			} else {
				uiManager.updateMessage("<div class='error'>⚠️ Internet connection lost. Some features may not work properly.</div>");
			}
		});

		// Step 4: Load country data
		uiManager.updateMessage("<div class='processing'>📦 Loading country data...</div>");
		await fetchCountryData();
		
		// Step 5: Initialize map
		uiManager.updateMessage("<div class='processing'>🗺️ Initializing interactive map...</div>");
		await initMap();
		
		uiManager.updateMessage(
			"✅ Map loaded successfully! You can click on countries while the AI model loads in the background."
		);
		
		// Step 6: Initialize WebLLM (non-blocking)
		const selectedModel = document.getElementById("llm-select").value;
		initWebLLM(selectedModel);
		
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
		
		uiManager.updateMessage(errorMessage);
		
		// Try to at least setup basic event listeners if not already done
		try {
			if (!uiManager.isInitialized) {
				uiManager.init(handleQuerySubmit);
			}
		} catch (listenerError) {
			console.error("Failed to setup event listeners:", listenerError);
		}
	}
}

function handleQuerySubmit() {
	const searchBtn = document.getElementById("search-btn");
	if (!searchBtn.disabled) {
		processQuery();
	} else {
		uiManager.updateMessage(`
			<div class='error'>
				🤖 AI model is still loading. Please wait a moment...
				<br><small>Try a simpler model if this takes too long.</small>
			</div>
		`);
	}
}

function handleAdvancedQuerySubmit() {
	const searchBtn = document.getElementById("search-btn");
	if (!searchBtn.disabled) {
		processQueryWithTools();
	} else {
		uiManager.updateMessage(`
			<div class='error'>
				🤖 AI model is still loading. Please wait a moment...
				<br><small>Try a simpler model if this takes too long.</small>
			</div>
		`);
	}
}

// Initialize the application
init();

// Global functions for browser console access
window.showPerformanceDashboard = () => uiManager.showPerformanceDashboard();
window.runQuickPerformanceTest = async () => {
	try {
		const performanceModule = await import("./PerformanceBenchmark.js");
		return performanceModule.runQuickPerformanceTest();
	} catch (e) {
		console.log("Performance testing not available in production build");
		return null;
	}
};
window.uiManager = uiManager;

// Export functions that other modules need
export { processQuery, resetMap, highlightCountry };

// Export legacy functions for backwards compatibility
export function updateCountryInfo(props) {
	uiService.updateCountryInfo(props);
}

export function updateMessage(message) {
	uiService.updateMessage(message);
}

export function updateLLMStatus(status) {
	uiService.updateLLMStatus(status);
}
