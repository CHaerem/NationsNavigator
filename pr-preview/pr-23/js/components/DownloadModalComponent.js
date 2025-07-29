import { ModalComponent } from './ModalComponent.js';
import { getModelConfigs, detectHardwareCapabilities, getModelRecommendation, initWebLLM } from '../llm.js';

export class DownloadModalComponent extends ModalComponent {
	constructor() {
		super('#download-modal');
		this.downloadConfirm = document.getElementById('download-confirm');
		this.downloadCancel = document.getElementById('download-cancel');
		this.modelNameEl = document.getElementById('download-model-name');
		this.modelSizeEl = document.getElementById('download-model-size');
		this.modelDescEl = document.getElementById('download-model-description');
		this.recommendationEl = document.getElementById('hardware-recommendation');
	}

	setupEventListeners() {
		super.setupEventListeners();

		if (this.downloadCancel) {
			this.downloadCancel.addEventListener('click', () => {
				this.hide();
			});
		}

		if (this.downloadConfirm) {
			this.downloadConfirm.addEventListener('click', () => {
				this.handleModelDownload();
			});
		}
	}

	showForModel(modelId) {
		const modelConfigs = getModelConfigs();
		const config = Object.values(modelConfigs).find(c => c.model_id === modelId);
		
		if (!config) {
			console.error('Model config not found:', modelId);
			return;
		}
		
		if (!this.modelNameEl || !this.modelSizeEl || !this.modelDescEl || !this.recommendationEl || !this.downloadConfirm) {
			console.error('Download modal elements not found');
			return;
		}
		
		// Update modal content
		this.modelNameEl.textContent = config.description || modelId;
		this.modelSizeEl.textContent = this.formatModelSize(config.size_mb);
		this.modelDescEl.textContent = `Download and use ${config.description} for AI-powered country queries.`;
		
		// Get hardware recommendation
		const hardware = detectHardwareCapabilities();
		const recommendation = getModelRecommendation(hardware);
		
		// Update hardware recommendation
		this.updateHardwareRecommendation(recommendation, modelId, config, modelConfigs);
		
		// Store the model ID for download
		this.downloadConfirm.setAttribute('data-model-id', modelId);
		
		// Show the modal
		this.show();
	}

	updateHardwareRecommendation(recommendation, modelId, config, modelConfigs) {
		let recommendationClass = 'optimal';
		let recommendationIcon = '✅';
		
		if (recommendation.modelId !== modelId) {
			if (config.size_mb > 3000) {
				recommendationClass = 'warning';
				recommendationIcon = '⚠️';
			} else {
				recommendationClass = 'optimal';
				recommendationIcon = '💡';
			}
		}
		
		this.recommendationEl.className = `hardware-recommendation ${recommendationClass}`;
		this.recommendationEl.innerHTML = `
			<strong>${recommendationIcon} Hardware Assessment:</strong><br>
			${recommendation.modelId === modelId ? recommendation.reason : `Recommended: ${modelConfigs[recommendation.modelId]?.description}. ${recommendation.reason}`}
		`;
	}

	async handleModelDownload() {
		if (!this.downloadConfirm) {
			console.error('Download confirm button not found');
			return;
		}
		
		const modelId = this.downloadConfirm.getAttribute('data-model-id');
		if (!modelId) {
			console.error('No model ID found for download');
			return;
		}
		
		// Update button state
		const originalText = this.downloadConfirm.textContent;
		this.downloadConfirm.disabled = true;
		this.downloadConfirm.textContent = 'Downloading...';
		
		try {
			// Hide the download modal
			this.hide();
			
			// Start the download by initializing WebLLM with the selected model
			await initWebLLM(modelId);
			
			// Refresh the model list in settings if open
			const settingsModal = document.getElementById('settings-modal');
			if (settingsModal && settingsModal._componentInstance) {
				await settingsModal._componentInstance.refreshModelList();
			}
			
		} catch (error) {
			console.error('Download failed:', error);
			alert(`Failed to download model: ${error.message}`);
		} finally {
			// Reset button state
			this.downloadConfirm.disabled = false;
			this.downloadConfirm.textContent = originalText;
		}
	}

	formatModelSize(sizeMB) {
		if (!sizeMB) return "Unknown size";
		
		if (sizeMB >= 1000) {
			return `${(sizeMB / 1000).toFixed(1)} GB`;
		} else {
			return `${sizeMB} MB`;
		}
	}
}

// Make showDownloadModal globally available for onclick handlers
window.showDownloadModal = function(modelId) {
	const downloadModal = document.getElementById('download-modal');
	if (downloadModal && downloadModal._componentInstance) {
		downloadModal._componentInstance.showForModel(modelId);
	}
};