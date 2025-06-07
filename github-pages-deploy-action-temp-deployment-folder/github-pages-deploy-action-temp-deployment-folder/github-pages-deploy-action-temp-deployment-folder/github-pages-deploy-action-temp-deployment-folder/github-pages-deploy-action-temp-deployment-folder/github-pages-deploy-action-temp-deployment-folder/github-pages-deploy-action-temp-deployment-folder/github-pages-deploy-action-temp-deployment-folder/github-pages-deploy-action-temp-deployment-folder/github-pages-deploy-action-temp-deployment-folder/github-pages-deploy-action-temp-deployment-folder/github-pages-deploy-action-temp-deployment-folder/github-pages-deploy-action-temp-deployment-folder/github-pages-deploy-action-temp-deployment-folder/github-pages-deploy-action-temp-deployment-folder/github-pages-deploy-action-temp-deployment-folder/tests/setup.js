// Test setup file
import { jest } from "@jest/globals";

// Mock fetch globally with proper responses
global.fetch = jest.fn(() =>
	Promise.resolve({
		ok: true,
		json: () =>
			Promise.resolve({
				metadata: {
					version: "1.0.0",
					lastUpdated: "2024-01-01",
				},
				countries: [
					{ name: "United States", ISO_A3: "USA", region: "Americas" },
					{ name: "United Kingdom", ISO_A3: "GBR", region: "Europe" },
					{ name: "Ireland", ISO_A3: "IRL", region: "Europe" },
					// Note: XXX is intentionally NOT included in country data to test graceful handling
				],
			}),
	})
);

// Mock Leaflet with proper geojsonLayer behavior
const mockLayers = [
	{
		feature: { properties: { ISO_A3: "USA", name: "United States" } },
		setStyle: jest.fn(),
		bringToFront: jest.fn(),
		getBounds: jest.fn(() => []),
	},
	{
		feature: { properties: { ISO_A3: "GBR", name: "United Kingdom" } },
		setStyle: jest.fn(),
		bringToFront: jest.fn(),
		getBounds: jest.fn(() => []),
	},
	{
		feature: { properties: { ISO_A3: "IRL", name: "Ireland" } },
		setStyle: jest.fn(),
		bringToFront: jest.fn(),
		getBounds: jest.fn(() => []),
	},
	{
		feature: { properties: { ISO_A3: "XXX", name: "Test Country" } },
		setStyle: jest.fn(),
		bringToFront: jest.fn(),
		getBounds: jest.fn(() => []),
	},
];

global.L = {
	map: jest.fn(() => ({
		center: jest.fn(),
		zoom: jest.fn(),
		setView: jest.fn(),
		fitBounds: jest.fn(),
	})),
	tileLayer: jest.fn(() => ({
		addTo: jest.fn(),
	})),
	geoJSON: jest.fn((data, options) => ({
		addTo: jest.fn(),
		eachLayer: jest.fn((callback) => {
			mockLayers.forEach(callback);
		}),
		getLayers: jest.fn(() => mockLayers),
	})),
};

// Mock AlaSQL
global.alasql = jest.fn(() => [
	{ name: "United States", ISO_A3: "USA" },
	{ name: "United Kingdom", ISO_A3: "GBR" },
]);
global.alasql.tables = {
	countries: {
		data: [
			{ name: "United States", ISO_A3: "USA", region: "Americas" },
			{ name: "United Kingdom", ISO_A3: "GBR", region: "Europe" },
			{ name: "Ireland", ISO_A3: "IRL", region: "Europe" },
			{ name: "Test Country", ISO_A3: "XXX", region: "Test" },
		],
	},
};

// Mock global objects used by app
global.map = {
	center: jest.fn(),
	zoom: jest.fn(),
	setView: jest.fn(),
	fitBounds: jest.fn(),
};

// Ensure document is properly set up
if (typeof window !== "undefined" && window.document) {
	// Mock document.getElementById to return proper DOM elements
	window.document.getElementById = jest.fn((id) => {
		const mockElement = {
			id,
			value: "",
			innerHTML: "",
			textContent: "",
			style: {},
			classList: {
				add: jest.fn(),
				remove: jest.fn(),
				contains: jest.fn(() => false),
			},
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			querySelectorAll: jest.fn(() => []),
			querySelector: jest.fn(() => null),
		};
		return mockElement;
	});
}

// Also set up global.document for Node.js test environment
if (typeof global.document === "undefined") {
	global.document = {
		getElementById: jest.fn((id) => {
			const mockElement = {
				id,
				value: id === "llm-select" ? "Llama-3.2-1B-Instruct-q4f16_1-MLC" : "",
				innerHTML: "",
				textContent: "",
				style: {},
				classList: {
					add: jest.fn(),
					remove: jest.fn(),
					contains: jest.fn(() => false),
				},
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
				querySelectorAll: jest.fn(() => []),
				querySelector: jest.fn(() => null),
				setAttribute: jest.fn(),
				getAttribute: jest.fn(() => null),
			};
			return mockElement;
		}),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		querySelectorAll: jest.fn(() => []),
		querySelector: jest.fn(() => null),
	};
}

// Store original layers for access in tests
global.mockLayers = mockLayers;

// Create manual spy functions that can be used in tests
global.createManualSpy = (returnValue) => {
	const spy = jest.fn();
	if (returnValue !== undefined) {
		spy.mockReturnValue(returnValue);
	}
	spy.mockReturnValue = jest.fn((value) => {
		spy.mockImplementation(() => value);
		return spy;
	});
	spy.mockImplementation = jest.fn((implementation) => {
		spy.mockReset();
		spy.mockImplementationOnce(implementation);
		return spy;
	});
	spy.mockRejectedValue = jest.fn((value) => {
		spy.mockImplementation(() => Promise.reject(value));
		return spy;
	});
	spy.mockResolvedValue = jest.fn((value) => {
		spy.mockImplementation(() => Promise.resolve(value));
		return spy;
	});
	return spy;
};

// Reset all mocks before each test
beforeEach(() => {
	jest.clearAllMocks();

	// Reset mockLayers
	mockLayers.forEach((layer) => {
		layer.setStyle.mockClear();
		layer.bringToFront.mockClear();
		layer.getBounds.mockClear();
	});

	// Reset fetch mock to default behavior
	global.fetch.mockImplementation(() =>
		Promise.resolve({
			ok: true,
			json: () =>
				Promise.resolve({
					metadata: {
						version: "1.0.0",
						lastUpdated: "2024-01-01",
					},
					countries: [
						{ name: "United States", ISO_A3: "USA", region: "Americas" },
						{ name: "United Kingdom", ISO_A3: "GBR", region: "Europe" },
						{ name: "Ireland", ISO_A3: "IRL", region: "Europe" },
						{ name: "Test Country", ISO_A3: "XXX", region: "Test" },
					],
				}),
		})
	);
});
