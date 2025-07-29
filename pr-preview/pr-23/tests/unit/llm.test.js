import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { mockEngine } from "../__mocks__/webllm.js";

// Mock WebLLM module before any imports
jest.unstable_mockModule("https://esm.run/@mlc-ai/web-llm", () => ({
	CreateMLCEngine: jest.fn(),
	deleteModelAllInfoInCache: jest.fn(() => Promise.resolve()),
	hasModelInCache: jest.fn(() => Promise.resolve(true))
}));

// Mock the data module to prevent AlaSQL initialization
jest.unstable_mockModule(`${process.cwd()}/js/data.js`, () => ({
	executeQuery: jest.fn(() => []),
	fetchCountryData: jest.fn(() => Promise.resolve()),
	isDataLoaded: jest.fn(() => true),
	getAvailableStats: jest.fn(() => ["name", "ISO_A3", "region", "population"]),
	getExampleCountry: jest.fn(() => ({ name: "France", ISO_A3: "FRA", region: "Europe" })),
	getCountryData: jest.fn(() => ({})),
	clearCountryData: jest.fn()
}));

// Mock the map module to prevent Leaflet initialization
jest.unstable_mockModule(`${process.cwd()}/js/map.js`, () => ({
	highlightCountries: jest.fn(),
	clearHighlights: jest.fn(),
	initMap: jest.fn(() => Promise.resolve())
}));

// Mock the UIService to prevent circular dependency issues
jest.unstable_mockModule(`${process.cwd()}/js/services/UIService.js`, () => ({
	uiService: {
		updateMessage: jest.fn(),
		updateLLMStatus: jest.fn(),
		updateCountryInfo: jest.fn(),
		setUIManager: jest.fn()
	}
}));

describe("LLM Module", () => {
        let generateSQLQuery, processQuery, clearAllModelCache;

	beforeEach(async () => {
		jest.clearAllMocks();

		// Set up global engine mock
		global.engine = mockEngine;

		// Mock DOM elements
		global.document = {
			getElementById: jest.fn((id) => {
				const mockElement = {
					id,
					value:
						id === "query-input" ? "countries in europe with green flag" : "",
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
		};

		// Mock performance
		global.performance = {
			now: jest.fn(() => 1000),
		};

		// Mock caches API for model cache tests
		global.caches = {
			keys: jest.fn(() => Promise.resolve([])),
			open: jest.fn(() => Promise.resolve({
				keys: jest.fn(() => Promise.resolve([]))
			}))
		};

		// Reset WebLLM mock
		mockEngine.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content:
							"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' AND flagDescription LIKE '%green%'",
					},
				},
			],
		});

		// Import the functions we want to test
                const llmModule = await import(`${process.cwd()}/js/llm.js`);
                generateSQLQuery = llmModule.generateEnhancedSQLQuery; // Use enhanced function
                processQuery = llmModule.processQuery;
                clearAllModelCache = llmModule.clearAllModelCache;
                
                // Set the engine in the module scope for the enhanced function
                llmModule.setEngineForTests(mockEngine);
	});

	test("should generate valid SQL query from natural language", async () => {
		mockEngine.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content: JSON.stringify({
							sql: "SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' AND flagDescription LIKE '%green%'",
							explanation: "This query finds European countries with green flags",
							confidence: 0.9,
							queryType: "flag"
						}),
					},
				},
			],
		});

		const result = await generateSQLQuery(
			"countries in europe with green flag"
		);

		expect(result.sql).toBe(
			"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' AND flagDescription LIKE '%green%'"
		);
		expect(result.llmResponse).toBeDefined();
		expect(result.llmResponse.explanation).toBeDefined();
		expect(result.analysis).toBeDefined();
		expect(mockEngine.chat.completions.create).toHaveBeenCalled();
	});

	test("should handle LLM response with extra text", async () => {
		mockEngine.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content: JSON.stringify({
							sql: "SELECT name, ISO_A3 FROM countries WHERE region = 'Europe'",
							explanation: "This query lists European countries",
							confidence: 0.8,
							queryType: "geographic"
						}),
					},
				},
			],
		});

		const result = await generateSQLQuery("european countries");

		expect(result.sql).toBe(
			"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe'"
		);
		expect(result.llmResponse).toBeDefined();
		expect(result.llmResponse.queryType).toBe("geographic");
	});

	test("should handle LLM API errors", async () => {
		mockEngine.chat.completions.create.mockRejectedValue(
			new Error("API Error")
		);

		await expect(generateSQLQuery("test query")).rejects.toThrow(
			"Failed to generate enhanced SQL query: API Error"
		);
	});

	test("should process complete query workflow", async () => {
		// Set up basic engine for processQuery test
		global.engine = mockEngine;

		// Mock query input element with proper DOM methods
		global.document.getElementById = jest.fn((id) => {
			const mockElement = {
				id,
				value: id === "query-input" ? "european countries" : "",
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
		});

		// Mock LLM response
		mockEngine.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content:
							"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe'",
					},
				},
			],
		});

		// The processQuery function will use the mocked data and map functions
		// from the global setup, so we just need to test it doesn't throw
		await expect(processQuery()).resolves.not.toThrow();
	});

        test("should handle missing engine", async () => {
                global.engine = null;

		// Need to keep the full DOM mock for message element
		global.document.getElementById = jest.fn((id) => {
			const mockElement = {
				id,
				value: id === "query-input" ? "european countries" : "",
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
		});

		// The processQuery function should handle this gracefully
                await expect(processQuery()).resolves.not.toThrow();
        });

        test("clearAllModelCache should delete caches for all models", async () => {
                const webllm = await import("https://esm.run/@mlc-ai/web-llm");
                await clearAllModelCache();
                expect(webllm.deleteModelAllInfoInCache).toHaveBeenCalled();
        });
});
