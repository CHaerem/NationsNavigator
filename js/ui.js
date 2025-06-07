import { processQuery, resetMap } from "./main.js";
import { highlightCountry } from "./map.js";
import { clearAllModelCache, deleteModelCache, getModelConfigs, checkModelCacheStatus, getCurrentActiveModel, debugBrowserStorage, detectHardwareCapabilities, getModelRecommendation } from "./llm.js";

export function updateCountryInfo(props) {
	const countryInfoElement = document.getElementById("country-info");
	const closeBtnElement = document.getElementById("close-btn");

	if (props) {
		const currencies = props.currencies
			? props.currencies.split(",").map(c => `<span class="tag">${c.trim()}</span>`).join("")
			: '<span class="tag-empty">No currencies</span>';
		const languages = props.languages
			? props.languages.split(",").map(l => `<span class="tag">${l.trim()}</span>`).join("")
			: '<span class="tag-empty">No languages</span>';
		const continents = props.continents
			? props.continents.split(",").map(c => `<span class="tag">${c.trim()}</span>`).join("")
			: '<span class="tag-empty">No continents</span>';
		
		// Format borders with clickable links
		let bordersHtml = '<span class="tag-empty">No borders</span>';
		if (props.borders && props.borders !== "N/A") {
			const borderArray = props.borders.split(",");
			bordersHtml = borderArray.map(border => 
				`<span class="tag tag-border" data-country="${border.trim()}">${border.trim()}</span>`
			).join("");
		}

		// Format population with better readability
		const formatPopulation = (pop) => {
			if (!pop) return "Unknown";
			if (pop >= 1000000000) return `${(pop / 1000000000).toFixed(1)}B`;
			if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
			if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
			return pop.toLocaleString();
		};

		// Format area with better readability
		const formatArea = (area) => {
			if (!area) return "Unknown";
			return `${area.toLocaleString()} km²`;
		};

		countryInfoElement.innerHTML = `
			<div class="country-header">
				<img src="${props.flagUrl || ""}" alt="${props.name} flag" class="flag-simple">
				<div class="country-title">
					<h3>${props.name || "Unknown"} ${props.flagEmoji || "🏳️"}</h3>
					<div class="country-region">${props.region || "Unknown Region"}</div>
				</div>
			</div>

			<div class="country-essentials">
				<div class="essential-item">
					<span class="essential-label">Capital</span>
					<span class="essential-value">${props.capital || "N/A"}</span>
				</div>
				<div class="essential-item">
					<span class="essential-label">Population</span>
					<span class="essential-value" title="${props.population ? props.population.toLocaleString() : 'Unknown'}">${formatPopulation(props.population)}</span>
				</div>
				<div class="essential-item">
					<span class="essential-label">Area</span>
					<span class="essential-value">${formatArea(props.area)}</span>
				</div>
			</div>

			<div class="country-tags">
				${languages !== '<span class="tag-empty">No languages</span>' ? `<div class="tag-group">
					<span class="tag-group-label">Languages:</span>
					<div class="tags-container">${languages}</div>
				</div>` : ''}
				
				${currencies !== '<span class="tag-empty">No currencies</span>' ? `<div class="tag-group">
					<span class="tag-group-label">Currencies:</span>
					<div class="tags-container">${currencies}</div>
				</div>` : ''}
				
				${bordersHtml !== '<span class="tag-empty">No borders</span>' ? `<div class="tag-group">
					<span class="tag-group-label">Borders:</span>
					<div class="tags-container">${bordersHtml}</div>
				</div>` : ''}
			</div>

			<div class="country-more">
				<button class="more-info-btn" data-target="additional-info">
					<span>More Details</span>
					<span class="more-icon">▼</span>
				</button>
				<div class="additional-info" id="additional-info" style="display: none;">
					<div class="info-grid">
						<div class="info-item">
							<span class="info-label">Official Name</span>
							<span class="info-value">${props.officialName || "N/A"}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Subregion</span>
							<span class="info-value">${props.subregion || "N/A"}</span>
						</div>
						<div class="info-item">
							<span class="info-label">UN Member</span>
							<span class="info-value ${props.unMember ? 'status-yes' : 'status-no'}">
								${props.unMember ? "Yes" : "No"}
							</span>
						</div>
						<div class="info-item">
							<span class="info-label">Driving Side</span>
							<span class="info-value">${props.drivingSide || "N/A"}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Independence</span>
							<span class="info-value">${props.independenceStatus || "N/A"}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Continents</span>
							<span class="info-value">${continents.replace(/<[^>]*>/g, '').replace(/No continents/, 'N/A')}</span>
						</div>
					</div>
					
					${props.flagDescription ? `<div class="flag-description">
						<strong>Flag:</strong> ${props.flagDescription}
					</div>` : ''}
				</div>
			</div>
		`;
		
		// Add click handlers for border countries
		countryInfoElement.querySelectorAll('.tag-border').forEach(tag => {
			tag.addEventListener('click', (e) => {
				const countryCode = e.target.getAttribute('data-country');
				highlightCountry(countryCode);
			});
		});

		// Add "More Details" functionality
		countryInfoElement.querySelectorAll('.more-info-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				const targetId = btn.getAttribute('data-target');
				const content = document.getElementById(targetId);
				const icon = btn.querySelector('.more-icon');
				const text = btn.querySelector('span:first-child');
				
				if (content.style.display === 'none' || !content.style.display) {
					content.style.display = 'block';
					icon.textContent = '▲';
					text.textContent = 'Less Details';
				} else {
					content.style.display = 'none';
					icon.textContent = '▼';
					text.textContent = 'More Details';
				}
			});
		});

		closeBtnElement.style.display = "block";
		
		// Update panel title and show panel when displaying country info
		updatePanelTitle("Country Information");
		showInfoPanel();
	} else {
		countryInfoElement.innerHTML = `
			<div class="empty-state">
				<div class="empty-icon">🗺️</div>
				<div class="empty-text">Click on a country to explore its information</div>
				<div class="empty-subtext">Discover capitals, languages, currencies, and more!</div>
			</div>
		`;
		closeBtnElement.style.display = "none";
	}
}

export function updateMessage(message) {
	const messageElement = document.getElementById("message");
	const panelActions = document.getElementById("panel-actions");
	messageElement.innerHTML = message;

	// Update panel title and show panel when displaying query results
	if (message && message.trim() !== "") {
		updatePanelTitle("Query Results");
		showInfoPanel();
		panelActions.style.display = "block";
	} else {
		panelActions.style.display = "none";
	}

	// Attach event listeners to any new toggle-countries links
	messageElement.querySelectorAll(".toggle-countries").forEach((link) => {
		link.addEventListener("click", toggleCountriesList);
	});

	// Attach event listeners to any new country links
	messageElement.querySelectorAll(".country-link").forEach((link) => {
		link.addEventListener("click", (event) => {
			event.preventDefault();
			const iso = event.target.getAttribute("data-iso");
			highlightCountry(iso);
		});
	});

	// Attach event listeners to show SQL button
	messageElement.querySelectorAll(".show-sql-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			const targetId = btn.getAttribute("data-target");
			const content = document.getElementById(targetId);
			const icon = btn.querySelector(".sql-icon");
			const text = btn.querySelector("span:first-child");
			
			if (content && (content.style.display === "none" || !content.style.display)) {
				content.style.display = "block";
				icon.textContent = "▲";
				text.textContent = "Hide SQL";
			} else if (content) {
				content.style.display = "none";
				icon.textContent = "▼";
				text.textContent = "Show SQL";
			}
		});
	});
}

export function updateLLMStatus(status) {
	document.getElementById("llm-status").textContent = status;
	const searchBtn = document.getElementById("search-btn");
	const btnIcon = searchBtn.querySelector(".btn-icon");
	const btnText = searchBtn.querySelector(".btn-text");
	
	if (status.includes("✅") || status === "WebLLM ready") {
		searchBtn.disabled = false;
		if (btnIcon) btnIcon.textContent = "🔍";
		if (btnText) btnText.textContent = "Ask AI";
	} else if (status.includes("❌")) {
		searchBtn.disabled = true;
		if (btnIcon) btnIcon.textContent = "❌";
		if (btnText) btnText.textContent = "AI Unavailable";
	} else {
		searchBtn.disabled = true;
		if (btnIcon) btnIcon.textContent = "⏳";
		if (btnText) btnText.textContent = "Loading AI...";
	}
}

export function setupEventListeners() {
	const queryForm = document.getElementById("query-form");
	const queryInput = document.getElementById("query-input");
	
	// Add input suggestions and better UX
	addQuerySuggestions();
	
	queryForm.addEventListener("submit", (event) => {
		event.preventDefault();
		handleQuerySubmit();
	});

	document.getElementById("search-btn").addEventListener("click", (event) => {
		event.preventDefault();
		handleQuerySubmit();
	});
	
	// Settings modal toggle
	const settingsBtn = document.getElementById("settings-btn");
	if (settingsBtn) {
		settingsBtn.addEventListener("click", () => {
			showSettingsModal();
		});
	}

	const settingsClose = document.getElementById("settings-close");
	if (settingsClose) {
		settingsClose.addEventListener("click", () => {
			hideSettingsModal();
		});
	}

	// Download modal event listeners (with null checks)
	const downloadClose = document.getElementById("download-close");
	if (downloadClose) {
		downloadClose.addEventListener("click", () => {
			hideDownloadModal();
		});
	}

	const downloadCancel = document.getElementById("download-cancel");
	if (downloadCancel) {
		downloadCancel.addEventListener("click", () => {
			hideDownloadModal();
		});
	}

	const downloadConfirm = document.getElementById("download-confirm");
	if (downloadConfirm) {
		downloadConfirm.addEventListener("click", () => {
			handleModelDownload();
		});
	}

	// Close download modal when clicking backdrop
	const downloadModal = document.getElementById("download-modal");
	if (downloadModal) {
		downloadModal.addEventListener("click", (e) => {
			if (e.target.id === "download-modal") {
				hideDownloadModal();
			}
		});
	}

	// Close settings modal when clicking backdrop
	const settingsModal = document.getElementById("settings-modal");
	if (settingsModal) {
		settingsModal.addEventListener("click", (e) => {
			if (e.target.id === "settings-modal") {
				hideSettingsModal();
			}
		});
	}
	
	const resetBtn = document.getElementById("reset-btn");
	if (resetBtn) {
		resetBtn.addEventListener("click", resetMap);
	}
	
	// Model management buttons
	const clearAllCacheBtn = document.getElementById("clear-all-cache-btn");
	if (clearAllCacheBtn) {
		clearAllCacheBtn.addEventListener("click", async () => {
			await clearAllModelCache();
			await refreshModelList();
		});
	}

	const refreshModelsBtn = document.getElementById("refresh-models-btn");
	if (refreshModelsBtn) {
		refreshModelsBtn.addEventListener("click", () => {
			refreshModelList();
		});
	}

	const debugStorageBtn = document.getElementById("debug-storage-btn");
	if (debugStorageBtn) {
		debugStorageBtn.addEventListener("click", async () => {
			await debugBrowserStorage();
			alert("Debug info logged to console. Open Developer Tools (F12) to see the results.");
		});
	}
	const closeBtn = document.getElementById("close-btn");
	if (closeBtn) {
		closeBtn.addEventListener("click", () => {
			updateCountryInfo(null);
			hideInfoPanel();
		});
	}

	// Add keyboard shortcuts
	queryInput.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			queryInput.blur();
			resetMap();
			hideSettingsModal();
		}
	});

	// Close modals on ESC key
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			hideSettingsModal();
			if (document.getElementById('download-modal')) {
				hideDownloadModal();
			}
		}
	});
}

function handleQuerySubmit() {
	const searchBtn = document.getElementById("search-btn");
	if (!searchBtn.disabled) {
		processQuery();
	} else {
		updateMessage(`
			<div class='error'>
				🤖 AI model is still loading. Please wait a moment...
				<br><small>Try a simpler model if this takes too long.</small>
			</div>
		`);
	}
}

function addQuerySuggestions() {
	const queryInput = document.getElementById("query-input");
	const suggestions = [
		"Countries in Europe",
		"Largest countries by area", 
		"Most populated countries",
		"Countries with red flags",
		"European countries with crosses in their flags",
		"Countries that border France",
		"Spanish speaking countries",
		"Island nations in the Pacific",
		"Countries with stars on their flags",
		"African countries with green flags"
	];

	// Add placeholder rotation
	let currentSuggestion = 0;
	
	const updatePlaceholder = () => {
		queryInput.placeholder = `e.g., "${suggestions[currentSuggestion]}"`;
		currentSuggestion = (currentSuggestion + 1) % suggestions.length;
	};

	// Initial placeholder
	updatePlaceholder();
	
	// Rotate placeholder every 3 seconds when input is empty and not focused
	setInterval(() => {
		if (!queryInput.value && document.activeElement !== queryInput) {
			updatePlaceholder();
		}
	}, 3000);

	// Show example queries when focused and empty
	queryInput.addEventListener("focus", () => {
		if (!queryInput.value) {
			setTimeout(() => showQueryExamples(), 100);
		}
	});

	// Hide suggestions when user starts typing
	queryInput.addEventListener("input", () => {
		if (queryInput.value) {
			hideQueryExamples();
		} else {
			setTimeout(() => showQueryExamples(), 100);
		}
	});

	queryInput.addEventListener("blur", (e) => {
		setTimeout(() => {
			if (!document.querySelector('.query-examples:hover')) {
				hideQueryExamples();
			}
		}, 150);
	});
}

function showQueryExamples() {
	const existingExamples = document.getElementById("query-examples");
	if (existingExamples) return;

	const examples = [
		"🌍 Countries in Europe",
		"🏙️ Most populated countries", 
		"🏴 Countries with red flags",
		"🗣️ Spanish speaking countries",
		"🏔️ Largest countries by area",
		"⭐ Countries with stars on flags"
	];

	const examplesDiv = document.createElement("div");
	examplesDiv.id = "query-examples";
	examplesDiv.className = "query-examples";
	examplesDiv.innerHTML = `
		<div class="examples-header">💡 Try asking about:</div>
		<div class="examples-grid">
			${examples.map(example => {
				const cleanQuery = example.replace(/^[🌍🏙️🏴🗣️🏔️⭐]\s/, '');
				return `<div class="example-item" data-query="${cleanQuery}">${example}</div>`;
			}).join('')}
		</div>
	`;

	const searchBar = document.getElementById("search-bar");
	searchBar.appendChild(examplesDiv);

	// Add click handlers for examples
	examplesDiv.querySelectorAll('.example-item').forEach(item => {
		item.addEventListener('mousedown', (e) => {
			e.preventDefault(); // Prevent input blur
		});
		
		item.addEventListener('click', (e) => {
			e.preventDefault();
			const query = e.target.getAttribute('data-query');
			const queryInput = document.getElementById('query-input');
			queryInput.value = query;
			queryInput.focus();
			hideQueryExamples();
			
			// Trigger the query
			setTimeout(() => {
				handleQuerySubmit();
			}, 100);
		});
	});
}

function hideQueryExamples() {
	const examples = document.getElementById("query-examples");
	if (examples) {
		examples.remove();
	}
}

export function toggleCountriesList(event) {
	event.preventDefault();
	const fullList = event.target.nextElementSibling;
	const linkText = event.target;
	if (fullList.style.display === "none") {
		fullList.style.display = "inline";
		linkText.textContent = "(Hide)";
	} else {
		fullList.style.display = "none";
		linkText.textContent = "(Show all)";
	}
}

function showSettingsModal() {
	const settingsModal = document.getElementById("settings-modal");
	settingsModal.classList.remove("modal-hidden");
	
	// Refresh model list when opening settings
	refreshModelList();
	
	// Also try calling updateHardwareInfo directly with a delay
	setTimeout(() => {
		updateHardwareInfo();
	}, 200);
}

function hideSettingsModal() {
	const settingsModal = document.getElementById("settings-modal");
	settingsModal.classList.add("modal-hidden");
}

function updatePanelTitle(title) {
	const panelTitle = document.getElementById("panel-title");
	if (panelTitle) {
		panelTitle.textContent = title;
	}
}

function showInfoPanel() {
	const infoPanel = document.getElementById("info-panel");
	if (infoPanel) {
		infoPanel.style.display = "block";
	}
}

function hideInfoPanel() {
	const infoPanel = document.getElementById("info-panel");
	if (infoPanel) {
		infoPanel.style.display = "none";
	}
}

function updateHardwareInfo() {
	try {
		const hardware = detectHardwareCapabilities();
		const recommendation = getModelRecommendation(hardware);
		const hardwareInfoEl = document.getElementById('hardware-info');
		
		if (hardwareInfoEl) {
			// Count how many specs we could detect
			const detected = Object.values(hardware).filter(val => val !== 'unknown').length;
			const total = Object.keys(hardware).length;
			
			// Get model config for recommended model
			const modelConfigs = getModelConfigs();
			const recommendedConfig = Object.values(modelConfigs).find(c => c.model_id === recommendation.modelId);
			const recommendedName = recommendedConfig ? recommendedConfig.description : recommendation.modelId;
			
			// Build strengths and limitations display
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
			
			hardwareInfoEl.innerHTML = `
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
				</div>
				
				${detected === 0 ? '<div class="hardware-note"><small>💡 Most browsers limit hardware detection for privacy. Model recommendations use safe defaults.</small></div>' : ''}
			`;
		}
	} catch (error) {
		console.error('Error updating hardware info:', error);
	}
}

async function refreshModelList() {
	const modelList = document.getElementById("model-list");
	const modelConfigs = getModelConfigs();
	const activeModel = getCurrentActiveModel();
	
	// Get hardware recommendation
	const hardware = detectHardwareCapabilities();
	const recommendation = getModelRecommendation(hardware);
	
	// Show loading state
	modelList.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">Checking model status...</div>';
	
	let modelItems = '';
	
	for (const config of Object.values(modelConfigs)) {
		const modelId = config.model_id;
		const isActive = modelId === activeModel;
		const isCached = await checkModelCacheStatus(modelId);
		const isRecommended = modelId === recommendation.modelId;
		
		// Get display name and size from config
		const displayName = config.description || modelId;
		const sizeText = formatModelSize(config.size_mb);
		
		const statusBadges = [];
		if (isActive) statusBadges.push('<span class="status-badge status-active">Active</span>');
		if (isRecommended) statusBadges.push('<span class="status-badge status-recommended">Recommended</span>');
		if (isCached) {
			statusBadges.push('<span class="status-badge status-cached">Downloaded</span>');
		} else {
			statusBadges.push('<span class="status-badge status-not-cached">Not Downloaded</span>');
		}
		
		modelItems += `
			<div class="model-item ${isRecommended ? 'model-recommended' : ''}">
				<div class="model-info">
					<div class="model-name">
						${displayName}
						${isRecommended ? ' 🎯' : ''}
					</div>
					<div class="model-size">${sizeText}</div>
					<div class="model-status">
						${statusBadges.join('')}
					</div>
				</div>
				<div class="model-actions">
					${isCached ? `<button class="model-delete-btn" onclick="deleteIndividualModel('${modelId}')" ${isActive ? 'disabled title="Cannot delete active model"' : ''}>
						🗑️ Delete
					</button>` : `<button class="model-download-btn ${isRecommended ? 'recommended' : ''}" onclick="showDownloadModal('${modelId}')">
						📥 ${isRecommended ? 'Download (Recommended)' : 'Download'}
					</button>`}
				</div>
			</div>
		`;
	}
	
	modelList.innerHTML = modelItems || '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">No models found</div>';
	
	// Update hardware info in settings
	// Add a small delay to ensure DOM is ready
	setTimeout(() => {
		updateHardwareInfo();
	}, 100);
}

function formatModelSize(sizeMB) {
	if (!sizeMB) return "Unknown size";
	
	if (sizeMB >= 1000) {
		return `${(sizeMB / 1000).toFixed(1)} GB`;
	} else {
		return `${sizeMB} MB`;
	}
}

window.deleteIndividualModel = async function(modelId) {
	const modelConfigs = getModelConfigs();
	const config = Object.values(modelConfigs).find(c => c.model_id === modelId);
	const displayName = config ? config.description : modelId;
	
	if (confirm(`Are you sure you want to delete ${displayName}?\n\nThis will remove the downloaded model files and you'll need to re-download them to use this model again.`)) {
		// Find the delete button and show loading state
		const deleteBtn = document.querySelector(`button[onclick="deleteIndividualModel('${modelId}')"]`);
		if (deleteBtn) {
			deleteBtn.disabled = true;
			deleteBtn.innerHTML = '⏳ Deleting...';
		}
		
		const success = await deleteModelCache(modelId);
		
		if (success) {
			// Refresh the model list to show updated status
			await refreshModelList();
		} else {
			alert(`Failed to delete ${displayName}. Please try again.`);
			if (deleteBtn) {
				deleteBtn.disabled = false;
				deleteBtn.innerHTML = '🗑️ Delete';
			}
		}
	}

// Download Modal Functions (moved outside to be globally accessible)
function showDownloadModal(modelId) {
	const modelConfigs = getModelConfigs();
	const config = Object.values(modelConfigs).find(c => c.model_id === modelId);
	
	if (!config) {
		console.error('Model config not found:', modelId);
		return;
	}
	
	// Check if modal elements exist
	const downloadModal = document.getElementById('download-modal');
	const nameEl = document.getElementById('download-model-name');
	const sizeEl = document.getElementById('download-model-size');
	const descEl = document.getElementById('download-model-description');
	const recommendationEl = document.getElementById('hardware-recommendation');
	const confirmBtn = document.getElementById('download-confirm');
	
	if (!downloadModal || !nameEl || !sizeEl || !descEl || !recommendationEl || !confirmBtn) {
		console.error('Download modal elements not found');
		return;
	}
	
	// Update modal content
	nameEl.textContent = config.description || modelId;
	sizeEl.textContent = formatModelSize(config.size_mb);
	descEl.textContent = `Download and use ${config.description} for AI-powered country queries.`;
	
	// Get hardware recommendation
	const hardware = detectHardwareCapabilities();
	const recommendation = getModelRecommendation(hardware);
	
	// Update hardware recommendation
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
	
	recommendationEl.className = `hardware-recommendation ${recommendationClass}`;
	recommendationEl.innerHTML = `
		<strong>${recommendationIcon} Hardware Assessment:</strong><br>
		${recommendation.modelId === modelId ? recommendation.reason : `Recommended: ${modelConfigs[recommendation.modelId]?.description}. ${recommendation.reason}`}
	`;
	
	// Store the model ID for download
	confirmBtn.setAttribute('data-model-id', modelId);
	
	// Show the modal
	downloadModal.classList.remove('modal-hidden');
}

function hideDownloadModal() {
	const downloadModal = document.getElementById('download-modal');
	if (downloadModal) {
		downloadModal.classList.add('modal-hidden');
	}
}

async function handleModelDownload() {
	const confirmBtn = document.getElementById('download-confirm');
	if (!confirmBtn) {
		console.error('Download confirm button not found');
		return;
	}
	
	const modelId = confirmBtn.getAttribute('data-model-id');
	if (!modelId) {
		console.error('No model ID found for download');
		return;
	}
	
	// Update button state
	const originalText = confirmBtn.textContent;
	confirmBtn.disabled = true;
	confirmBtn.textContent = 'Downloading...';
	
	try {
		// Hide the download modal
		hideDownloadModal();
		
		// Start the download by initializing WebLLM with the selected model
		await initWebLLM(modelId);
		
		// Refresh the model list to show updated status
		await refreshModelList();
		
	} catch (error) {
		console.error('Download failed:', error);
		alert(`Failed to download model: ${error.message}`);
	} finally {
		// Reset button state
		confirmBtn.disabled = false;
		confirmBtn.textContent = originalText;
	}
}


// Make functions globally available
if (typeof window !== 'undefined') {
	window.showDownloadModal = showDownloadModal;
	window.hideDownloadModal = hideDownloadModal;
	window.handleModelDownload = handleModelDownload;
	window.updateHardwareInfo = updateHardwareInfo; // For debugging
}

// Note: Functions are made available via window object for global access

}
