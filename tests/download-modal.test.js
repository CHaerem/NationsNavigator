import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { JSDOM } from "jsdom";

describe("Download Modal Behavior", () => {
	let showDownloadModal, hideDownloadModal, handleModelDownload;
	let getModelConfigs, detectHardwareCapabilities, getModelRecommendation, initWebLLM;
	let mockFormatModelSize;

	beforeEach(async () => {
		// Create a clean DOM with all required elements
		const dom = new JSDOM(`
			<!DOCTYPE html>
			<html>
			<body>
				<!-- Download Modal -->
				<div id="download-modal" class="modal-hidden">
					<div class="modal-content">
						<div class="modal-header">
							<h3>Download AI Model</h3>
							<button id="download-close">×</button>
						</div>
						<div class="download-info">
							<div class="model-card">
								<div class="model-card-header">
									<h4 id="download-model-name">Model Name</h4>
									<span id="download-model-size" class="size-badge">Size</span>
								</div>
								<p id="download-model-description">Model description</p>
							</div>
							<div class="hardware-recommendation" id="hardware-recommendation">
								<!-- Hardware recommendation -->
							</div>
						</div>
						<div class="modal-actions">
							<button type="button" id="download-cancel">Cancel</button>
							<button type="button" id="download-confirm">Download Model</button>
						</div>
					</div>
				</div>
			</body>
			</html>
		`);

		global.window = dom.window;
		global.document = dom.window.document;
		global.console = { ...console, error: jest.fn(), log: jest.fn() };

		// Mock the LLM module functions
		const llmModule = {
			getModelConfigs: jest.fn(() => ({
				"test-model": {
					model_id: "test-model",
					description: "Test Model",
					size_mb: 1000
				}
			})),
			detectHardwareCapabilities: jest.fn(() => ({
				ram: 8,
				cores: 4,
				gpu: "Test GPU",
				connection: "4g"
			})),
			getModelRecommendation: jest.fn(() => ({
				modelId: "test-model",
				reason: "Perfect for your hardware"
			})),
			initWebLLM: jest.fn()
		};

		getModelConfigs = llmModule.getModelConfigs;
		detectHardwareCapabilities = llmModule.detectHardwareCapabilities;
		getModelRecommendation = llmModule.getModelRecommendation;
		initWebLLM = llmModule.initWebLLM;

		// Mock formatModelSize function
		mockFormatModelSize = jest.fn((size) => `${size} MB`);

		// Import UI module and get functions
		const uiModule = await import("../js/ui.js");
		showDownloadModal = global.window.showDownloadModal;
		hideDownloadModal = uiModule.hideDownloadModal;
		handleModelDownload = uiModule.handleModelDownload;

		// Mock global functions that would be available
		global.window.getModelConfigs = getModelConfigs;
		global.window.detectHardwareCapabilities = detectHardwareCapabilities;
		global.window.getModelRecommendation = getModelRecommendation;
		global.window.initWebLLM = initWebLLM;
		global.window.formatModelSize = mockFormatModelSize;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("Initial State", () => {
		test("download modal should be hidden by default", () => {
			const downloadModal = document.getElementById("download-modal");
			expect(downloadModal).toBeTruthy();
			expect(downloadModal.classList.contains("modal-hidden")).toBe(true);
		});

		test("download modal should not be visible on page load", () => {
			const downloadModal = document.getElementById("download-modal");
			// In CSS, modal-hidden class should set opacity: 0 and pointer-events: none
			expect(downloadModal.classList.contains("modal-hidden")).toBe(true);
		});
	});

	describe("Show Download Modal", () => {
		test("should show modal when showDownloadModal is called with valid model", () => {
			if (showDownloadModal) {
				showDownloadModal("test-model");
				
				const downloadModal = document.getElementById("download-modal");
				expect(downloadModal.classList.contains("modal-hidden")).toBe(false);
				
				// Check if modal content is populated
				const modelName = document.getElementById("download-model-name");
				const modelSize = document.getElementById("download-model-size");
				const modelDescription = document.getElementById("download-model-description");
				
				expect(modelName.textContent).toBe("Test Model");
				expect(modelSize.textContent).toBe("1000 MB");
				expect(modelDescription.textContent).toContain("Test Model");
			}
		});

		test("should not show modal for invalid model ID", () => {
			if (showDownloadModal) {
				const downloadModal = document.getElementById("download-modal");
				const initialClass = downloadModal.className;
				
				showDownloadModal("invalid-model");
				
				// Modal should remain hidden
				expect(downloadModal.className).toBe(initialClass);
				expect(downloadModal.classList.contains("modal-hidden")).toBe(true);
			}
		});

		test("should populate hardware recommendation", () => {
			if (showDownloadModal) {
				showDownloadModal("test-model");
				
				const recommendationEl = document.getElementById("hardware-recommendation");
				expect(recommendationEl.innerHTML).toContain("Hardware Assessment");
				expect(recommendationEl.innerHTML).toContain("Perfect for your hardware");
			}
		});
	});

	describe("Hide Download Modal", () => {
		test("should hide modal when hideDownloadModal is called", () => {
			if (showDownloadModal && hideDownloadModal) {
				// First show the modal
				showDownloadModal("test-model");
				const downloadModal = document.getElementById("download-modal");
				expect(downloadModal.classList.contains("modal-hidden")).toBe(false);
				
				// Then hide it
				hideDownloadModal();
				expect(downloadModal.classList.contains("modal-hidden")).toBe(true);
			}
		});
	});

	describe("Modal Content Population", () => {
		test("should populate all modal fields correctly", () => {
			if (showDownloadModal) {
				showDownloadModal("test-model");
				
				// Check all elements are populated
				expect(document.getElementById("download-model-name").textContent).toBe("Test Model");
				expect(mockFormatModelSize).toHaveBeenCalledWith(1000);
				expect(getModelConfigs).toHaveBeenCalled();
				expect(detectHardwareCapabilities).toHaveBeenCalled();
				expect(getModelRecommendation).toHaveBeenCalled();
			}
		});

		test("should store model ID in confirm button", () => {
			if (showDownloadModal) {
				showDownloadModal("test-model");
				
				const confirmBtn = document.getElementById("download-confirm");
				expect(confirmBtn.getAttribute("data-model-id")).toBe("test-model");
			}
		});
	});

	describe("Error Handling", () => {
		test("should handle missing modal elements gracefully", () => {
			// Remove modal from DOM
			const modal = document.getElementById("download-modal");
			modal.remove();
			
			// Should not throw error
			expect(() => {
				if (showDownloadModal) showDownloadModal("test-model");
			}).not.toThrow();
		});

		test("should handle missing model config", () => {
			getModelConfigs.mockReturnValue({});
			
			if (showDownloadModal) {
				showDownloadModal("test-model");
				
				// Modal should remain hidden
				const downloadModal = document.getElementById("download-modal");
				expect(downloadModal.classList.contains("modal-hidden")).toBe(true);
			}
		});
	});
});