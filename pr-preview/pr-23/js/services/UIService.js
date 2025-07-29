// Service to handle UI updates without circular dependencies
class UIService {
	constructor() {
		this.uiManager = null;
	}

	setUIManager(uiManager) {
		this.uiManager = uiManager;
	}

	updateMessage(message) {
		// Use UIManager if available
		if (this.uiManager?.isInitialized) {
			this.uiManager.updateMessage(message);
			return;
		}
		
		// Fallback to direct DOM manipulation if UIManager not available
		const messageElement = document.getElementById("message");
		if (messageElement) {
			messageElement.innerHTML = message;
		}
	}

	updateLLMStatus(status) {
		// Use UIManager if available
		if (this.uiManager?.isInitialized) {
			this.uiManager.updateLLMStatus(status);
			return;
		}
		
		// Fallback to direct DOM manipulation if UIManager not available
		const statusElement = document.getElementById("llm-status");
		if (statusElement) {
			statusElement.textContent = status;
		}
	}

	updateCountryInfo(props) {
		if (this.uiManager?.isInitialized) {
			this.uiManager.updateCountryInfo(props);
		}
	}
}

// Create singleton instance
export const uiService = new UIService();