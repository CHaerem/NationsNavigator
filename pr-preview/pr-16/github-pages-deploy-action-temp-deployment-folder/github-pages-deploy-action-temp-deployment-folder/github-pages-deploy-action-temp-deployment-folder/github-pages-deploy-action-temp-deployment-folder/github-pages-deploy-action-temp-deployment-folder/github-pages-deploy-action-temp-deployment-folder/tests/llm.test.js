import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import { generateSQLQuery, processQuery } from "../js/llm.js";

// Mock the required modules
jest.mock("../js/data.js", () => ({
	executeQuery: jest.fn(),
	getCountryData: jest.fn(() => ({
		GBR: { name: "United Kingdom", ISO_A3: "GBR", region: "Europe" },
		IRL: { name: "Ireland", ISO_A3: "IRL", region: "Europe" },
		FRA: { name: "France", ISO_A3: "FRA", region: "Europe" },
	})),
}));

jest.mock("../js/map.js", () => ({
	highlightCountries: jest.fn(() => 2),
}));

jest.mock("../js/ui.js", () => ({
	updateMessage: jest.fn(),
}));

// Mock WebLLM engine
const mockEngine = {
	chat: {
		completions: {
			create: jest.fn(),
		},
	},
};

describe("LLM Module", () => {
	beforeEach(() => {
		jest.clearAllMocks();

		// Set up global engine mock
		global.engine = mockEngine;

		// Mock DOM elements
		global.document = {
			getElementById: jest.fn((id) => {
				if (id === "query-input") {
					return { value: "countries in europe with green flag" };
				}
				return { value: "", innerHTML: "" };
			}),
		};

		// Mock performance
		global.performance = {
			now: jest.fn(() => 1000),
		};
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
		expect(mockEngine.chat.completions.create).toHaveBeenCalledWith({
			messages: expect.arrayContaining([
				expect.objectContaining({
					role: "system",
					content: expect.stringContaining("You are a helpful assistant"),
				}),
				expect.objectContaining({
					role: "user",
					content: "countries in europe with green flag",
				}),
			]),
		});
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

	test("should handle invalid LLM responses", async () => {
		mockEngine.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content: "I cannot generate a SQL query for that request.",
					},
				},
			],
		});

		await expect(generateSQLQuery("invalid query")).rejects.toThrow(
			"Failed to generate SQL query"
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
		const { executeQuery } = await import("../js/data.js");
		const { highlightCountries } = await import("../js/map.js");
		const { updateMessage } = await import("../js/ui.js");

		// Mock LLM response
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

		// Mock query execution result
		executeQuery.mockReturnValue([
			{ name: "Ireland", ISO_A3: "IRL" },
			{ name: "Italy", ISO_A3: "ITA" },
		]);

		await processQuery();

		expect(executeQuery).toHaveBeenCalledWith(
			"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' AND flagDescription LIKE '%green%'"
		);
		expect(highlightCountries).toHaveBeenCalledWith(expect.any(Function));
		expect(updateMessage).toHaveBeenCalledWith(
			expect.stringContaining("2 countries highlighted")
		);
	});

	test("should handle query execution errors", async () => {
		const { executeQuery } = await import("../js/data.js");
		const { updateMessage } = await import("../js/ui.js");

		// Mock LLM response
		mockEngine.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content: "SELECT name FROM invalid_table",
					},
				},
			],
		});

		// Mock query execution error
		const error = new Error("Table does not exist");
		error.sqlQuery = "SELECT name FROM invalid_table";
		executeQuery.mockImplementation(() => {
			throw error;
		});

		await processQuery();

		expect(updateMessage).toHaveBeenCalledWith(
			expect.stringContaining("There was an error executing the SQL query")
		);
	});

	test("should handle missing engine", async () => {
		global.engine = null;
		const { updateMessage } = await import("../js/ui.js");

		await processQuery();

		expect(updateMessage).toHaveBeenCalledWith(
			expect.stringContaining("WebLLM is not initialized")
		);
	});

	test("should correctly create highlighting condition function", async () => {
		const { executeQuery } = await import("../js/data.js");
		const { highlightCountries } = await import("../js/map.js");

		// Mock LLM and query result
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

		executeQuery.mockReturnValue([
			{ name: "Ireland", ISO_A3: "IRL" },
			{ name: "France", ISO_A3: "FRA" },
		]);

		await processQuery();

		// Get the condition function that was passed to highlightCountries
		const conditionFunction = highlightCountries.mock.calls[0][0];

		// Test the condition function
		const mockLayer1 = { feature: { properties: { ISO_A3: "IRL" } } };
		const mockLayer2 = { feature: { properties: { ISO_A3: "USA" } } };
		const mockLayer3 = { feature: { properties: { ISO_A3: "FRA" } } };

		expect(conditionFunction(mockLayer1)).toBe(true); // Ireland should be highlighted
		expect(conditionFunction(mockLayer2)).toBe(false); // USA should not be highlighted
		expect(conditionFunction(mockLayer3)).toBe(true); // France should be highlighted
	});

	test("should format result message correctly", async () => {
		const { executeQuery } = await import("../js/data.js");
		const { updateMessage } = await import("../js/ui.js");

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

		executeQuery.mockReturnValue([{ name: "Ireland", ISO_A3: "IRL" }]);

		await processQuery();

		const messageCall = updateMessage.mock.calls.find(
			(call) => call[0].includes("SQL Query:") && call[0].includes("Results:")
		);

		expect(messageCall).toBeDefined();
		expect(messageCall[0]).toContain("1 result found");
		expect(messageCall[0]).toContain("Ireland");
		expect(messageCall[0]).toContain("2 countries highlighted"); // Mock returns 2
	});
});
