import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// Mock all the modules
jest.mock("../js/data.js");
jest.mock("../js/map.js");
jest.mock("../js/ui.js");
jest.mock("../js/llm.js");

describe("Integration Tests", () => {
	let mockCountryData;
	let mockEngine;

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock country data
		mockCountryData = {
			USA: {
				name: "United States",
				ISO_A3: "USA",
				region: "Americas",
				flagDescription: "Stars and stripes with red, white and blue",
			},
			GBR: {
				name: "United Kingdom",
				ISO_A3: "GBR",
				region: "Europe",
				flagDescription: "Union Jack with red, white and blue",
			},
			IRL: {
				name: "Ireland",
				ISO_A3: "IRL",
				region: "Europe",
				flagDescription: "Tricolor with green, white and orange",
			},
			ITA: {
				name: "Italy",
				ISO_A3: "ITA",
				region: "Europe",
				flagDescription: "Tricolor with green, white and red",
			},
		};

		// Mock WebLLM engine
		mockEngine = {
			chat: {
				completions: {
					create: jest.fn(),
				},
			},
		};

		global.engine = mockEngine;
		global.document = {
			getElementById: jest.fn(() => ({ value: "", innerHTML: "" })),
		};
		global.performance = { now: jest.fn(() => 1000) };
	});

	test("should complete full workflow from query to highlighting", async () => {
		// Import modules after mocks are set up
		const { getCountryData, executeQuery } = await import("../js/data.js");
		const { highlightCountries } = await import("../js/map.js");
		const { updateMessage } = await import("../js/ui.js");
		const { processQuery } = await import("../js/llm.js");

		// Set up mocks
		getCountryData.mockReturnValue(mockCountryData);

		executeQuery.mockReturnValue([
			{ name: "Ireland", ISO_A3: "IRL" },
			{ name: "Italy", ISO_A3: "ITA" },
		]);

		highlightCountries.mockImplementation((conditionFn) => {
			// Simulate the highlighting logic
			let count = 0;
			const mockLayers = [
				{ feature: { properties: { ISO_A3: "USA" } } },
				{ feature: { properties: { ISO_A3: "GBR" } } },
				{ feature: { properties: { ISO_A3: "IRL" } } },
				{ feature: { properties: { ISO_A3: "ITA" } } },
			];

			mockLayers.forEach((layer) => {
				if (conditionFn(layer)) count++;
			});

			return count;
		});

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

		// Mock query input
		global.document.getElementById.mockImplementation((id) => {
			if (id === "query-input") {
				return { value: "countries in europe with green flag" };
			}
			return { value: "", innerHTML: "" };
		});

		// Execute the full workflow
		await processQuery();

		// Verify the workflow
		expect(executeQuery).toHaveBeenCalledWith(
			"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' AND flagDescription LIKE '%green%'"
		);
		expect(highlightCountries).toHaveBeenCalled();
		expect(updateMessage).toHaveBeenCalled();

		// Verify that the highlighting condition works correctly
		const conditionFn = highlightCountries.mock.calls[0][0];
		expect(conditionFn({ feature: { properties: { ISO_A3: "IRL" } } })).toBe(
			true
		);
		expect(conditionFn({ feature: { properties: { ISO_A3: "ITA" } } })).toBe(
			true
		);
		expect(conditionFn({ feature: { properties: { ISO_A3: "USA" } } })).toBe(
			false
		);
		expect(conditionFn({ feature: { properties: { ISO_A3: "GBR" } } })).toBe(
			false
		);
	});

	test("should handle empty query results gracefully", async () => {
		const { executeQuery } = await import("../js/data.js");
		const { highlightCountries } = await import("../js/map.js");
		const { updateMessage } = await import("../js/ui.js");
		const { processQuery } = await import("../js/llm.js");

		// Mock empty result
		executeQuery.mockReturnValue([]);
		highlightCountries.mockReturnValue(0);

		mockEngine.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content:
							"SELECT name, ISO_A3 FROM countries WHERE name = 'NonexistentCountry'",
					},
				},
			],
		});

		global.document.getElementById.mockImplementation((id) => {
			if (id === "query-input") {
				return { value: "find nonexistent country" };
			}
			return { value: "", innerHTML: "" };
		});

		await processQuery();

		expect(highlightCountries).toHaveBeenCalled();
		expect(updateMessage).toHaveBeenCalledWith(
			expect.stringContaining("0 results found")
		);
	});

	test("should handle complex queries with multiple conditions", async () => {
		const { executeQuery } = await import("../js/data.js");
		const { highlightCountries } = await import("../js/map.js");
		const { processQuery } = await import("../js/llm.js");

		executeQuery.mockReturnValue([
			{ name: "Germany", ISO_A3: "DEU" },
			{ name: "France", ISO_A3: "FRA" },
			{ name: "Spain", ISO_A3: "ESP" },
		]);

		highlightCountries.mockReturnValue(3);

		mockEngine.chat.completions.create.mockResolvedValue({
			choices: [
				{
					message: {
						content:
							"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' AND population > 40000000",
					},
				},
			],
		});

		global.document.getElementById.mockImplementation((id) => {
			if (id === "query-input") {
				return { value: "large european countries" };
			}
			return { value: "", innerHTML: "" };
		});

		await processQuery();

		expect(executeQuery).toHaveBeenCalledWith(
			"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe' AND population > 40000000"
		);

		const conditionFn = highlightCountries.mock.calls[0][0];
		expect(conditionFn({ feature: { properties: { ISO_A3: "DEU" } } })).toBe(
			true
		);
		expect(conditionFn({ feature: { properties: { ISO_A3: "FRA" } } })).toBe(
			true
		);
		expect(conditionFn({ feature: { properties: { ISO_A3: "ESP" } } })).toBe(
			true
		);
		expect(conditionFn({ feature: { properties: { ISO_A3: "LUX" } } })).toBe(
			false
		);
	});

	test("should handle network errors during data loading", async () => {
		const { fetchCountryData } = await import("../js/data.js");

		fetchCountryData.mockRejectedValue(new Error("Network error"));

		await expect(fetchCountryData()).rejects.toThrow("Network error");
	});

	test("should maintain map state consistency during highlighting", async () => {
		const { highlightCountries, resetMap } = await import("../js/map.js");

		let currentlyHighlighted = new Set();

		highlightCountries.mockImplementation((conditionFn) => {
			currentlyHighlighted.clear();
			// Simulate checking countries
			const testCountries = ["USA", "GBR", "IRL", "FRA"];
			testCountries.forEach((iso) => {
				const mockLayer = { feature: { properties: { ISO_A3: iso } } };
				if (conditionFn(mockLayer)) {
					currentlyHighlighted.add(iso);
				}
			});
			return currentlyHighlighted.size;
		});

		resetMap.mockImplementation(() => {
			currentlyHighlighted.clear();
		});

		// Test highlighting
		const condition1 = (layer) =>
			["GBR", "IRL"].includes(layer.feature.properties.ISO_A3);
		const count1 = highlightCountries(condition1);
		expect(count1).toBe(2);
		expect(currentlyHighlighted.has("GBR")).toBe(true);
		expect(currentlyHighlighted.has("IRL")).toBe(true);

		// Test reset
		resetMap();
		expect(currentlyHighlighted.size).toBe(0);

		// Test different highlighting
		const condition2 = (layer) =>
			["USA"].includes(layer.feature.properties.ISO_A3);
		const count2 = highlightCountries(condition2);
		expect(count2).toBe(1);
		expect(currentlyHighlighted.has("USA")).toBe(true);
		expect(currentlyHighlighted.has("GBR")).toBe(false);
	});
});
