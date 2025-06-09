import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// Mock the data module
jest.unstable_mockModule("/Users/christopherhaerem/Privat/NationsNavigator/js/data.js", () => ({
	getCountryData: jest.fn(() => ({
		USA: { name: "United States", ISO_A3: "USA", region: "Americas" },
		GBR: { name: "United Kingdom", ISO_A3: "GBR", region: "Europe" },
		IRL: { name: "Ireland", ISO_A3: "IRL", region: "Europe" },
		FRA: { name: "France", ISO_A3: "FRA", region: "Europe" },
	})),
	fetchCountryData: jest.fn(() => Promise.resolve()),
	isDataLoaded: jest.fn(() => true),
	executeQuery: jest.fn(() => [])
}));

// Mock the main module for core functions
jest.unstable_mockModule("/Users/christopherhaerem/Privat/NationsNavigator/js/main.js", () => ({
	processQuery: jest.fn(),
	resetMap: jest.fn(),
	highlightCountry: jest.fn(),
}));

// Mock the UIService to prevent circular dependency issues
jest.unstable_mockModule("/Users/christopherhaerem/Privat/NationsNavigator/js/services/UIService.js", () => ({
	uiService: {
		updateMessage: jest.fn(),
		updateLLMStatus: jest.fn(),
		updateCountryInfo: jest.fn(),
		setUIManager: jest.fn()
	}
}));

describe("Map Module", () => {
	let mockLayers;
	let mockGeojsonLayer;
	let highlightCountries, resetMap, highlightCountry, _setGeojsonLayerForTesting;

	beforeEach(async () => {
		jest.clearAllMocks();
		
		// Mock Leaflet
		global.L = {
			map: jest.fn(() => ({
				center: jest.fn(),
				zoom: jest.fn(),
				setView: jest.fn(),
				fitBounds: jest.fn(),
				on: jest.fn(), // Add the missing on method
				off: jest.fn(),
				addLayer: jest.fn(),
				removeLayer: jest.fn()
			})),
			tileLayer: jest.fn(() => ({
				addTo: jest.fn()
			})),
			geoJSON: jest.fn(() => ({
				addTo: jest.fn(),
				eachLayer: jest.fn(),
				getLayers: jest.fn(() => [])
			}))
		};
		
		// Mock fetch for GeoJSON data
		global.fetch = jest.fn(() => Promise.resolve({
			ok: true,
			json: () => Promise.resolve({
				type: "FeatureCollection",
				features: []
			})
		}));
		
		// Import the functions we want to test
		const mapModule = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/map.js");
		highlightCountries = mapModule.highlightCountries;
		resetMap = mapModule.resetMap;
		highlightCountry = mapModule.highlightCountry;
		_setGeojsonLayerForTesting = mapModule._setGeojsonLayerForTesting;

		// Create mock layers with different countries
		mockLayers = [
			{
				feature: { properties: { ISO_A3: "USA", NAME: "United States" } },
				setStyle: jest.fn(),
				options: { fillColor: "#E8E8E8" },
				getBounds: jest.fn(() => ({
					north: 50,
					south: 25,
					east: -66,
					west: -125,
				})),
				bringToFront: jest.fn(),
			},
			{
				feature: { properties: { ISO_A3: "GBR", NAME: "United Kingdom" } },
				setStyle: jest.fn(),
				options: { fillColor: "#E8E8E8" },
				getBounds: jest.fn(() => ({ north: 61, south: 49, east: 2, west: -8 })),
				bringToFront: jest.fn(),
			},
			{
				feature: { properties: { ISO_A3: "IRL", NAME: "Ireland" } },
				setStyle: jest.fn(),
				options: { fillColor: "#E8E8E8" },
				getBounds: jest.fn(() => ({
					north: 55,
					south: 51,
					east: -6,
					west: -10,
				})),
				bringToFront: jest.fn(),
			},
			{
				feature: { properties: { ISO_A3: "XXX", NAME: "Unknown Country" } },
				setStyle: jest.fn(),
				options: { fillColor: "#E8E8E8" },
				getBounds: jest.fn(() => ({ north: 0, south: 0, east: 0, west: 0 })),
				bringToFront: jest.fn(),
			},
		];

		// Mock geojsonLayer
		mockGeojsonLayer = {
			eachLayer: jest.fn((callback) => {
				mockLayers.forEach(callback);
			}),
			getLayers: jest.fn(() => mockLayers),
		};

		// Set up the geojsonLayer for testing
		_setGeojsonLayerForTesting(mockGeojsonLayer);

		// Also set global for compatibility
		global.map = {
			fitBounds: jest.fn(),
		};
	});

	test("should highlight countries based on condition function", async () => {
		// Condition to highlight European countries
		const condition = (layer) => {
			const iso = layer.feature.properties.ISO_A3;
			return ["GBR", "IRL"].includes(iso);
		};

		const highlightedCount = highlightCountries(condition);

		expect(highlightedCount).toBe(2);
		expect(mockLayers[1].setStyle).toHaveBeenCalledWith({
			fillColor: "#f59e0b",
			fillOpacity: 1,
			weight: 2,
			color: "#d97706",
		});
		expect(mockLayers[2].setStyle).toHaveBeenCalledWith({
			fillColor: "#f59e0b",
			fillOpacity: 1,
			weight: 2,
			color: "#d97706",
		});
		// Check that the first country was styled (color varies by ISO hash)
		expect(mockLayers[0].setStyle).toHaveBeenCalled();
		const firstCountryCall = mockLayers[0].setStyle.mock.calls[mockLayers[0].setStyle.mock.calls.length - 1][0];
		expect(firstCountryCall).toHaveProperty('fillOpacity', 0.85);
		expect(firstCountryCall).toHaveProperty('weight', 1.2);
		expect(firstCountryCall).toHaveProperty('color', '#475569');
	});

	test("should return 0 when no countries match condition", async () => {
		// Condition that matches no countries
		const condition = (layer) => {
			const iso = layer.feature.properties.ISO_A3;
			return iso === "NONEXISTENT";
		};

		const highlightedCount = highlightCountries(condition);

		expect(highlightedCount).toBe(0);
		// All countries should be set to default color (will vary based on ISO hash)
		mockLayers.forEach((layer, index) => {
			// Since colors are now based on ISO hash, we just check that setStyle was called
			expect(layer.setStyle).toHaveBeenCalled();
			// Check that the general structure is correct
			const lastCall = layer.setStyle.mock.calls[layer.setStyle.mock.calls.length - 1][0];
			expect(lastCall).toHaveProperty('fillOpacity', 0.85);
			expect(lastCall).toHaveProperty('weight', 1.2);
			expect(lastCall).toHaveProperty('color', '#475569');
		});
	});

	test("should handle countries with no data gracefully", async () => {
		// Condition that would match unknown country
		const condition = (layer) => {
			const iso = layer.feature.properties.ISO_A3;
			return iso === "XXX";
		};

		const highlightedCount = highlightCountries(condition);

		// Should be 0 because XXX has no country data (even though it exists in layer data)
		expect(highlightedCount).toBe(0);
	});

	test("should not highlight if geojsonLayer is not initialized", async () => {
		// Use the test helper to set geojsonLayer to null
		_setGeojsonLayerForTesting(null);

		const condition = () => true;
		const highlightedCount = highlightCountries(condition);

		expect(highlightedCount).toBe(0);
		// Restore geojsonLayer for other tests if necessary, or ensure beforeEach handles it
		_setGeojsonLayerForTesting(mockGeojsonLayer);
	});

	test("should reset map by clearing all highlights", async () => {
		resetMap();

		expect(mockGeojsonLayer.eachLayer).toHaveBeenCalled();
		// Should call setStyle for each layer to reset colors
		mockLayers.forEach((layer) => {
			expect(layer.setStyle).toHaveBeenCalled();
		});
	});

	test("should highlight specific country by ISO code", async () => {
		// Reset the map state first
		const mapModule = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/map.js");
		mapModule._resetForTesting();

		// Create a specific mock for the map instance with fitBounds
		const mockMapInstance = {
			center: jest.fn(),
			zoom: jest.fn(),
			setView: jest.fn(),
			fitBounds: jest.fn(),
		};

		// Override L.map to return our specific mock
		global.L.map.mockReturnValue(mockMapInstance);

		// Import and initialize map to get the mockMapInstance as the local map
		await mapModule.initMap(); // This will create the map with our mock

		// Set the geojsonLayer mock
		_setGeojsonLayerForTesting(mockGeojsonLayer);

		mapModule.highlightCountry("GBR");

		expect(mockGeojsonLayer.eachLayer).toHaveBeenCalled();
		expect(mockLayers[1].bringToFront).toHaveBeenCalled();

		// Now check our specific mock
		expect(mockMapInstance.fitBounds).toHaveBeenCalledWith(
			mockLayers[1].getBounds(),
			{ padding: [50, 50], maxZoom: 5 }
		);
	});

	test("should preserve selected country color when highlighting others", async () => {
		// Set one country as selected
		mockLayers[0].options.fillColor = "#0ea5e9"; // SELECTED color

		const condition = (layer) => {
			const iso = layer.feature.properties.ISO_A3;
			return iso === "GBR";
		};

		highlightCountries(condition);

		// Selected country should not be reset to default (colors now vary)
		// Just verify the selected country wasn't called with highlighting colors
		const selectedCalls = mockLayers[0].setStyle.mock.calls;
		const hasHighlightCall = selectedCalls.some(call => 
			call[0].fillColor === "#f59e0b" && call[0].weight === 2
		);
		expect(hasHighlightCall).toBe(false);

		// But GBR should be highlighted
		expect(mockLayers[1].setStyle).toHaveBeenCalledWith({
			fillColor: "#f59e0b",
			fillOpacity: 1,
			weight: 2,
			color: "#d97706",
		});
	});

	test("should configure map with proper world wrapping settings", async () => {
		const mapModule = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/map.js");
		mapModule._resetForTesting();

		// Mock L.map to capture configuration
		const mockMapInstance = {
			center: jest.fn(),
			zoom: jest.fn(),
			setView: jest.fn(),
			fitBounds: jest.fn(),
		};
		
		let mapConfig;
		global.L.map.mockImplementation((elementId, config) => {
			mapConfig = config;
			return mockMapInstance;
		});

		// Mock tile layer
		const mockTileLayer = {
			addTo: jest.fn(() => mockTileLayer),
		};
		global.L.tileLayer.mockReturnValue(mockTileLayer);

		await mapModule.initMap();

		// Verify map configuration supports world wrapping
		expect(mapConfig).toHaveProperty('worldCopyJump');
		expect(mapConfig).toHaveProperty('maxBoundsViscosity');
		expect(mapConfig).toHaveProperty('inertia', true);
		
		// Verify tile layer allows wrapping
		expect(global.L.tileLayer).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				noWrap: false
			})
		);
	});
});
