import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import {
	highlightCountries,
	resetMap,
	highlightCountry,
	_setGeojsonLayerForTesting,
} from "../js/map.js";

// Mock the data module
jest.mock("../js/data.js", () => ({
	getCountryData: jest.fn(() => ({
		USA: { name: "United States", ISO_A3: "USA", region: "Americas" },
		GBR: { name: "United Kingdom", ISO_A3: "GBR", region: "Europe" },
		IRL: { name: "Ireland", ISO_A3: "IRL", region: "Europe" },
		FRA: { name: "France", ISO_A3: "FRA", region: "Europe" },
	})),
}));

// Mock the ui module
jest.mock("../js/ui.js", () => ({
	updateCountryInfo: jest.fn(),
	updateMessage: jest.fn(),
}));

describe("Map Module", () => {
	let mockLayers;
	let mockGeojsonLayer;

	beforeEach(() => {
		jest.clearAllMocks();

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
		// Import map module after setting up mocks
		const { highlightCountries } = await import("../js/map.js");

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
		const { highlightCountries } = await import("../js/map.js");

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
		const { highlightCountries } = await import("../js/map.js");

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

		const { highlightCountries } = await import("../js/map.js");

		const condition = () => true;
		const highlightedCount = highlightCountries(condition);

		expect(highlightedCount).toBe(0);
		// Restore geojsonLayer for other tests if necessary, or ensure beforeEach handles it
		_setGeojsonLayerForTesting(mockGeojsonLayer);
	});

	test("should reset map by clearing all highlights", async () => {
		const { resetMap } = await import("../js/map.js");

		resetMap();

		expect(mockGeojsonLayer.eachLayer).toHaveBeenCalled();
		// Should call setStyle for each layer to reset colors
		mockLayers.forEach((layer) => {
			expect(layer.setStyle).toHaveBeenCalled();
		});
	});

	test("should highlight specific country by ISO code", async () => {
		// Reset the map state first
		const { _resetForTesting, _setGeojsonLayerForTesting } = await import(
			"../js/map.js"
		);
		_resetForTesting();

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
		const { initMap, highlightCountry } = await import("../js/map.js");
		await initMap(); // This will create the map with our mock

		// Set the geojsonLayer mock
		_setGeojsonLayerForTesting(mockGeojsonLayer);

		highlightCountry("GBR");

		expect(mockGeojsonLayer.eachLayer).toHaveBeenCalled();
		expect(mockLayers[1].bringToFront).toHaveBeenCalled();

		// Now check our specific mock
		expect(mockMapInstance.fitBounds).toHaveBeenCalledWith(
			mockLayers[1].getBounds(),
			{ padding: [50, 50], maxZoom: 5 }
		);
	});

	test("should preserve selected country color when highlighting others", async () => {
		const { highlightCountries } = await import("../js/map.js");

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
});
