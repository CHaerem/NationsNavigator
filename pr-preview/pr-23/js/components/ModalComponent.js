import { BaseComponent } from './BaseComponent.js';

export class ModalComponent extends BaseComponent {
	constructor(selector) {
		super(selector);
		this.isVisible = false;
	}

	show() {
		if (this.element) {
			this.removeClass('modal-hidden');
			this.isVisible = true;
			this.onShow();
		}
	}

	hide() {
		if (this.element) {
			this.addClass('modal-hidden');
			this.isVisible = false;
			this.onHide();
		}
	}

	setupEventListeners() {
		// Close on backdrop click
		this.addEventListener('click', (e) => {
			if (e.target === this.element) {
				this.hide();
			}
		});

		// Close on ESC key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.isVisible) {
				this.hide();
			}
		});

		// Setup close button
		const closeButton = this.querySelector('.modal-close, [id$="-close"]');
		if (closeButton) {
			closeButton.addEventListener('click', () => this.hide());
		}
	}

	onShow() {
		// Override in subclasses
	}

	onHide() {
		// Override in subclasses
	}
}