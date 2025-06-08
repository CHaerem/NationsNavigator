import { BaseComponent } from './BaseComponent.js';

export class SearchBarComponent extends BaseComponent {
	constructor(onQuerySubmit) {
		super('#search-bar');
		this.onQuerySubmit = onQuerySubmit;
		this.queryInput = document.getElementById('query-input');
		this.searchBtn = document.getElementById('search-btn');
		this.queryForm = document.getElementById('query-form');
		this.currentSuggestionIndex = 0;
		this.suggestionInterval = null;
		
		this.suggestions = [
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
	}

	setupEventListeners() {
		// Form submission
		if (this.queryForm) {
			this.queryForm.addEventListener('submit', (event) => {
				event.preventDefault();
				this.handleSubmit();
			});
		}

		// Search button click
		if (this.searchBtn) {
			this.searchBtn.addEventListener('click', (event) => {
				event.preventDefault();
				this.handleSubmit();
			});
		}

		// Query input events
		if (this.queryInput) {
			this.setupQueryInputEvents();
			this.startSuggestionRotation();
		}
	}

	setupQueryInputEvents() {
		// Focus events for suggestions
		this.queryInput.addEventListener('focus', () => {
			if (!this.queryInput.value) {
				setTimeout(() => this.showQueryExamples(), 100);
			}
		});

		// Input events
		this.queryInput.addEventListener('input', () => {
			if (this.queryInput.value) {
				this.hideQueryExamples();
			} else {
				setTimeout(() => this.showQueryExamples(), 100);
			}
		});

		// Blur events
		this.queryInput.addEventListener('blur', (e) => {
			setTimeout(() => {
				if (!document.querySelector('.query-examples:hover')) {
					this.hideQueryExamples();
				}
			}, 150);
		});

		// Keyboard shortcuts
		this.queryInput.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				this.queryInput.blur();
				this.resetSearch();
			}
		});
	}

	handleSubmit() {
		if (this.searchBtn && !this.searchBtn.disabled && this.onQuerySubmit) {
			this.onQuerySubmit();
		}
	}

	updateSearchButton(status) {
		if (!this.searchBtn) return;
		
		const btnIcon = this.searchBtn.querySelector('.btn-icon');
		const btnText = this.searchBtn.querySelector('.btn-text');
		
		if (status.includes("✅") || status === "WebLLM ready") {
			this.searchBtn.disabled = false;
			if (btnIcon) btnIcon.textContent = "🔍";
			if (btnText) btnText.textContent = "Ask AI";
		} else if (status.includes("❌")) {
			this.searchBtn.disabled = true;
			if (btnIcon) btnIcon.textContent = "❌";
			if (btnText) btnText.textContent = "AI Unavailable";
		} else {
			this.searchBtn.disabled = true;
			if (btnIcon) btnIcon.textContent = "⏳";
			if (btnText) btnText.textContent = "Loading AI...";
		}
	}

	startSuggestionRotation() {
		this.updatePlaceholder();
		this.suggestionInterval = setInterval(() => {
			if (!this.queryInput.value && document.activeElement !== this.queryInput) {
				this.updatePlaceholder();
			}
		}, 3000);
	}

	updatePlaceholder() {
		if (this.queryInput) {
			this.queryInput.placeholder = `e.g., "${this.suggestions[this.currentSuggestionIndex]}"`;
			this.currentSuggestionIndex = (this.currentSuggestionIndex + 1) % this.suggestions.length;
		}
	}

	showQueryExamples() {
		const existingExamples = document.getElementById('query-examples');
		if (existingExamples) return;

		const examples = [
			"🌍 Countries in Europe",
			"🏙️ Most populated countries", 
			"🏴 Countries with red flags",
			"🗣️ Spanish speaking countries",
			"🏔️ Largest countries by area",
			"⭐ Countries with stars on flags"
		];

		const examplesDiv = document.createElement('div');
		examplesDiv.id = 'query-examples';
		examplesDiv.className = 'query-examples';
		examplesDiv.innerHTML = `
			<div class="examples-header">💡 Try asking about:</div>
			<div class="examples-grid">
				${examples.map(example => {
					const cleanQuery = example.replace(/^[🌍🏙️🏴🗣️🏔️⭐]\s/, '');
					return `<div class="example-item" data-query="${cleanQuery}">${example}</div>`;
				}).join('')}
			</div>
		`;

		this.element.appendChild(examplesDiv);

		// Add click handlers
		examplesDiv.querySelectorAll('.example-item').forEach(item => {
			item.addEventListener('mousedown', (e) => {
				e.preventDefault(); // Prevent input blur
			});
			
			item.addEventListener('click', (e) => {
				e.preventDefault();
				const query = e.target.getAttribute('data-query');
				this.queryInput.value = query;
				this.queryInput.focus();
				this.hideQueryExamples();
				
				setTimeout(() => {
					this.handleSubmit();
				}, 100);
			});
		});
	}

	hideQueryExamples() {
		const examples = document.getElementById('query-examples');
		if (examples) {
			examples.remove();
		}
	}

	resetSearch() {
		if (this.queryInput) {
			this.queryInput.value = '';
		}
		this.hideQueryExamples();
	}

	getValue() {
		return this.queryInput ? this.queryInput.value : '';
	}

	setValue(value) {
		if (this.queryInput) {
			this.queryInput.value = value;
		}
	}

	focus() {
		if (this.queryInput) {
			this.queryInput.focus();
		}
	}

	destroy() {
		if (this.suggestionInterval) {
			clearInterval(this.suggestionInterval);
		}
		super.destroy();
	}
}