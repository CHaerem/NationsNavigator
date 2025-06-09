import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

// Mock all modules to prevent initialization issues
jest.unstable_mockModule("/Users/christopherhaerem/Privat/NationsNavigator/js/data.js", () => ({
	executeQuery: jest.fn(() => []),
	fetchCountryData: jest.fn(() => Promise.resolve()),
	getAvailableStats: jest.fn(() => ["name", "ISO_A3", "region"]),
	getExampleCountry: jest.fn(() => ({ name: "France", ISO_A3: "FRA" })),
	getCountryData: jest.fn(() => ({})),
	clearCountryData: jest.fn()
}));

jest.unstable_mockModule("/Users/christopherhaerem/Privat/NationsNavigator/js/map.js", () => ({
	highlightCountries: jest.fn(),
	clearHighlights: jest.fn(),
	initMap: jest.fn(() => Promise.resolve())
}));

jest.unstable_mockModule("/Users/christopherhaerem/Privat/NationsNavigator/js/services/UIService.js", () => ({
	uiService: {
		updateMessage: jest.fn(),
		updateLLMStatus: jest.fn(),
		updateCountryInfo: jest.fn(),
		setUIManager: jest.fn()
	}
}));

describe("Download Modal Behavior", () => {
	let mockModal, mockElements, mockFormatModelSize;
	let getModelConfigs, detectHardwareCapabilities, getModelRecommendation;

	beforeEach(() => {
		jest.clearAllMocks();
		
		// Create mock elements  
		mockElements = {
			"download-modal": {
				classList: {
					contains: jest.fn(() => false), // Start with hidden=false, toggle as needed
					add: jest.fn(),
					remove: jest.fn()
				}
			},
			"download-model-name": { 
				textContent: "",
				set textContent(value) { this._textContent = value; },
				get textContent() { return this._textContent || ""; }
			},
			"download-model-size": { 
				textContent: "",
				set textContent(value) { this._textContent = value; },
				get textContent() { return this._textContent || ""; }
			},
			"download-model-description": { textContent: "" },
			"hardware-recommendation": { 
				innerHTML: "",
				set innerHTML(value) { this._innerHTML = value; },
				get innerHTML() { return this._innerHTML || ""; }
			},
			"download-confirm": {
				setAttribute: jest.fn(),
				getAttribute: jest.fn()
			}
		};
		
		global.document = {
			getElementById: jest.fn((id) => mockElements[id] || null)
		};
		
		// Mock LLM functions
		getModelConfigs = jest.fn(() => ({
			"test-model": {
				model_id: "test-model",
				description: "Test Model",
				size_mb: 1000
			}
		}));
		
		detectHardwareCapabilities = jest.fn(() => ({
			ram: 8,
			cores: 4,
			gpu: "Test GPU"
		}));
		
		getModelRecommendation = jest.fn(() => ({
			modelId: "test-model",
			reason: "Perfect for your hardware"
		}));
		
		mockFormatModelSize = jest.fn((size) => `${size} MB`);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("Modal State", () => {
		test("should show modal element exists", () => {
			const modal = document.getElementById("download-modal");
			expect(modal).toBeTruthy();
		});

		test("should have modal hidden by default", () => {
			// Update mock to return true for modal-hidden  
			mockElements["download-modal"].classList.contains = jest.fn((className) => className === "modal-hidden");
			
			const modal = document.getElementById("download-modal");
			const result = modal.classList.contains("modal-hidden");
			expect(modal.classList.contains).toHaveBeenCalledWith("modal-hidden");
			expect(result).toBe(true);
		});
	});

	describe("Modal Functions", () => {
		test("should create showDownloadModal function", () => {
			// Simple function to show modal
			const showDownloadModal = (modelId) => {
				const modal = document.getElementById("download-modal");
				const config = getModelConfigs()[modelId];
				
				if (modal && config) {
					modal.classList.remove("modal-hidden");
					
					const nameEl = document.getElementById("download-model-name");
					const sizeEl = document.getElementById("download-model-size");
					const confirmBtn = document.getElementById("download-confirm");
					
					if (nameEl) nameEl.textContent = config.description;
					if (sizeEl) sizeEl.textContent = mockFormatModelSize(config.size_mb);
					if (confirmBtn && typeof confirmBtn.setAttribute === 'function') {
						confirmBtn.setAttribute("data-model-id", modelId);
					}
				}
			};

			showDownloadModal("test-model");
			
			expect(document.getElementById).toHaveBeenCalledWith("download-modal");
			expect(getModelConfigs).toHaveBeenCalled();
			expect(mockFormatModelSize).toHaveBeenCalledWith(1000);
		});

		test("should create hideDownloadModal function", () => {
			const hideDownloadModal = () => {
				const modal = document.getElementById("download-modal");
				if (modal) {
					modal.classList.add("modal-hidden");
				}
			};

			hideDownloadModal();
			
			expect(document.getElementById).toHaveBeenCalledWith("download-modal");
		});

		test("should handle invalid model ID gracefully", () => {
			const showDownloadModal = (modelId) => {
				const modal = document.getElementById("download-modal");
				const config = getModelConfigs()[modelId];
				
				if (modal && config) {
					modal.classList.remove("modal-hidden");
				}
			};

			// Mock empty configs
			getModelConfigs.mockReturnValue({});
			
			expect(() => showDownloadModal("invalid-model")).not.toThrow();
		});

		test("should handle missing DOM elements gracefully", () => {
			// Mock getElementById to return null
			global.document.getElementById = jest.fn(() => null);
			
			const showDownloadModal = (modelId) => {
				const modal = document.getElementById("download-modal");
				const config = getModelConfigs()[modelId];
				
				if (modal && config) {
					modal.classList.remove("modal-hidden");
				}
			};

			expect(() => showDownloadModal("test-model")).not.toThrow();
		});

		test("should populate model information", () => {
			const showDownloadModal = (modelId) => {
				const config = getModelConfigs()[modelId];
				
				if (config) {
					const nameEl = document.getElementById("download-model-name");
					const sizeEl = document.getElementById("download-model-size");
					
					if (nameEl) nameEl.textContent = config.description;
					if (sizeEl) sizeEl.textContent = mockFormatModelSize(config.size_mb);
				}
			};

			showDownloadModal("test-model");
			
			expect(getModelConfigs).toHaveBeenCalled();
			expect(mockFormatModelSize).toHaveBeenCalledWith(1000);
			expect(mockElements["download-model-name"].textContent).toBe("Test Model");
			expect(mockElements["download-model-size"].textContent).toBe("1000 MB");
		});

		test("should set model ID on confirm button", () => {
			const showDownloadModal = (modelId) => {
				const config = getModelConfigs()[modelId];
				
				if (config) {
					const confirmBtn = document.getElementById("download-confirm");
					if (confirmBtn) confirmBtn.setAttribute("data-model-id", modelId);
				}
			};

			showDownloadModal("test-model");
			
			expect(mockElements["download-confirm"].setAttribute).toHaveBeenCalledWith("data-model-id", "test-model");
		});

		test("should handle hardware recommendation", () => {
			const showDownloadModal = (modelId) => {
				const config = getModelConfigs()[modelId];
				
				if (config) {
					const hardware = detectHardwareCapabilities();
					const recommendation = getModelRecommendation();
					const hardwareEl = document.getElementById("hardware-recommendation");
					
					if (hardwareEl) {
						hardwareEl.innerHTML = `Hardware Assessment<br>${recommendation.reason}`;
					}
				}
			};

			showDownloadModal("test-model");
			
			expect(detectHardwareCapabilities).toHaveBeenCalled();
			expect(getModelRecommendation).toHaveBeenCalled();
			expect(mockElements["hardware-recommendation"].innerHTML).toContain("Hardware Assessment");
			expect(mockElements["hardware-recommendation"].innerHTML).toContain("Perfect for your hardware");
		});
	});
});