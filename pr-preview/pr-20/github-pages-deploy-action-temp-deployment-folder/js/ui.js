import { processQuery, resetMap } from "./main.js";
import { highlightCountry } from "./map.js";

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
	messageElement.innerHTML = message;

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
	
	document.getElementById("reset-btn").addEventListener("click", resetMap);
	document.getElementById("close-btn").addEventListener("click", () => {
		updateCountryInfo(null);
	});

	// Add keyboard shortcuts
	queryInput.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			queryInput.blur();
			resetMap();
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
			setTimeout(() => showQueryExamples(), 100); // Small delay to ensure proper positioning
		}
	});

	queryInput.addEventListener("blur", (e) => {
		// Delay hiding to allow clicking on examples
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

	const inputContainer = document.querySelector(".input-container");
	inputContainer.appendChild(examplesDiv);

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