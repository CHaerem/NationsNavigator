import { BaseComponent } from './BaseComponent.js';
import { highlightCountry } from '../map.js';

export class CountryInfoComponent extends BaseComponent {
	constructor() {
		super('#country-info');
		this.panelElement = document.getElementById('info-panel');
		this.panelTitle = document.getElementById('panel-title');
		this.closeBtn = document.getElementById('close-btn');
	}

	setupEventListeners() {
		if (this.closeBtn) {
			this.closeBtn.addEventListener('click', () => {
				this.clear();
				this.hidePanel();
			});
		}
	}

	update(props) {
		if (props) {
			this.setContent(this.generateCountryHTML(props));
			this.attachCountryEventListeners();
			this.showCloseButton();
			this.updatePanelTitle('Country Information');
			this.showPanel();
		} else {
			this.setContent(this.generateEmptyStateHTML());
			this.hideCloseButton();
		}
	}

	generateCountryHTML(props) {
		const currencies = this.formatTags(props.currencies, 'No currencies');
		const languages = this.formatTags(props.languages, 'No languages');
		const continents = this.formatTags(props.continents, 'No continents');
		const bordersHtml = this.formatBorders(props.borders);

		return `
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
					<span class="essential-value" title="${props.population ? props.population.toLocaleString() : 'Unknown'}">${this.formatPopulation(props.population)}</span>
				</div>
				<div class="essential-item">
					<span class="essential-label">Area</span>
					<span class="essential-value">${this.formatArea(props.area)}</span>
				</div>
			</div>

			<div class="country-tags">
				${this.generateTagGroup('Languages', languages)}
				${this.generateTagGroup('Currencies', currencies)}
				${this.generateTagGroup('Borders', bordersHtml)}
			</div>

			<div class="country-more">
				<button class="more-info-btn" data-target="additional-info">
					<span>More Details</span>
					<span class="more-icon">▼</span>
				</button>
				<div class="additional-info" id="additional-info" style="display: none;">
					${this.generateAdditionalInfo(props)}
				</div>
			</div>
		`;
	}

	generateEmptyStateHTML() {
		return `
			<div class="empty-state">
				<div class="empty-icon">🗺️</div>
				<div class="empty-text">Click on a country to explore its information</div>
				<div class="empty-subtext">Discover capitals, languages, currencies, and more!</div>
			</div>
		`;
	}

	formatTags(value, emptyText) {
		if (!value) return `<span class="tag-empty">${emptyText}</span>`;
		return value.split(',').map(item => `<span class="tag">${item.trim()}</span>`).join('');
	}

	formatBorders(borders) {
		if (!borders || borders === "N/A") {
			return '<span class="tag-empty">No borders</span>';
		}
		return borders.split(',').map(border => 
			`<span class="tag tag-border" data-country="${border.trim()}">${border.trim()}</span>`
		).join('');
	}

	formatPopulation(pop) {
		if (!pop) return "Unknown";
		if (pop >= 1000000000) return `${(pop / 1000000000).toFixed(1)}B`;
		if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
		if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
		return pop.toLocaleString();
	}

	formatArea(area) {
		if (!area) return "Unknown";
		return `${area.toLocaleString()} km²`;
	}

	generateTagGroup(label, content) {
		if (content.includes('tag-empty')) return '';
		return `
			<div class="tag-group">
				<span class="tag-group-label">${label}:</span>
				<div class="tags-container">${content}</div>
			</div>
		`;
	}

	generateAdditionalInfo(props) {
		const continents = this.formatTags(props.continents, 'No continents');
		return `
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
		`;
	}

	attachCountryEventListeners() {
		// Border country click handlers
		this.querySelectorAll('.tag-border').forEach(tag => {
			tag.addEventListener('click', (e) => {
				const countryCode = e.target.getAttribute('data-country');
				highlightCountry(countryCode);
			});
		});

		// More details toggle
		this.querySelectorAll('.more-info-btn').forEach(btn => {
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
	}

	clear() {
		this.update(null);
	}

	showPanel() {
		if (this.panelElement) {
			this.panelElement.style.display = 'block';
		}
	}

	hidePanel() {
		if (this.panelElement) {
			this.panelElement.style.display = 'none';
		}
	}

	updatePanelTitle(title) {
		if (this.panelTitle) {
			this.panelTitle.textContent = title;
		}
	}

	showCloseButton() {
		if (this.closeBtn) {
			this.closeBtn.style.display = 'block';
		}
	}

	hideCloseButton() {
		if (this.closeBtn) {
			this.closeBtn.style.display = 'none';
		}
	}
}