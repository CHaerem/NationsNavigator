import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { mockEngine } from "./__mocks__/webllm.js";

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
                const llmModule = await import("../js/llm.js");
                generateSQLQuery = llmModule.generateSQLQuery;
                processQuery = llmModule.processQuery;
                clearAllModelCache = llmModule.clearAllModelCache;
	});

	test("should generate valid SQL query from natural language", async () => {
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

		const result = await generateSQLQuery(
			"countries in europe with green flag"
		);

		expect(result).toBe(
			"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' AND flagDescription LIKE '%green%'"
		);
		expect(mockEngine.chat.completions.create).toHaveBeenCalled();
	});

	test("should handle LLM response with extra text", async () => {
		mockEngine.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content:
							"Here's the SQL query you need:\n\nSELECT name, ISO_A3 FROM countries WHERE region = 'Europe'\n\nThis will find European countries.",
					},
				},
			],
		});

		const result = await generateSQLQuery("european countries");

		expect(result).toBe(
			"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe'"
		);
	});

	test("should handle LLM API errors", async () => {
		mockEngine.chat.completions.create.mockRejectedValue(
			new Error("API Error")
		);

		await expect(generateSQLQuery("test query")).rejects.toThrow(
			"Failed to generate SQL query: API Error"
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
