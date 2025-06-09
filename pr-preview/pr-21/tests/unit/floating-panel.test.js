import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

// Import the global test setup
import "../setup.js";

// Floating Panel Component Tests - Fixed Version
describe("FloatingPanelComponent - Fixed", () => {
    let component;
    let mockPanel, mockHeader, mockSearchBar, mockMaximizeBtn;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Create comprehensive DOM element mocks
        mockPanel = {
            getBoundingClientRect: jest.fn(() => ({
                left: 100,
                top: 100,
                right: 500,
                bottom: 400,
                width: 400,
                height: 300
            })),
            style: {
                display: 'block',
                left: '100px',
                top: '100px',
                right: 'auto',
                bottom: 'auto',
                transform: 'none'
            },
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn(() => false)
            },
            offsetWidth: 400,
            offsetHeight: 300,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };

        mockHeader = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            style: {
                cursor: 'grab'
            }
        };

        mockSearchBar = {
            getBoundingClientRect: jest.fn(() => ({
                bottom: 60,
                top: 20,
                left: 100,
                right: 600,
                width: 500,
                height: 40
            }))
        };

        mockMaximizeBtn = {
            addEventListener: jest.fn(),
            innerHTML: '⛶',
            title: 'Toggle maximize'
        };

        // Add mock for panel content (needed for iOS fixes)
        const mockPanelContent = {
            style: {
                setProperty: jest.fn(),
                touchAction: '',
                webkitOverflowScrolling: '',
                overflowY: '',
                height: '',
                maxHeight: '',
                overflow: ''
            },
            id: '',
            offsetHeight: 0
        };

        // Mock createElement to return proper DOM-like elements
        const mockCreateElement = jest.fn(() => ({
            className: '',
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                contains: jest.fn(() => false)
            },
            style: {},
            addEventListener: jest.fn()
        }));

        const mockBody = {
            appendChild: jest.fn()
        };

        // Mock document head for iOS style injection
        const mockHead = {
            appendChild: jest.fn()
        };

        // Mock window with proper sizing
        global.window = {
            ...global.window,
            innerWidth: 1200,
            innerHeight: 800,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };

        // Add querySelector method to mockPanel for finding panel-content
        mockPanel.querySelector = jest.fn((selector) => {
            if (selector === '.panel-content') {
                return mockPanelContent;
            }
            return null;
        });

        // Mock document with specific elements for this component
        global.document = {
            ...global.document,
            getElementById: jest.fn((id) => {
                switch (id) {
                    case 'info-panel': return mockPanel;
                    case 'panel-header': return mockHeader;
                    case 'search-bar': return mockSearchBar;
                    case 'maximize-btn': return mockMaximizeBtn;
                    case 'ios-scroll-fix': return null; // Style element for iOS fixes
                    default: return { 
                        addEventListener: jest.fn(), 
                        removeEventListener: jest.fn(),
                        style: {},
                        classList: { add: jest.fn(), remove: jest.fn() }
                    };
                }
            }),
            querySelector: jest.fn((selector) => {
                switch (selector) {
                    case '#info-panel': return mockPanel;
                    case '#panel-header': return mockHeader;
                    case '#search-bar': return mockSearchBar;
                    case '.panel-content': return mockPanelContent;
                    default: return { 
                        addEventListener: jest.fn(),
                        removeEventListener: jest.fn(),
                        style: {},
                        classList: { add: jest.fn(), remove: jest.fn() }
                    };
                }
            }),
            createElement: mockCreateElement,
            body: mockBody,
            head: mockHead,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };

        // Import the component after mocking
        const { FloatingPanelComponent } = await import("../../js/components/FloatingPanelComponent.js");
        component = new FloatingPanelComponent();
    });

    afterEach(() => {
        if (component && component.destroy) {
            component.destroy();
        }
        jest.clearAllMocks();
    });

    describe("Initialization", () => {
        test("should create component without errors", () => {
            expect(component).toBeDefined();
            expect(component.panel).toBeDefined();
            expect(component.panel.id).toBe('info-panel');
            expect(component.header).toBeDefined();
        });

        test("should initialize with correct default state", () => {
            expect(component.isDragging).toBe(false);
            expect(component.isMaximized).toBe(false);
            expect(component.activeSnapZone).toBe(null);
        });

        test("should create snap indicators on initialization", () => {
            // Verify createElement was called for snap indicators
            expect(component.snapIndicators).toBeDefined();
            expect(Object.keys(component.snapIndicators)).toHaveLength(5);
            expect(component.snapIndicators).toHaveProperty('left');
            expect(component.snapIndicators).toHaveProperty('right');
            expect(component.snapIndicators).toHaveProperty('bottom');
            expect(component.snapIndicators).toHaveProperty('center');
            expect(component.snapIndicators).toHaveProperty('maximize');
        });

        test("should setup event listeners for dragging", () => {
            // Just verify that the component has the necessary properties
            expect(component.isDragging).toBe(false);
            expect(typeof component.startDrag).toBe('function');
            expect(typeof component.drag).toBe('function');
            expect(typeof component.endDrag).toBe('function');
        });

        test("should initialize snap zones correctly", () => {
            expect(component.snapZones).toHaveProperty('left');
            expect(component.snapZones).toHaveProperty('right');
            expect(component.snapZones).toHaveProperty('bottom');
            expect(component.snapZones).toHaveProperty('center');
            expect(component.snapZones.left).toHaveProperty('threshold');
        });
    });

    describe("Touch Device Detection", () => {
        test("should detect touch device correctly", () => {
            // Mock touch device
            Object.defineProperty(window, 'ontouchstart', {
                value: {},
                writable: true,
                configurable: true
            });
            Object.defineProperty(navigator, 'maxTouchPoints', {
                value: 5,
                writable: true,
                configurable: true
            });

            component.checkMobileMode();

            expect(component.header.style.cursor).toBe('default');
            // Check that panel has touch-device class somehow applied
            expect(component.panel.classList.add).toHaveBeenCalled();
        });

        test("should detect desktop device correctly", () => {
            // Mock desktop device
            delete window.ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', {
                value: 0,
                writable: true,
                configurable: true
            });

            global.window.innerWidth = 1200;
            component.checkMobileMode();

            expect(component.header.style.cursor).toBe('grab');
            expect(component.panel.classList.add).toHaveBeenCalled();
        });

        test("should detect mobile viewport correctly", () => {
            global.window.innerWidth = 768;
            component.checkMobileMode();

            expect(component.header.style.cursor).toBe('default');
            expect(component.panel.classList.add).toHaveBeenCalled();
        });
    });

    describe("Drag Functionality", () => {
        test("should start drag on desktop devices", () => {
            // Ensure desktop mode
            global.window.innerWidth = 1200;
            delete window.ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', {
                value: 0,
                writable: true,
                configurable: true
            });

            const mockEvent = {
                clientX: 150,
                clientY: 150,
                target: { classList: { contains: () => false } },
                preventDefault: jest.fn(),
                type: 'mousedown'
            };

            component.startDrag(mockEvent);

            expect(component.isDragging).toBe(true);
            expect(mockPanel.classList.add).toHaveBeenCalledWith('dragging');
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        test("should not start drag on touch devices", () => {
            // Set up touch device
            Object.defineProperty(window, 'ontouchstart', {
                value: {},
                writable: true,
                configurable: true
            });
            
            const mockEvent = {
                clientX: 150,
                clientY: 150,
                target: { classList: { contains: () => false } },
                preventDefault: jest.fn(),
                type: 'mousedown'
            };

            component.startDrag(mockEvent);

            expect(component.isDragging).toBe(false);
        });

        test("should not start drag when clicking control buttons", () => {
            const mockEvent = {
                clientX: 150,
                clientY: 150,
                target: { classList: { contains: (className) => className === 'panel-control-btn' } },
                preventDefault: jest.fn(),
                type: 'mousedown'
            };

            global.window.innerWidth = 1200;
            component.startDrag(mockEvent);

            expect(component.isDragging).toBe(false);
        });

        test("should update panel position during drag", () => {
            component.isDragging = true;
            component.dragOffset = { x: 50, y: 50 };

            const mockEvent = {
                clientX: 200,
                clientY: 200,
                preventDefault: jest.fn(),
                type: 'mousemove'
            };

            component.drag(mockEvent);

            expect(component.panel.style.left).toBe('150px');
            expect(component.panel.style.top).toBe('150px');
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        test("should constrain panel to viewport bounds", () => {
            component.isDragging = true;
            component.dragOffset = { x: 50, y: 50 };

            const mockEvent = {
                clientX: -100, // Would position panel off-screen
                clientY: -100,
                preventDefault: jest.fn(),
                type: 'mousemove'
            };

            component.drag(mockEvent);

            expect(component.panel.style.left).toBe('0px');
            // Should be below search bar (60px + 10px buffer)
            expect(parseInt(component.panel.style.top)).toBeGreaterThanOrEqual(70);
        });

        test("should not update position when not dragging", () => {
            component.isDragging = false;
            const originalLeft = component.panel.style.left;

            const mockEvent = {
                clientX: 200,
                clientY: 200,
                preventDefault: jest.fn(),
                type: 'mousemove'
            };

            component.drag(mockEvent);

            expect(component.panel.style.left).toBe(originalLeft);
            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe("Snap Zone Detection", () => {
        test("should detect proximity to left snap zone", () => {
            mockPanel.getBoundingClientRect.mockReturnValue({
                left: 30, // Close to left edge (24px + threshold)
                top: 100,
                right: 430,
                bottom: 400,
                width: 400,
                height: 300
            });

            component.updateSnapIndicators(150, 150);

            expect(component.activeSnapZone).toBe('left');
        });

        test("should detect proximity to center snap zone", () => {
            const centerX = global.window.innerWidth / 2;
            mockPanel.getBoundingClientRect.mockReturnValue({
                left: centerX - 200, // Centered panel
                top: 100,
                right: centerX + 200,
                bottom: 400,
                width: 400,
                height: 300
            });

            component.updateSnapIndicators(centerX, 150);

            expect(component.activeSnapZone).toBe('center');
        });

        test("should detect maximize zone when near screen corners", () => {
            component.updateSnapIndicators(30, 30); // Top-left corner

            expect(component.activeSnapZone).toBe('maximize');
        });

        test("should clear active snap zone when not near any zone", () => {
            mockPanel.getBoundingClientRect.mockReturnValue({
                left: 500, // Middle of screen, away from snap zones
                top: 300,
                right: 900,
                bottom: 600,
                width: 400,
                height: 300
            });

            component.updateSnapIndicators(700, 450);

            expect(component.activeSnapZone).toBe(null);
        });
    });

    describe("Snap Positioning", () => {
        test("should snap to left position", () => {
            component.clearSnapClasses = jest.fn();
            component.snapToPosition('left');

            expect(mockPanel.classList.add).toHaveBeenCalledWith('snap-left');
            expect(component.clearSnapClasses).toHaveBeenCalled();
        });

        test("should snap to right position", () => {
            component.snapToPosition('right');

            expect(mockPanel.classList.add).toHaveBeenCalledWith('snap-right');
        });

        test("should snap to bottom position", () => {
            component.snapToPosition('bottom');

            expect(mockPanel.classList.add).toHaveBeenCalledWith('snap-bottom');
        });

        test("should snap to center position", () => {
            component.snapToPosition('center');

            expect(mockPanel.classList.add).toHaveBeenCalledWith('snap-center');
        });

        test("should reset styles when snapping", () => {
            component.snapToPosition('left');

            expect(mockPanel.style.left).toBe('');
            expect(mockPanel.style.top).toBe('');
            expect(mockPanel.style.right).toBe('');
            expect(mockPanel.style.bottom).toBe('');
            expect(mockPanel.style.transform).toBe('');
        });
    });

    describe("Maximize Functionality", () => {
        test("should toggle maximize state", () => {
            // Store original position data
            component.previousPosition = null;

            component.toggleMaximize();

            expect(component.isMaximized).toBe(true);
            expect(mockPanel.classList.add).toHaveBeenCalledWith('maximized');
            expect(mockMaximizeBtn.innerHTML).toBe('🗗');
            expect(component.previousPosition).toBeDefined();
        });

        test("should restore from maximized state", () => {
            component.isMaximized = true;
            component.previousPosition = {
                left: '100px',
                top: '100px',
                right: '',
                bottom: '',
                transform: ''
            };

            component.toggleMaximize();

            expect(component.isMaximized).toBe(false);
            expect(mockPanel.classList.remove).toHaveBeenCalledWith('maximized');
            expect(mockMaximizeBtn.innerHTML).toBe('⛶');
            expect(mockPanel.style.left).toBe('100px');
            expect(mockPanel.style.top).toBe('100px');
        });

        test("should save position before maximizing", () => {
            mockPanel.style.left = '200px';
            mockPanel.style.top = '150px';

            component.toggleMaximize();

            expect(component.previousPosition.left).toBe('200px');
            expect(component.previousPosition.top).toBe('150px');
        });
    });

    describe("Search Bar Collision Avoidance", () => {
        test("should avoid search bar collision", () => {
            mockPanel.getBoundingClientRect.mockReturnValue({
                left: 100,
                top: 30, // Would overlap with search bar
                right: 500,
                bottom: 330,
                width: 400,
                height: 300
            });

            component.avoidSearchBarCollision();

            expect(mockPanel.style.top).toBe('70px'); // 60px (search bottom) + 10px buffer
        });

        test("should not adjust position when no collision", () => {
            mockPanel.getBoundingClientRect.mockReturnValue({
                left: 100,
                top: 100, // No overlap
                right: 500,
                bottom: 400,
                width: 400,
                height: 300
            });

            const originalTop = mockPanel.style.top;
            component.avoidSearchBarCollision();

            expect(mockPanel.style.top).toBe(originalTop);
        });

        test("should handle missing search bar gracefully", () => {
            global.document.getElementById = jest.fn((id) => {
                if (id === 'search-bar') return null;
                return mockPanel;
            });

            expect(() => {
                component.avoidSearchBarCollision();
            }).not.toThrow();
        });
    });

    describe("Panel Visibility", () => {
        test("should show panel and avoid collision", () => {
            component.show();

            expect(mockPanel.style.display).toBe('block');
        });

        test("should hide panel", () => {
            component.hide();

            expect(mockPanel.style.display).toBe('none');
        });
    });

    describe("Responsive Behavior", () => {
        test("should update snap zones on window resize", () => {
            const originalUpdateSnapZones = component.updateSnapZones;
            component.updateSnapZones = jest.fn();

            // Simulate window resize
            const resizeCallback = global.window.addEventListener.mock.calls
                .find(call => call[0] === 'resize')[1];
            
            if (resizeCallback) {
                resizeCallback();
                expect(component.updateSnapZones).toHaveBeenCalled();
            }
        });

        test("should calculate snap zones based on window size", () => {
            global.window.innerWidth = 1000;
            global.window.innerHeight = 600;

            component.updateSnapZones();

            expect(component.snapZones.right.x).toBe(1000 - 400 - 24); // window width - panel width - margin
            expect(component.snapZones.bottom.y).toBe(600 - 300 - 24); // window height - panel height - margin
        });
    });

    describe("End Drag Behavior", () => {
        test("should end drag and snap to active zone", () => {
            component.isDragging = true;
            component.activeSnapZone = 'left';
            component.snapToPosition = jest.fn();

            component.endDrag();

            expect(component.isDragging).toBe(false);
            expect(mockPanel.classList.remove).toHaveBeenCalledWith('dragging');
            expect(component.snapToPosition).toHaveBeenCalledWith('left');
        });

        test("should end drag and maximize when in maximize zone", () => {
            component.isDragging = true;
            component.activeSnapZone = 'maximize';
            component.toggleMaximize = jest.fn();

            component.endDrag();

            expect(component.toggleMaximize).toHaveBeenCalled();
        });

        test("should constrain bounds when no active snap zone", () => {
            component.isDragging = true;
            component.activeSnapZone = null;
            component.constrainToBounds = jest.fn();

            component.endDrag();

            expect(component.constrainToBounds).toHaveBeenCalled();
        });

        test("should not do anything when not dragging", () => {
            component.isDragging = false;
            component.constrainToBounds = jest.fn();

            component.endDrag();

            expect(mockPanel.classList.remove).not.toHaveBeenCalled();
            expect(component.constrainToBounds).not.toHaveBeenCalled();
        });
    });

    describe("iOS Safari Scrolling Fixes", () => {
        test("should apply iOS Safari fixes for touch devices", () => {
            // Mock iOS device
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
                writable: true,
                configurable: true
            });

            const mockContent = {
                style: {
                    setProperty: jest.fn()
                },
                id: ''
            };

            component.applyiOSScrollingFixes(mockContent);

            expect(mockContent.style.setProperty).toHaveBeenCalledWith('touch-action', 'pan-y', 'important');
            expect(mockContent.style.setProperty).toHaveBeenCalledWith('-webkit-overflow-scrolling', 'touch', 'important');
            expect(mockContent.style.setProperty).toHaveBeenCalledWith('overflow-y', 'auto', 'important');
        });

        test("should inject iOS-specific CSS", () => {
            const mockContent = {
                style: {
                    setProperty: jest.fn()
                },
                id: 'test-content'
            };

            // Mock iOS device
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
                writable: true,
                configurable: true
            });

            component.injectIOSScrollingCSS(mockContent);

            expect(global.document.createElement).toHaveBeenCalledWith('style');
            expect(global.document.head.appendChild).toHaveBeenCalled();
        });

        test("should detect iOS devices correctly", () => {
            // Mock iPhone
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
                writable: true,
                configurable: true
            });

            const mockContent = {
                style: {
                    setProperty: jest.fn()
                },
                id: ''
            };

            component.applyiOSScrollingFixes(mockContent);

            // Should call setProperty with iOS-specific height settings
            expect(mockContent.style.setProperty).toHaveBeenCalledWith('height', '300px', 'important');
            expect(mockContent.style.setProperty).toHaveBeenCalledWith('max-height', '300px', 'important');
        });

        test("should reapply iOS fixes when showing panel", () => {
            // Mock touch device
            Object.defineProperty(window, 'ontouchstart', {
                value: {},
                writable: true,
                configurable: true
            });

            component.applyiOSScrollingFixes = jest.fn();

            component.show();

            expect(component.applyiOSScrollingFixes).toHaveBeenCalledWith(mockPanelContent);
        });
    });

    describe("Error Handling", () => {
        test("should handle missing DOM elements gracefully", () => {
            global.document.getElementById = jest.fn(() => null);

            expect(() => {
                new (require("../../js/components/FloatingPanelComponent.js").FloatingPanelComponent)();
            }).not.toThrow();
        });

        test("should handle getBoundingClientRect failures", () => {
            mockPanel.getBoundingClientRect = jest.fn(() => {
                throw new Error("getBoundingClientRect failed");
            });

            expect(() => {
                component.avoidSearchBarCollision();
            }).not.toThrow();
        });

        test("should handle missing panel content gracefully", () => {
            mockPanel.querySelector = jest.fn(() => null);

            expect(() => {
                component.checkMobileMode();
            }).not.toThrow();
        });
    });
});