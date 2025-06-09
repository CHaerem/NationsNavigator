import { BaseComponent } from './BaseComponent.js';

export class FloatingPanelComponent extends BaseComponent {
	constructor() {
		super('#info-panel');
		this.panel = document.getElementById('info-panel');
		this.header = document.getElementById('panel-header');
		this.isDragging = false;
		this.dragOffset = { x: 0, y: 0 };
		this.snapZones = {
			left: { x: 24, y: 80, class: 'snap-left', threshold: 100 },
			right: { x: window.innerWidth - 400 - 24, y: 80, class: 'snap-right', threshold: 100 },
			bottom: { x: 24, y: window.innerHeight - 300 - 24, class: 'snap-bottom', threshold: 100 },
			center: { x: (window.innerWidth - 400) / 2, y: 80, class: 'snap-center', threshold: 80 }
		};
		this.isMaximized = false;
		this.previousPosition = null;
		this.snapIndicators = {};
		this.activeSnapZone = null;
		
		this.createSnapIndicators();
		this.setupEventListeners();
		this.updateSnapZones();
		
		// Update snap zones on resize
		window.addEventListener('resize', () => this.updateSnapZones());
	}

	createSnapIndicators() {
		const zones = ['left', 'right', 'bottom', 'center', 'maximize'];
		zones.forEach(zone => {
			const indicator = document.createElement('div');
			indicator.className = `snap-zone-indicator snap-zone-${zone}`;
			document.body.appendChild(indicator);
			this.snapIndicators[zone] = indicator;
		});
	}

	setupEventListeners() {
		// Dragging functionality - MOUSE ONLY
		this.header.addEventListener('mousedown', (e) => this.startDrag(e));
		
		document.addEventListener('mousemove', (e) => this.drag(e));
		document.addEventListener('mouseup', () => this.endDrag());

		// Only maximize button now
		document.getElementById('maximize-btn').addEventListener('click', () => this.toggleMaximize());

		// Check device type
		this.checkMobileMode();
		window.addEventListener('resize', () => this.checkMobileMode());
	}

	checkMobileMode() {
		// Detect if device has touch capability
		const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		const isMobile = window.innerWidth <= 768;
		
		if (isTouchDevice || isMobile) {
			// Disable dragging entirely on touch devices
			this.header.style.cursor = 'default';
			this.panel.classList.add('touch-device');
			this.panel.classList.remove('desktop-mode');
		} else {
			// Enable dragging only on desktop with mouse
			this.header.style.cursor = 'grab';
			this.panel.classList.add('desktop-mode');
			this.panel.classList.remove('touch-device');
		}
	}

	startDrag(e) {
		// Only allow dragging on desktop with mouse
		const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		
		if (isTouchDevice || window.innerWidth <= 1024 || e.target.classList.contains('panel-control-btn')) {
			return; // No dragging on any touch device or tablet
		}

		// Desktop mouse events only
		this.startDragAction(e);
	}

	startDragAction(e) {
		this.isDragging = true;
		this.panel.classList.add('dragging');
		
		const clientX = e.clientX || (e.touches && e.touches[0].clientX);
		const clientY = e.clientY || (e.touches && e.touches[0].clientY);
		
		const rect = this.panel.getBoundingClientRect();
		this.dragOffset.x = clientX - rect.left;
		this.dragOffset.y = clientY - rect.top;

		// Remove any snap classes when starting to drag
		this.clearSnapClasses();
		
		// Only prevent default for mouse events or when explicitly dragging
		if (e.type === 'mousedown') {
			e.preventDefault();
		}
	}

	drag(e) {
		if (!this.isDragging || e.type !== 'mousemove') return;

		const clientX = e.clientX;
		const clientY = e.clientY;

		if (!clientX || !clientY) return;

		let newX = clientX - this.dragOffset.x;
		let newY = clientY - this.dragOffset.y;

		// Constrain to viewport bounds
		const maxX = window.innerWidth - this.panel.offsetWidth;
		const maxY = window.innerHeight - this.panel.offsetHeight;
		
		newX = Math.max(0, Math.min(newX, maxX));
		newY = Math.max(0, Math.min(newY, maxY));

		// Ensure panel doesn't overlap with search bar
		const searchBar = document.getElementById('search-bar');
		if (searchBar) {
			const searchRect = searchBar.getBoundingClientRect();
			const searchBottom = searchRect.bottom + 10; // 10px buffer
			
			if (newY < searchBottom) {
				newY = searchBottom;
			}
		}

		this.panel.style.left = `${newX}px`;
		this.panel.style.top = `${newY}px`;
		this.panel.style.right = 'auto';
		this.panel.style.bottom = 'auto';
		this.panel.style.transform = 'none';

		// Check for snap zones and show indicators
		this.updateSnapIndicators(clientX, clientY);

		e.preventDefault();
	}

	updateSnapIndicators(mouseX, mouseY) {
		// Hide all indicators first
		Object.values(this.snapIndicators).forEach(indicator => {
			indicator.classList.remove('active');
		});

		this.activeSnapZone = null;

		// Check proximity to snap zones
		const panelRect = this.panel.getBoundingClientRect();
		const panelCenterX = panelRect.left + panelRect.width / 2;
		const panelCenterY = panelRect.top + panelRect.height / 2;

		// Check each snap zone
		for (const [zone, config] of Object.entries(this.snapZones)) {
			let distance;
			
			if (zone === 'left') {
				distance = Math.abs(panelRect.left - config.x) + Math.abs(panelRect.top - config.y);
			} else if (zone === 'right') {
				distance = Math.abs(panelRect.right - (config.x + 400)) + Math.abs(panelRect.top - config.y);
			} else if (zone === 'bottom') {
				distance = Math.abs(panelRect.left - config.x) + Math.abs(panelRect.bottom - (config.y + 300));
			} else if (zone === 'center') {
				distance = Math.abs(panelCenterX - (window.innerWidth / 2)) + Math.abs(panelRect.top - config.y);
			}

			if (distance < config.threshold) {
				this.snapIndicators[zone].classList.add('active');
				this.activeSnapZone = zone;
				break; // Only show one indicator at a time
			}
		}

		// Check for maximize zone (corners of screen)
		const margin = 50;
		if ((mouseX < margin || mouseX > window.innerWidth - margin) && 
			(mouseY < margin + 80 || mouseY > window.innerHeight - margin)) {
			this.snapIndicators.maximize.classList.add('active');
			this.activeSnapZone = 'maximize';
		}
	}

	endDrag() {
		if (!this.isDragging) return;

		this.isDragging = false;
		this.panel.classList.remove('dragging');

		// Hide all snap indicators
		Object.values(this.snapIndicators).forEach(indicator => {
			indicator.classList.remove('active');
		});

		// Snap to active zone if any
		if (this.activeSnapZone) {
			if (this.activeSnapZone === 'maximize') {
				this.toggleMaximize();
			} else {
				this.snapToPosition(this.activeSnapZone);
			}
		} else {
			// If not snapped, ensure we're still within bounds
			this.constrainToBounds();
		}

		this.activeSnapZone = null;
	}

	// Removed old checkSnapZones - using new visual indicator system

	snapToPosition(position) {
		this.clearSnapClasses();
		this.panel.classList.add(this.snapZones[position].class);
		
		// Reset styles for snap positioning
		this.panel.style.left = '';
		this.panel.style.top = '';
		this.panel.style.right = '';
		this.panel.style.bottom = '';
		this.panel.style.transform = '';
	}

	toggleMaximize() {
		if (this.isMaximized) {
			// Restore previous position
			this.panel.classList.remove('maximized');
			if (this.previousPosition) {
				this.panel.style.left = this.previousPosition.left;
				this.panel.style.top = this.previousPosition.top;
				this.panel.style.right = this.previousPosition.right;
				this.panel.style.bottom = this.previousPosition.bottom;
				this.panel.style.transform = this.previousPosition.transform;
			}
			document.getElementById('maximize-btn').innerHTML = '⛶';
			document.getElementById('maximize-btn').title = 'Maximize panel';
		} else {
			// Save current position
			this.previousPosition = {
				left: this.panel.style.left,
				top: this.panel.style.top,
				right: this.panel.style.right,
				bottom: this.panel.style.bottom,
				transform: this.panel.style.transform
			};
			
			this.clearSnapClasses();
			this.panel.classList.add('maximized');
			this.panel.style.left = '';
			this.panel.style.top = '';
			this.panel.style.right = '';
			this.panel.style.bottom = '';
			this.panel.style.transform = '';
			document.getElementById('maximize-btn').innerHTML = '🗗';
			document.getElementById('maximize-btn').title = 'Restore panel';
		}
		this.isMaximized = !this.isMaximized;
	}

	clearSnapClasses() {
		this.panel.classList.remove('snap-left', 'snap-right', 'snap-bottom', 'snap-center', 'maximized');
	}

	constrainToBounds() {
		const rect = this.panel.getBoundingClientRect();
		const maxX = window.innerWidth - rect.width;
		const maxY = window.innerHeight - rect.height;
		
		let newX = Math.max(0, Math.min(rect.left, maxX));
		let newY = Math.max(0, Math.min(rect.top, maxY));

		// Ensure panel doesn't overlap with search bar
		const searchBar = document.getElementById('search-bar');
		if (searchBar) {
			const searchRect = searchBar.getBoundingClientRect();
			const searchBottom = searchRect.bottom + 10;
			
			if (newY < searchBottom) {
				newY = searchBottom;
			}
		}

		this.panel.style.left = `${newX}px`;
		this.panel.style.top = `${newY}px`;
		this.panel.style.right = 'auto';
		this.panel.style.bottom = 'auto';
		this.panel.style.transform = 'none';
	}

	updateSnapZones() {
		const panelWidth = 400; // approximate panel width
		const panelHeight = 300; // approximate panel height
		const margin = 24;

		this.snapZones = {
			left: { x: margin, y: 80, class: 'snap-left', threshold: 100 },
			right: { x: window.innerWidth - panelWidth - margin, y: 80, class: 'snap-right', threshold: 100 },
			bottom: { x: margin, y: window.innerHeight - panelHeight - margin, class: 'snap-bottom', threshold: 100 },
			center: { x: (window.innerWidth - panelWidth) / 2, y: 80, class: 'snap-center', threshold: 80 }
		};
	}

	// Method to ensure panel never collides with search bar
	avoidSearchBarCollision() {
		const searchBar = document.getElementById('search-bar');
		if (!searchBar) return;

		const searchRect = searchBar.getBoundingClientRect();
		const panelRect = this.panel.getBoundingClientRect();
		
		// Check if panels overlap
		if (searchRect.bottom > panelRect.top && 
			searchRect.top < panelRect.bottom &&
			searchRect.right > panelRect.left &&
			searchRect.left < panelRect.right) {
			
			// Move panel below search bar
			const newTop = searchRect.bottom + 10;
			this.panel.style.top = `${newTop}px`;
		}
	}

	// Public method to show/hide panel
	show() {
		this.panel.style.display = 'block';
		this.avoidSearchBarCollision();
	}

	hide() {
		this.panel.style.display = 'none';
	}
}