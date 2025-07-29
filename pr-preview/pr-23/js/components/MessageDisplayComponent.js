import { BaseComponent } from './BaseComponent.js';
import { highlightCountry } from '../map.js';

export class MessageDisplayComponent extends BaseComponent {
	constructor() {
		super('#message');
		this.panelElement = document.getElementById('info-panel');
		this.panelTitle = document.getElementById('panel-title');
		this.panelActions = document.getElementById('panel-actions');
	}

	update(message) {
		this.setContent(message);

		if (message && message.trim() !== "") {
			this.updatePanelTitle('Query Results');
			this.showPanel();
			this.showPanelActions();
		} else {
			this.hidePanelActions();
		}

		this.attachMessageEventListeners();
	}

	attachMessageEventListeners() {
		// Toggle countries list
		this.querySelectorAll('.toggle-countries').forEach(link => {
			link.addEventListener('click', this.toggleCountriesList);
		});

		// Country links
		this.querySelectorAll('.country-link').forEach(link => {
			link.addEventListener('click', (event) => {
				event.preventDefault();
				const iso = event.target.getAttribute('data-iso');
				highlightCountry(iso);
			});
		});

		// Show SQL toggle
		this.querySelectorAll('.show-sql-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				const targetId = btn.getAttribute('data-target');
				const content = document.getElementById(targetId);
				const icon = btn.querySelector('.sql-icon');
				const text = btn.querySelector('span:first-child');
				
				if (content && (content.style.display === 'none' || !content.style.display)) {
					content.style.display = 'block';
					icon.textContent = '▲';
					text.textContent = 'Hide SQL';
				} else if (content) {
					content.style.display = 'none';
					icon.textContent = '▼';
					text.textContent = 'Show SQL';
				}
			});
		});
	}

	toggleCountriesList(event) {
		event.preventDefault();
		const fullList = event.target.nextElementSibling;
		const linkText = event.target;
		if (fullList.style.display === 'none') {
			fullList.style.display = 'inline';
			linkText.textContent = '(Hide)';
		} else {
			fullList.style.display = 'none';
			linkText.textContent = '(Show all)';
		}
	}

	showPanel() {
		if (this.panelElement) {
			this.panelElement.style.display = 'block';
		}
	}

	updatePanelTitle(title) {
		if (this.panelTitle) {
			this.panelTitle.textContent = title;
		}
	}

	showPanelActions() {
		if (this.panelActions) {
			this.panelActions.style.display = 'block';
		}
	}

	hidePanelActions() {
		if (this.panelActions) {
			this.panelActions.style.display = 'none';
		}
	}

	clear() {
		this.setContent('');
		this.hidePanelActions();
	}
}