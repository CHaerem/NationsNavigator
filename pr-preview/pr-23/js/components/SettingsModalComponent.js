import { ModalComponent } from './ModalComponent.js';
import { clearAllModelCache, deleteModelCache, getModelConfigs, checkModelCacheStatus, getCurrentActiveModel, debugBrowserStorage, detectHardwareCapabilities, getModelRecommendation } from '../llm.js';

export class SettingsModalComponent extends ModalComponent {
	constructor() {
		super('#settings-modal');
		this.settingsBtn = document.getElementById('settings-btn');
		this.modelList = document.getElementById('model-list');
		this.hardwareInfo = document.getElementById('hardware-info');
		this.clearAllCacheBtn = document.getElementById('clear-all-cache-btn');
		this.refreshModelsBtn = document.getElementById('refresh-models-btn');
		this.debugStorageBtn = document.getElementById('debug-storage-btn');
	}

	setupEventListeners() {
		super.setupEventListeners();

		// Settings button
		if (this.settingsBtn) {
			this.settingsBtn.addEventListener('click', () => {
				this.show();
			});
		}

		// Model management buttons
		if (this.clearAllCacheBtn) {
			this.clearAllCacheBtn.addEventListener('click', async () => {
				await clearAllModelCache();
				await this.refreshModelList();
			});
		}

		if (this.refreshModelsBtn) {
			this.refreshModelsBtn.addEventListener('click', () => {
				this.refreshModelList();
			});
		}

		if (this.debugStorageBtn) {
			this.debugStorageBtn.addEventListener('click', async () => {
				await debugBrowserStorage();
				alert("Debug info logged to console. Open Developer Tools (F12) to see the results.");
			});
		}
	}

	onShow() {
		this.refreshModelList();
		setTimeout(() => {
			this.updateHardwareInfo();
		}, 200);
	}

	async refreshModelList() {
		if (!this.modelList) return;

		const modelConfigs = getModelConfigs();
		const activeModel = getCurrentActiveModel();
		
		const hardware = detectHardwareCapabilities();
		const recommendation = getModelRecommendation(hardware);
		
		this.modelList.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">Checking model status...</div>';
		
		let modelItems = '';
		
		for (const config of Object.values(modelConfigs)) {
			const modelId = config.model_id;
			const isActive = modelId === activeModel;
			const isCached = await checkModelCacheStatus(modelId);
			const isRecommended = modelId === recommendation.modelId;
			
			const displayName = config.description || modelId;
			const sizeText = this.formatModelSize(config.size_mb);
			
			const statusBadges = this.generateStatusBadges(isActive, isRecommended, isCached);
			
			modelItems += `
				<div class="model-item ${isRecommended ? 'model-recommended' : ''}">
					<div class="model-info">
						<div class="model-name">
							${displayName}
							${isRecommended ? ' 🎯' : ''}
						</div>
						<div class="model-size">${sizeText}</div>
						<div class="model-status">
							${statusBadges}
						</div>
					</div>
					<div class="model-actions">
						${this.generateModelActions(modelId, isCached, isActive, isRecommended)}
					</div>
				</div>
			`;
		}
		
		this.modelList.innerHTML = modelItems || '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">No models found</div>';
		
		setTimeout(() => {
			this.updateHardwareInfo();
		}, 100);
	}

	generateStatusBadges(isActive, isRecommended, isCached) {
		const badges = [];
		if (isActive) badges.push('<span class="status-badge status-active">Active</span>');
		if (isRecommended) badges.push('<span class="status-badge status-recommended">Recommended</span>');
		if (isCached) {
			badges.push('<span class="status-badge status-cached">Downloaded</span>');
		} else {
			badges.push('<span class="status-badge status-not-cached">Not Downloaded</span>');
		}
		return badges.join('');
	}

	generateModelActions(modelId, isCached, isActive, isRecommended) {
		if (isCached) {
			return `<button class="model-delete-btn" onclick="deleteIndividualModel('${modelId}')" ${isActive ? 'disabled title="Cannot delete active model"' : ''}>
				🗑️ Delete
			</button>`;
		} else {
			return `<button class="model-download-btn ${isRecommended ? 'recommended' : ''}" onclick="showDownloadModal('${modelId}')">
				📥 ${isRecommended ? 'Download (Recommended)' : 'Download'}
			</button>`;
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

	updateHardwareInfo() {
		if (!this.hardwareInfo) return;

		try {
			const hardware = detectHardwareCapabilities();
			const recommendation = getModelRecommendation(hardware);
			
			const detected = Object.values(hardware).filter(val => val !== 'unknown').length;
			const total = Object.keys(hardware).length;
			
			const modelConfigs = getModelConfigs();
			const recommendedConfig = Object.values(modelConfigs).find(c => c.model_id === recommendation.modelId);
			const recommendedName = recommendedConfig ? recommendedConfig.description : recommendation.modelId;
			
			let analysisHtml = this.generateHardwareAnalysis(recommendation);
			
			this.hardwareInfo.innerHTML = `
				<div class="hardware-stats-header">
					<small>Hardware Detection: ${detected}/${total} specs detected</small>
				</div>
				
				<div class="hardware-recommendation-card">
					<div class="recommendation-header">
						<strong>🎯 Recommended Model</strong>
						<span class="confidence-badge confidence-${recommendation.confidence.toLowerCase().replace('-', '_')}">${recommendation.confidence} Confidence</span>
					</div>
					<div class="recommended-model">${recommendedName}</div>
					<div class="recommendation-reason">${recommendation.reason}</div>
				</div>
				
				${analysisHtml}
				
				<div class="hardware-details">
					${this.generateHardwareStats(hardware)}
				</div>
				
				${detected === 0 ? '<div class="hardware-note"><small>💡 Most browsers limit hardware detection for privacy. Model recommendations use safe defaults.</small></div>' : ''}
			`;
		} catch (error) {
			console.error('Error updating hardware info:', error);
		}
	}

	generateHardwareAnalysis(recommendation) {
		let analysisHtml = '';
		
		if (recommendation.strengths.length > 0) {
			analysisHtml += `
				<div class="hardware-analysis-section">
					<div class="analysis-label">✅ Detected Strengths:</div>
					<div class="analysis-items">
						${recommendation.strengths.map(strength => `<span class="analysis-item strength">${strength}</span>`).join('')}
					</div>
				</div>
			`;
		}
		
		if (recommendation.limitations.length > 0) {
			analysisHtml += `
				<div class="hardware-analysis-section">
					<div class="analysis-label">⚠️ Potential Limitations:</div>
					<div class="analysis-items">
						${recommendation.limitations.map(limitation => `<span class="analysis-item limitation">${limitation}</span>`).join('')}
					</div>
				</div>
			`;
		}
		
		return analysisHtml;
	}

	generateHardwareStats(hardware) {
		return `
			<div class="hardware-stat">
				<span>RAM:</span>
				<span>${hardware.ram !== 'unknown' ? hardware.ram + ' GB' : 'Unknown (Privacy Protected)'}</span>
			</div>
			<div class="hardware-stat">
				<span>CPU Cores:</span>
				<span>${hardware.cores !== 'unknown' ? hardware.cores : 'Unknown'}</span>
			</div>
			<div class="hardware-stat">
				<span>Connection:</span>
				<span>${hardware.connection !== 'unknown' ? hardware.connection.toUpperCase() : 'Unknown'}</span>
			</div>
			<div class="hardware-stat">
				<span>GPU:</span>
				<span>${hardware.gpu !== 'unknown' ? (hardware.gpu.length > 30 ? hardware.gpu.substring(0, 30) + '...' : hardware.gpu) : 'WebGL Protected'}</span>
			</div>
		`;
	}
}

// Make delete function globally available for onclick handlers
window.deleteIndividualModel = async function(modelId) {
	const modelConfigs = getModelConfigs();
	const config = Object.values(modelConfigs).find(c => c.model_id === modelId);
	const displayName = config ? config.description : modelId;
	
	if (confirm(`Are you sure you want to delete ${displayName}?\n\nThis will remove the downloaded model files and you'll need to re-download them to use this model again.`)) {
		const deleteBtn = document.querySelector(`button[onclick="deleteIndividualModel('${modelId}')"]`);
		if (deleteBtn) {
			deleteBtn.disabled = true;
			deleteBtn.innerHTML = '⏳ Deleting...';
		}
		
		const success = await deleteModelCache(modelId);
		
		if (success) {
			// Trigger refresh on the settings modal instance
			const settingsModal = document.getElementById('settings-modal');
			if (settingsModal && settingsModal._componentInstance) {
				await settingsModal._componentInstance.refreshModelList();
			}
		} else {
			alert(`Failed to delete ${displayName}. Please try again.`);
			if (deleteBtn) {
				deleteBtn.disabled = false;
				deleteBtn.innerHTML = '🗑️ Delete';
			}
		}
	}
};