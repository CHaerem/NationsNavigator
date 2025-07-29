import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

// Import the global test setup
import "../setup.js";

// Map Integration Tests - Comprehensive Coverage
describe("Map Integration Tests", () => {
    let mapModule;
    let mockMap, mockLayer, mockGeojsonLayer, mockTileLayer;

    beforeEach(async () => {
        jest.clearAllMocks();

        // Set up comprehensive map mocks
        mockLayer = {
            feature: {
                properties: {
                    ISO_A3: 'USA',
                    _originalISO: 'USA'
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
        };

        mockGeojsonLayer = {
            eachLayer: jest.fn((callback) => {
                callback(mockLayer);
            }),
            addLayer: jest.fn(),
            removeLayer: jest.fn(),
            addTo: jest.fn(() => mockGeojsonLayer)
        };

        mockTileLayer = {
            addTo: jest.fn(() => mockTileLayer)
        };

        mockMap = {
            on: jest.fn(),
            off: jest.fn(),
            setView: jest.fn(),
            getCenter: jest.fn(() => ({ lng: 0, lat: 20 })),
            getZoom: jest.fn(() => 3),
            fitBounds: jest.fn(),
            getBounds: jest.fn(() => ({
                getNorthEast: () => ({ lat: 60, lng: 100 }),
                getSouthWest: () => ({ lat: -60, lng: -100 })
            })),
            _loaded: true
        };

        // Mock Leaflet with comprehensive implementation
        global.L = {
            map: jest.fn((id, options) => {
                expect(id).toBe("map");
                expect(options).toHaveProperty('center');
                expect(options).toHaveProperty('zoom');
                return mockMap;
            }),
            tileLayer: jest.fn((url, options) => {
                expect(url).toContain('cartocdn.com');
                expect(options).toHaveProperty('attribution');
                return mockTileLayer;
            }),
            geoJSON: jest.fn((data, options) => {
                expect(data).toHaveProperty('type', 'FeatureCollection');
                expect(options).toHaveProperty('style');
                expect(options).toHaveProperty('onEachFeature');
                return mockGeojsonLayer;
            })
        };

        // Mock DOM elements
        global.document.getElementById = jest.fn((id) => {
            const elements = {
                'map': {
                    style: {},
                    addEventListener: jest.fn()
                },
                'query-input': {
                    value: 'test query'
                }
            };
            return elements[id] || { addEventListener: jest.fn(), style: {} };
        });

        // Mock fetch for GeoJSON data
        global.fetch = jest.fn(() => 
            Promise.resolve({
                json: () => Promise.resolve({
                    type: "FeatureCollection",
                    features: [
                        {
                            id: "USA",
                            properties: { ISO_A3: "USA" },
                            geometry: {
                                type: "Polygon",
                                coordinates: [[[-100, 40], [-90, 40], [-90, 50], [-100, 50], [-100, 40]]]
                            }
                        }
                    ]
                })
            })
        );

        // Mock window with proper sizing
        global.window = {
            ...global.window,
            map: null,
            innerWidth: 1200,
            innerHeight: 800
        };

        // Import map module after setting up mocks
        mapModule = await import("../../js/map.js");
    });

    afterEach(() => {
        if (mapModule && mapModule._resetForTesting) {
            mapModule._resetForTesting();
        }
        jest.clearAllMocks();
    });

    describe("Map Initialization", () => {
        test("should initialize map with correct settings", async () => {
            await mapModule.initMap();

            // Verify Leaflet map was created with correct parameters
            expect(global.L.map).toHaveBeenCalledWith("map", expect.objectContaining({
                center: [20, 0],
                zoom: 3,
                minZoom: 2,
                maxZoom: 18,
                tap: true,
                touchZoom: true,
                dragging: true,
                tapTolerance: 15,
                tapHoldDelay: 500,
                touchDebounceDelay: 64
            }));
        });

        test("should load tile layer correctly", async () => {
            await mapModule.initMap();

            expect(global.L.tileLayer).toHaveBeenCalledWith(
                "https://{s}.basemaps.cartocdn.com/voyager_nolabels/{z}/{x}/{y}{r}.png",
                expect.objectContaining({
                    attribution: "©OpenStreetMap, ©CartoDB",
                    noWrap: false,
                    maxZoom: 18,
                    detectRetina: true
                })
            );
            expect(mockTileLayer.addTo).toHaveBeenCalledWith(mockMap);
        });

        test("should fetch and process GeoJSON data", async () => {
            await mapModule.initMap();

            expect(global.fetch).toHaveBeenCalledWith(
                "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
            );

            expect(global.L.geoJSON).toHaveBeenCalled();
            const geoJSONCall = global.L.geoJSON.mock.calls[0];
            expect(geoJSONCall[0]).toHaveProperty('type', 'FeatureCollection');
            expect(geoJSONCall[1]).toHaveProperty('style');
            expect(geoJSONCall[1]).toHaveProperty('onEachFeature');
        });

        test("should set up event listeners for dynamic features", async () => {
            await mapModule.initMap();

            expect(mockMap.on).toHaveBeenCalledWith('moveend', expect.any(Function));
            expect(mockMap.on).toHaveBeenCalledWith('zoomend', expect.any(Function));
        });

        test("should set global window.map reference", async () => {
            await mapModule.initMap();

            expect(global.window.map).toBe(mockMap);
            expect(global.window.map._loaded).toBe(true);
        });

        test("should prevent multiple initializations", async () => {
            await mapModule.initMap();
            await mapModule.initMap(); // Second call

            // Should only be called once
            expect(global.L.map).toHaveBeenCalledTimes(1);
        });

        test("should handle initialization errors gracefully", async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(mapModule.initMap()).rejects.toThrow('Network error');
        });
    });

    describe("Country Styling", () => {
        test("should generate consistent colors for countries", async () => {
            await mapModule.initMap();

            const geoJSONCall = global.L.geoJSON.mock.calls[0];
            const styleFunction = geoJSONCall[1].style;

            const feature1 = { properties: { ISO_A3: 'USA' }, id: 'USA' };
            const feature2 = { properties: { ISO_A3: 'USA' }, id: 'USA' };
            const feature3 = { properties: { ISO_A3: 'CAN' }, id: 'CAN' };

            const style1 = styleFunction(feature1);
            const style2 = styleFunction(feature2);
            const style3 = styleFunction(feature3);

            // Same country should have same color
            expect(style1.fillColor).toBe(style2.fillColor);
            // Different countries should have different colors (with high probability)
            expect(style1.fillColor).not.toBe(style3.fillColor);

            // Verify style properties
            expect(style1).toHaveProperty('weight', 1.2);
            expect(style1).toHaveProperty('opacity', 1);
            expect(style1).toHaveProperty('fillOpacity', 0.85);
        });

        test("should handle missing country data in styling", async () => {
            await mapModule.initMap();

            const geoJSONCall = global.L.geoJSON.mock.calls[0];
            const styleFunction = geoJSONCall[1].style;

            const featureWithoutISO = { properties: {}, id: null };
            const style = styleFunction(featureWithoutISO);

            expect(style).toHaveProperty('fillColor');
            expect(style).toHaveProperty('weight', 1.2);
        });
    });

    describe("Event Handling Setup", () => {
        test("should set up country event handlers correctly", async () => {
            await mapModule.initMap();

            const geoJSONCall = global.L.geoJSON.mock.calls[0];
            const onEachFeature = geoJSONCall[1].onEachFeature;

            const mockFeature = {
                properties: { ISO_A3: 'USA', _originalISO: 'USA' }
            };

            onEachFeature(mockFeature, mockLayer);

            // Should set up click handler
            expect(mockLayer.on).toHaveBeenCalledWith('click', expect.any(Function));
        });

        test("should set up touch-specific handlers on touch devices", async () => {
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

            await mapModule.initMap();

            const geoJSONCall = global.L.geoJSON.mock.calls[0];
            const onEachFeature = geoJSONCall[1].onEachFeature;

            const mockFeature = {
                properties: { ISO_A3: 'USA', _originalISO: 'USA' }
            };

            onEachFeature(mockFeature, mockLayer);

            // Should set up both click and tap handlers on touch devices
            expect(mockLayer.on).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockLayer.on).toHaveBeenCalledWith('tap', expect.any(Function));
        });

        test("should set up hover effects on non-touch devices", async () => {
            // Ensure no touch support
            delete window.ontouchstart;
            Object.defineProperty(navigator, 'maxTouchPoints', {
                value: 0,
                writable: true,
                configurable: true
            });

            await mapModule.initMap();

            const geoJSONCall = global.L.geoJSON.mock.calls[0];
            const onEachFeature = geoJSONCall[1].onEachFeature;

            const mockFeature = {
                properties: { ISO_A3: 'USA', _originalISO: 'USA' }
            };

            onEachFeature(mockFeature, mockLayer);

            // Should set up hover handlers on non-touch devices
            expect(mockLayer.on).toHaveBeenCalledWith('mouseover', expect.any(Function));
            expect(mockLayer.on).toHaveBeenCalledWith('mouseout', expect.any(Function));
        });
    });

    describe("Map Reset Functionality", () => {
        test("should reset map to initial state", () => {
            mapModule._setGeojsonLayerForTesting(mockGeojsonLayer);

            mapModule.resetMap();

            expect(mockGeojsonLayer.eachLayer).toHaveBeenCalled();
            expect(mockMap.setView).toHaveBeenCalledWith([20, 0], 3);
        });

        test("should clear query input on reset", () => {
            const mockQueryInput = { value: 'test query' };
            global.document.getElementById = jest.fn((id) => {
                if (id === 'query-input') return mockQueryInput;
                return { addEventListener: jest.fn(), style: {} };
            });

            mapModule._setGeojsonLayerForTesting(mockGeojsonLayer);
            mapModule.resetMap();

            expect(mockQueryInput.value).toBe('');
        });

        test("should handle reset when geojsonLayer is not initialized", () => {
            // Reset with null layer should not throw
            expect(() => {
                mapModule.resetMap();
            }).not.toThrow();
        });
    });

    describe("Country Highlighting", () => {
        test("should highlight countries based on condition", () => {
            mapModule._setGeojsonLayerForTesting(mockGeojsonLayer);

            const condition = jest.fn((layer) => {
                return layer.feature.properties.ISO_A3 === 'USA';
            });

            const highlightedCount = mapModule.highlightCountries(condition);

            expect(condition).toHaveBeenCalled();
            expect(highlightedCount).toBeGreaterThanOrEqual(0);
            expect(mockGeojsonLayer.eachLayer).toHaveBeenCalled();
        });

        test("should handle highlighting when geojsonLayer is not initialized", () => {
            const condition = jest.fn(() => true);
            
            const result = mapModule.highlightCountries(condition);

            expect(result).toBe(0);
        });
    });

    describe("Individual Country Highlighting", () => {
        test("should highlight specific country by ISO code", () => {
            mapModule._setGeojsonLayerForTesting(mockGeojsonLayer);

            mapModule.highlightCountry('USA');

            expect(mockGeojsonLayer.eachLayer).toHaveBeenCalled();
            expect(mockLayer.bringToFront).toHaveBeenCalled();
        });

        test("should fit map bounds to highlighted country", () => {
            mapModule._setGeojsonLayerForTesting(mockGeojsonLayer);

            mapModule.highlightCountry('USA');

            expect(mockMap.fitBounds).toHaveBeenCalledWith(
                [[40, -100], [50, -80]],
                expect.objectContaining({
                    padding: [50, 50],
                    maxZoom: 5
                })
            );
        });

        test("should handle highlighting non-existent country", () => {
            mapModule._setGeojsonLayerForTesting(mockGeojsonLayer);

            expect(() => {
                mapModule.highlightCountry('INVALID');
            }).not.toThrow();
        });
    });

    describe("Utility Functions", () => {
        test("should return filtered countries", () => {
            const filteredCountries = mapModule.getFilteredCountries();
            expect(filteredCountries).toBeDefined();
            expect(typeof filteredCountries.has).toBe('function'); // Should be a Set
        });

        test("should provide initializeMap function", () => {
            expect(() => {
                mapModule.initializeMap();
            }).not.toThrow();
        });
    });

    describe("Testing Helpers", () => {
        test("should provide testing helper functions", () => {
            expect(typeof mapModule._setGeojsonLayerForTesting).toBe('function');
            expect(typeof mapModule._resetForTesting).toBe('function');
        });

        test("should reset testing state correctly", () => {
            mapModule._setGeojsonLayerForTesting(mockGeojsonLayer);
            mapModule._resetForTesting();

            // After reset, highlighting should handle null layer gracefully
            expect(() => {
                mapModule.highlightCountries(() => true);
            }).not.toThrow();
        });
    });

    describe("World Copy Management", () => {
        test("should handle infinite scrolling setup", async () => {
            await mapModule.initMap();

            // Verify that the map was set up with infinite scrolling support
            const geoJSONCall = global.L.geoJSON.mock.calls[0];
            const data = geoJSONCall[0];
            
            // Should have created multiple world copies
            expect(data.features.length).toBeGreaterThan(1);
            
            // Should have features with _copy property
            const copyFeatures = data.features.filter(f => f.properties._copy !== undefined);
            expect(copyFeatures.length).toBeGreaterThan(0);
        });

        test("should map ISO_A3 from id field", async () => {
            await mapModule.initMap();

            const geoJSONCall = global.L.geoJSON.mock.calls[0];
            const data = geoJSONCall[0];
            
            // Should have mapped id to ISO_A3 in properties
            const feature = data.features.find(f => f.properties.ISO_A3 === 'USA');
            expect(feature).toBeDefined();
            expect(feature.properties.ISO_A3).toBe('USA');
        });
    });

    describe("Error Handling", () => {
        test("should handle fetch errors during initialization", async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network failed'));

            await expect(mapModule.initMap()).rejects.toThrow('Network failed');
        });

        test("should handle invalid GeoJSON data", async () => {
            global.fetch.mockResolvedValueOnce({
                json: () => Promise.resolve({ invalid: 'data' })
            });

            // Should not throw, but may not work as expected
            await expect(mapModule.initMap()).resolves.not.toThrow();
        });

        test("should handle missing DOM elements", async () => {
            global.document.getElementById = jest.fn(() => null);

            // Should still attempt to initialize
            await expect(mapModule.initMap()).resolves.not.toThrow();
        });
    });

    describe("Touch-Specific Behavior", () => {
        test("should configure touch settings correctly", async () => {
            await mapModule.initMap();

            expect(global.L.map).toHaveBeenCalledWith("map", expect.objectContaining({
                tap: true,
                tapTolerance: 15,
                touchZoom: true,
                doubleClickZoom: true,
                scrollWheelZoom: true,
                boxZoom: true,
                keyboard: true,
                dragging: true,
                tapHoldDelay: 500,
                touchDebounceDelay: 64,
                clickTimeout: 300
            }));
        });

        test("should set up proper map bounds for touch devices", async () => {
            await mapModule.initMap();

            expect(global.L.map).toHaveBeenCalledWith("map", expect.objectContaining({
                maxBounds: [
                    [-90, -Infinity],
                    [90, Infinity]
                ],
                maxBoundsViscosity: 0.0,
                inertia: true,
                inertiaDeceleration: 3000,
                inertiaMaxSpeed: Infinity
            }));
        });
    });
});