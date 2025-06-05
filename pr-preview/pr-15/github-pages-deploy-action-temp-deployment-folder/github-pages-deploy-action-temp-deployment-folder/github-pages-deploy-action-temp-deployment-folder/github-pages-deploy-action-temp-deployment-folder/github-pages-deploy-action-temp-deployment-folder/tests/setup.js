// Test setup file
import { jest } from "@jest/globals";

// Mock fetch globally
global.fetch = jest.fn();

// Mock Leaflet
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
	geoJSON: jest.fn(() => ({
		addTo: jest.fn(),
		eachLayer: jest.fn(),
		getLayers: jest.fn(() => []),
	})),
};

// Mock AlaSQL
global.alasql = jest.fn();
global.alasql.tables = { countries: { data: [] } };

// Mock DOM elements
Object.defineProperty(window, "document", {
	value: {
		getElementById: jest.fn(() => ({
			value: "",
			innerHTML: "",
			style: {},
		})),
		createElement: jest.fn(() => ({
			innerHTML: "",
			style: {},
		})),
	},
});

// Reset all mocks before each test
beforeEach(() => {
	jest.clearAllMocks();
});
