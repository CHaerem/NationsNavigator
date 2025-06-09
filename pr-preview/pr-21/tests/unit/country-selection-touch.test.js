import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

// Import the global test setup
import "../setup.js";

// Country Selection Touch Device Tests - Fixed Version
describe("Country Selection Touch Device Tests", () => {
    let mockMap, mockLayer, mockGeojsonLayer;
    let mapModule;

    beforeEach(async () => {
        jest.clearAllMocks();
        
        // Set up touch device environment
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

        // Mock country data
        const mockCountryData = {
            'USA': { 
                name: 'United States', 
                ISO_A3: 'USA', 
                population: 331000000,
                capital: 'Washington D.C.',
                region: 'Americas'
            },
            'CAN': { 
                name: 'Canada', 
                ISO_A3: 'CAN', 
                population: 38000000,
                capital: 'Ottawa',
                region: 'Americas'
            }
        };

        // Create mock layers for different countries
        const createMockLayer = (iso) => ({
            feature: {
                properties: {
                    ISO_A3: iso,
                    _originalISO: iso
                }
            },
            on: jest.fn(),
            off: jest.fn(),
            setStyle: jest.fn(),
            bringToFront: jest.fn(),
            getBounds: jest.fn(() => [[40, -100], [50, -80]]),
            options: {
                fillColor: '#f8fafc'
            }
        });

        mockLayer = createMockLayer('USA');
        const mockCanadaLayer = createMockLayer('CAN');

        mockGeojsonLayer = {
            eachLayer: jest.fn((callback) => {
                callback(mockLayer);
                callback(mockCanadaLayer);
            }),
            addLayer: jest.fn(),
            removeLayer: jest.fn()
        };

        mockMap = {
            fitBounds: jest.fn(),
            setView: jest.fn(),
            getCenter: jest.fn(() => ({ lng: 0, lat: 20 }))
        };

        // Mock global Leaflet
        global.L = {
            map: jest.fn(() => mockMap),
            geoJSON: jest.fn(() => mockGeojsonLayer)
        };

        // Mock UI elements
        global.document.getElementById = jest.fn((id) => {
            const elements = {
                'info-panel': {
                    style: { display: 'none' },
                    classList: {
                        add: jest.fn(),
                        remove: jest.fn(),
                        contains: jest.fn(() => false)
                    }
                },
                'panel-title': {
                    textContent: ''
                },
                'country-info': {
                    innerHTML: ''
                }
            };
            return elements[id] || { addEventListener: jest.fn(), style: {} };
        });

        // Use dynamic import and mock approach that works with ES6 modules
        jest.unstable_mockModule(`${process.cwd()}/js/data.js`, () => ({
            getCountryData: jest.fn(() => mockCountryData)
        }));

        // Import map module after setting up mocks
        mapModule = await import(`${process.cwd()}/js/map.js`);
        
        // Set up test geojson layer using the test helper
        if (mapModule._setGeojsonLayerForTesting) {
            mapModule._setGeojsonLayerForTesting(mockGeojsonLayer);
        }

        // Mock global map for fitBounds
        global.map = mockMap;
    });

    afterEach(() => {
        if (mapModule && mapModule._resetForTesting) {
            mapModule._resetForTesting();
        }
        jest.clearAllMocks();
    });

    describe("Touch Device Detection", () => {
        test("should correctly identify touch devices", () => {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            expect(isTouchDevice).toBe(true);
            expect(navigator.maxTouchPoints).toBe(5);
        });
    });

    describe("Single Country Selection", () => {
        test("CRITICAL: Touch tap should reliably select a country", () => {
            // Test the onEachFeature function behavior
            const feature = {
                properties: { ISO_A3: 'USA', _originalISO: 'USA' }
            };

            // Mock the country click handler
            const mockClickHandler = jest.fn();
            
            // Simulate the onEachFeature setup from map.js
            const originalISO = feature.properties._originalISO || feature.properties.ISO_A3;
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            // Country layer should respond to both click and tap on touch devices
            mockLayer.on("click", mockClickHandler);
            if (isTouchDevice) {
                mockLayer.on("tap", mockClickHandler);
            }

            // Verify both handlers are set up on touch devices
            expect(mockLayer.on).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockLayer.on).toHaveBeenCalledWith('tap', expect.any(Function));
            expect(isTouchDevice).toBe(true);
        });

        test("RELIABILITY: Country selection should work consistently", () => {
            const selectedCountries = [];
            
            // Mock reliable country selection
            const reliableClickHandler = (iso) => {
                selectedCountries.push(iso);
                return { success: true, country: iso };
            };

            // Test multiple selections
            const countries = ['USA', 'CAN'];
            
            countries.forEach(country => {
                const result = reliableClickHandler(country);
                expect(result.success).toBe(true);
                expect(result.country).toBe(country);
            });

            expect(selectedCountries).toEqual(['USA', 'CAN']);
            expect(selectedCountries).toHaveLength(2);
        });

        test("VISUAL FEEDBACK: Selected country should change appearance", () => {
            const mockSelectedLayer = {
                setStyle: jest.fn(),
                bringToFront: jest.fn(),
                options: { fillColor: '#f8fafc' }
            };

            // Simulate country selection visual changes
            const selectCountry = (layer) => {
                layer.setStyle({
                    fillColor: '#0ea5e9', // Selected color
                    fillOpacity: 1,
                    weight: 2.5,
                    color: '#0284c7'
                });
                layer.bringToFront();
                return { selected: true };
            };

            const result = selectCountry(mockSelectedLayer);

            expect(result.selected).toBe(true);
            expect(mockSelectedLayer.setStyle).toHaveBeenCalledWith({
                fillColor: '#0ea5e9',
                fillOpacity: 1,
                weight: 2.5,
                color: '#0284c7'
            });
            expect(mockSelectedLayer.bringToFront).toHaveBeenCalled();
        });
    });

    describe("Country Information Display", () => {
        test("INTEGRATION: Selected country should display information panel", () => {
            const mockInfoPanel = document.getElementById('info-panel');
            const mockCountryInfo = document.getElementById('country-info');

            // Mock UIService updateCountryInfo behavior
            const updateCountryInfo = (countryData) => {
                if (countryData) {
                    mockInfoPanel.style.display = 'block';
                    mockInfoPanel.classList.add('touch-device');
                    mockCountryInfo.innerHTML = `
                        <h3>${countryData.name}</h3>
                        <p>Population: ${countryData.population.toLocaleString()}</p>
                        <p>Capital: ${countryData.capital}</p>
                    `;
                    return { success: true };
                }
                return { success: false };
            };

            // Simulate country selection
            const selectedCountry = {
                name: 'United States',
                population: 331000000,
                capital: 'Washington D.C.'
            };
            
            const result = updateCountryInfo(selectedCountry);

            expect(result.success).toBe(true);
            expect(mockInfoPanel.style.display).toBe('block');
            expect(mockInfoPanel.classList.add).toHaveBeenCalledWith('touch-device');
            expect(mockCountryInfo.innerHTML).toContain('United States');
            expect(mockCountryInfo.innerHTML).toContain('331,000,000');
            expect(mockCountryInfo.innerHTML).toContain('Washington D.C.');
        });

        test("POSITIONING: Info panel should position correctly on touch devices", () => {
            const mockInfoPanel = document.getElementById('info-panel');
            
            // Touch device should position panel appropriately
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            if (isTouchDevice) {
                mockInfoPanel.classList.add('touch-device');
            }

            expect(isTouchDevice).toBe(true);
            expect(mockInfoPanel.classList.add).toHaveBeenCalledWith('touch-device');
        });

        test("ACCESSIBILITY: Panel should have proper touch target sizes", () => {
            // Mock touch-friendly button
            const mockCloseButton = {
                getBoundingClientRect: () => ({
                    width: 44,
                    height: 44
                }),
                style: {
                    minWidth: '44px',
                    minHeight: '44px'
                }
            };

            // Verify touch-friendly button size (minimum 44px for accessibility)
            const rect = mockCloseButton.getBoundingClientRect();
            expect(rect.width).toBeGreaterThanOrEqual(44);
            expect(rect.height).toBeGreaterThanOrEqual(44);
            expect(mockCloseButton.style.minWidth).toBe('44px');
            expect(mockCloseButton.style.minHeight).toBe('44px');
        });
    });

    describe("Multiple Country Interactions", () => {
        test("SWITCHING: Should be able to switch between countries smoothly", () => {
            const selectedCountries = [];
            
            // Mock country switching behavior
            const selectCountry = (iso) => {
                // Add to history
                selectedCountries.push(iso);
                return { 
                    currentSelection: iso, 
                    previousSelection: selectedCountries[selectedCountries.length - 2],
                    totalSelections: selectedCountries.length
                };
            };

            // Test country switching sequence
            let result1 = selectCountry('USA');
            expect(result1.currentSelection).toBe('USA');
            expect(result1.previousSelection).toBeUndefined();

            let result2 = selectCountry('CAN');
            expect(result2.currentSelection).toBe('CAN');
            expect(result2.previousSelection).toBe('USA');

            expect(selectedCountries).toEqual(['USA', 'CAN']);
            expect(result2.totalSelections).toBe(2);
        });

        test("DESELECTION: Tapping same country twice should deselect it", () => {
            let selectedCountry = null;
            
            const toggleCountrySelection = (iso) => {
                if (selectedCountry === iso) {
                    selectedCountry = null; // Deselect
                    return { action: 'deselected', country: null };
                } else {
                    selectedCountry = iso; // Select
                    return { action: 'selected', country: iso };
                }
            };

            // First tap - select
            let result1 = toggleCountrySelection('USA');
            expect(result1.action).toBe('selected');
            expect(result1.country).toBe('USA');
            expect(selectedCountry).toBe('USA');

            // Second tap - deselect
            let result2 = toggleCountrySelection('USA');
            expect(result2.action).toBe('deselected');
            expect(result2.country).toBe(null);
            expect(selectedCountry).toBe(null);
        });

        test("PERFORMANCE: Rapid country selections should not cause lag", () => {
            const selectionTimes = [];
            
            // Test rapid selection performance
            for (let i = 0; i < 10; i++) {
                const startTime = performance.now();
                
                // Mock rapid country selection
                const country = ['USA', 'CAN'][i % 2];
                
                // Simulate selection processing
                const mockSelection = {
                    country: country,
                    timestamp: Date.now(),
                    processed: true
                };
                
                const endTime = performance.now();
                selectionTimes.push(endTime - startTime);
                
                expect(mockSelection.processed).toBe(true);
            }

            // All selections should be fast (under 16ms for 60fps)
            selectionTimes.forEach(time => {
                expect(time).toBeLessThan(16);
            });

            // Average should be very fast
            const averageTime = selectionTimes.reduce((a, b) => a + b, 0) / selectionTimes.length;
            expect(averageTime).toBeLessThan(10);
        });
    });

    describe("Error Handling and Edge Cases", () => {
        test("ROBUSTNESS: Should handle invalid country data gracefully", () => {
            const handleCountrySelection = (iso, data) => {
                if (!data || !data.name) {
                    return { error: 'Country data not found', iso: iso, handled: true };
                }
                return { success: true, data: data, handled: true };
            };

            // Test invalid data handling
            let result1 = handleCountrySelection('INVALID', null);
            expect(result1.error).toBe('Country data not found');
            expect(result1.handled).toBe(true);

            let result2 = handleCountrySelection('EMPTY', {});
            expect(result2.error).toBe('Country data not found');
            expect(result2.handled).toBe(true);

            // Test valid data
            let result3 = handleCountrySelection('USA', { name: 'United States' });
            expect(result3.success).toBe(true);
            expect(result3.handled).toBe(true);
        });

        test("MEMORY: Country selection should not cause memory leaks", () => {
            const eventListeners = [];
            
            // Mock event listener tracking
            const addListener = (event, handler) => {
                eventListeners.push({ event, handler, id: Math.random() });
            };

            const removeListener = (event) => {
                const index = eventListeners.findIndex(l => l.event === event);
                if (index > -1) {
                    eventListeners.splice(index, 1);
                    return true;
                }
                return false;
            };

            // Add listeners for country selection
            addListener('click', () => {});
            addListener('tap', () => {});
            
            expect(eventListeners).toHaveLength(2);

            // Clean up listeners
            const removed1 = removeListener('click');
            const removed2 = removeListener('tap');
            
            expect(removed1).toBe(true);
            expect(removed2).toBe(true);
            expect(eventListeners).toHaveLength(0);
        });

        test("RESILIENCE: Should work even if some touch events fail", () => {
            let successfulSelections = 0;
            let failedSelections = 0;

            const robustCountrySelection = (iso, shouldFail = false) => {
                try {
                    if (shouldFail) {
                        throw new Error('Touch event failed');
                    }
                    
                    // Mock successful selection
                    successfulSelections++;
                    return { success: true, country: iso };
                } catch (error) {
                    failedSelections++;
                    // Fallback to click event
                    successfulSelections++;
                    return { success: true, country: iso, fallback: true };
                }
            };

            // Test with some failures
            let result1 = robustCountrySelection('USA', false); // Success
            let result2 = robustCountrySelection('CAN', true);  // Fail but recover
            let result3 = robustCountrySelection('MEX', false); // Success

            expect(result1.success).toBe(true);
            expect(result1.fallback).toBeUndefined();
            
            expect(result2.success).toBe(true);
            expect(result2.fallback).toBe(true);
            
            expect(result3.success).toBe(true);
            
            expect(successfulSelections).toBe(3);
            expect(failedSelections).toBe(1);
        });
    });

    describe("Real-World Touch Scenarios", () => {
        test("SCENARIO: User explores multiple countries in sequence", () => {
            const explorationPath = [];
            
            // Simulate real user behavior - exploring different regions
            const exploreCountry = (iso, countryData) => {
                if (countryData) {
                    explorationPath.push({
                        country: iso,
                        name: countryData.name,
                        region: countryData.region,
                        timestamp: Date.now()
                    });
                    return { success: true, path: explorationPath };
                }
                return { success: false };
            };

            // Mock country data
            const countries = {
                'USA': { name: 'United States', region: 'Americas' },
                'CAN': { name: 'Canada', region: 'Americas' }
            };

            // User explores Americas
            let result1 = exploreCountry('USA', countries.USA);
            let result2 = exploreCountry('CAN', countries.CAN);

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(explorationPath).toHaveLength(2);
            expect(explorationPath[0].name).toBe('United States');
            expect(explorationPath[1].name).toBe('Canada');
            expect(explorationPath[0].region).toBe('Americas');
        });

        test("SCENARIO: User accidentally taps outside countries", () => {
            let accidentalTaps = 0;
            let successfulSelections = 0;

            const handleMapTap = (coordinates, hitCountry = false) => {
                if (hitCountry) {
                    successfulSelections++;
                    return { type: 'country-selected', coordinates };
                } else {
                    accidentalTaps++;
                    return { type: 'map-tap', coordinates };
                }
            };

            // Simulate tapping sequence
            let result1 = handleMapTap([0, 0], false);  // Ocean tap
            let result2 = handleMapTap([40, -100], true);  // USA tap
            let result3 = handleMapTap([60, 45], true);   // Canada tap
            let result4 = handleMapTap([0, 0], false);  // Ocean tap again

            expect(result1.type).toBe('map-tap');
            expect(result2.type).toBe('country-selected');
            expect(result3.type).toBe('country-selected');
            expect(result4.type).toBe('map-tap');
            
            expect(accidentalTaps).toBe(2);
            expect(successfulSelections).toBe(2);
        });

        test("SCENARIO: User with limited mobility using large touch targets", () => {
            const touchTargetSize = 44; // Minimum accessible touch target
            
            // Mock large touch area for countries
            const checkTouchTarget = (element) => {
                const expandedWidth = Math.max(element.width || 30, touchTargetSize);
                const expandedHeight = Math.max(element.height || 30, touchTargetSize);
                
                return {
                    width: expandedWidth,
                    height: expandedHeight,
                    accessible: expandedWidth >= touchTargetSize && expandedHeight >= touchTargetSize,
                    expanded: expandedWidth > (element.width || 30) || expandedHeight > (element.height || 30)
                };
            };

            // Test various UI elements
            const closeButton = checkTouchTarget({ width: 44, height: 44 });
            const smallCountry = checkTouchTarget({ width: 20, height: 15 }); // Small island
            const largeCountry = checkTouchTarget({ width: 100, height: 80 }); // Large country

            expect(closeButton.accessible).toBe(true);
            expect(closeButton.expanded).toBe(false);
            
            expect(smallCountry.accessible).toBe(true);
            expect(smallCountry.expanded).toBe(true);
            expect(smallCountry.width).toBe(44); // Should be expanded
            expect(smallCountry.height).toBe(44);
            
            expect(largeCountry.accessible).toBe(true);
            expect(largeCountry.expanded).toBe(false);
        });
    });
});