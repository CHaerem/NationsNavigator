import { CountryInfoComponent } from './CountryInfoComponent.js';
import { MessageDisplayComponent } from './MessageDisplayComponent.js';
import { SearchBarComponent } from './SearchBarComponent.js';
import { SettingsModalComponent } from './SettingsModalComponent.js';
import { DownloadModalComponent } from './DownloadModalComponent.js';
// Dynamic import for development-only performance dashboard
import { resetMap } from '../main.js';

export class UIManager {
	constructor() {
		this.components = {};
		this.isInitialized = false;
	}

	init(onQuerySubmit, onAdvancedQuerySubmit) {
		if (this.isInitialized) return;

		try {
			// Initialize all components
			this.components.countryInfo = new CountryInfoComponent();
			this.components.messageDisplay = new MessageDisplayComponent();
			this.components.searchBar = new SearchBarComponent(onQuerySubmit, onAdvancedQuerySubmit);
			this.components.settingsModal = new SettingsModalComponent();
			this.components.downloadModal = new DownloadModalComponent();
			
			// Performance dashboard will be initialized later if available
			this.components.performanceDashboard = null;

			// Initialize all components (except performance dashboard)
			Object.values(this.components).filter(c => c !== null).forEach(component => {
				component.init();
			});
			
			// Try to load performance dashboard asynchronously
			this.initPerformanceDashboard();

			// Store component instances on DOM elements for global access
			this.storeComponentInstances();

			// Setup global event listeners
			this.setupGlobalEventListeners();

			this.isInitialized = true;
		} catch (error) {
			console.error('Error initializing UIManager:', error);
			// Fall back to basic functionality
		}
	}

	storeComponentInstances() {
		// Store instances on DOM elements for global function access
		const settingsModalEl = document.getElementById('settings-modal');
		if (settingsModalEl) {
			settingsModalEl._componentInstance = this.components.settingsModal;
		}

		const downloadModalEl = document.getElementById('download-modal');
		if (downloadModalEl) {
			downloadModalEl._componentInstance = this.components.downloadModal;
		}
	}

	setupGlobalEventListeners() {
		// Reset button
		const resetBtn = document.getElementById('reset-btn');
		if (resetBtn) {
			resetBtn.addEventListener('click', resetMap);
		}

		// Global ESC key handler
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				this.components.settingsModal.hide();
				this.components.downloadModal.hide();
				this.components.performanceDashboard.hide();
			} else if (event.ctrlKey && event.shiftKey && event.key === 'P') {
				// Ctrl+Shift+P to open performance dashboard
				event.preventDefault();
				this.showPerformanceDashboard();
			}
		});
	}

	// Public API for updating UI components
	updateCountryInfo(props) {
		if (this.isInitialized && this.components.countryInfo) {
			this.components.countryInfo.update(props);
		}
	}

	updateMessage(message) {
		if (this.isInitialized && this.components.messageDisplay) {
			this.components.messageDisplay.update(message);
		} else {
			// Fallback for early calls
			const messageElement = document.getElementById('message');
			if (messageElement) {
				messageElement.innerHTML = message;
			}
		}
	}

	updateLLMStatus(status) {
		if (this.isInitialized && this.components.searchBar) {
			this.components.searchBar.updateSearchButton(status);
		}
		
		// Always update the status element directly
		const statusElement = document.getElementById('llm-status');
		if (statusElement) {
			statusElement.textContent = status;
		}
	}

	getQueryValue() {
		return this.isInitialized && this.components.searchBar ? this.components.searchBar.getValue() : '';
	}

	setQueryValue(value) {
		if (this.isInitialized && this.components.searchBar) {
			this.components.searchBar.setValue(value);
		}
	}

	focusQuery() {
		if (this.isInitialized && this.components.searchBar) {
			this.components.searchBar.focus();
		}
	}

	resetQuery() {
		if (this.isInitialized && this.components.searchBar) {
			this.components.searchBar.resetSearch();
		}
	}

	showSettingsModal() {
		if (this.isInitialized && this.components.settingsModal) {
			this.components.settingsModal.show();
		}
	}

	hideSettingsModal() {
		if (this.isInitialized && this.components.settingsModal) {
			this.components.settingsModal.hide();
		}
	}

	showDownloadModal(modelId) {
		if (this.isInitialized && this.components.downloadModal) {
			this.components.downloadModal.showForModel(modelId);
		}
	}

	hideDownloadModal() {
		if (this.isInitialized && this.components.downloadModal) {
			this.components.downloadModal.hide();
		}
	}

	async initPerformanceDashboard() {
		try {
			// Dynamic import to avoid 404 in production
			const { PerformanceDashboard } = await import('./PerformanceDashboard.js');
			this.components.performanceDashboard = new PerformanceDashboard();
			this.components.performanceDashboard.init();
		} catch (e) {
			// Performance dashboard not available in production - silently continue
			this.components.performanceDashboard = null;
		}
	}

	showPerformanceDashboard() {
		if (this.isInitialized && this.components.performanceDashboard) {
			this.components.performanceDashboard.show();
		} else {
			console.log("Performance dashboard not available in production build");
		}
	}

	hidePerformanceDashboard() {
		if (this.isInitialized && this.components.performanceDashboard) {
			this.components.performanceDashboard.hide();
		}
	}

	// Note: toggleCountriesList legacy function removed - use messageDisplay component directly

	destroy() {
		Object.values(this.components).forEach(component => {
			if (component.destroy) {
				component.destroy();
			}
		});
		this.components = {};
		this.isInitialized = false;
	}
}

// Create singleton instance
export const uiManager = new UIManager();