export class BaseComponent {
	constructor(selector) {
		this.element = document.querySelector(selector);
		if (!this.element) {
			console.warn(`Element not found for selector: ${selector}`);
		}
		this.isInitialized = false;
	}

	show() {
		if (this.element) {
			this.element.style.display = 'block';
		}
	}

	hide() {
		if (this.element) {
			this.element.style.display = 'none';
		}
	}

	setContent(content) {
		if (this.element) {
			this.element.innerHTML = content;
		}
	}

	addClass(className) {
		if (this.element) {
			this.element.classList.add(className);
		}
	}

	removeClass(className) {
		if (this.element) {
			this.element.classList.remove(className);
		}
	}

	addEventListener(event, handler) {
		if (this.element) {
			this.element.addEventListener(event, handler);
		}
	}

	querySelector(selector) {
		return this.element ? this.element.querySelector(selector) : null;
	}

	querySelectorAll(selector) {
		return this.element ? this.element.querySelectorAll(selector) : [];
	}

	init() {
		if (!this.isInitialized) {
			this.setupEventListeners();
			this.isInitialized = true;
		}
	}

	setupEventListeners() {
		// Override in subclasses
	}

	destroy() {
		// Override in subclasses for cleanup
		this.isInitialized = false;
	}
}