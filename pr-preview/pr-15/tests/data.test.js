import { describe, test, expect, jest, beforeEach } from "@jest/globals";
import {
	fetchCountryData,
	getCountryData,
	executeQuery,
	getAvailableStats,
	clearCountryData,
} from "../js/data.js";

// Mock country data
const mockCountryData = {
	metadata: {
		version: "1.0.0",
		lastUpdated: "2024-01-01",
	},
	countries: [
		{
			ISO_A3: "USA",
			ISO_A2: "US",
			name: "United States",
			officialName: "United States of America",
			population: 331000000,
			languages: "English",
			area: 9833520.0,
			capital: "Washington, D.C.",
			region: "Americas",
			subregion: "Northern America",
			flagDescription: "Stars and stripes with red, white and blue colors",
			currencies: "US Dollar ($)",
			continents: "North America",
		},
		{
			ISO_A3: "GBR",
			ISO_A2: "GB",
			name: "United Kingdom",
			officialName: "United Kingdom of Great Britain and Northern Ireland",
			population: 67000000,
			languages: "English",
			area: 242495.0,
			capital: "London",
			region: "Europe",
			subregion: "Northern Europe",
			flagDescription: "Union Jack with red, white and blue colors",
			currencies: "British Pound (£)",
			continents: "Europe",
		},
		{
			ISO_A3: "IRL",
			ISO_A2: "IE",
			name: "Ireland",
			officialName: "Republic of Ireland",
			population: 5000000,
			languages: "English, Irish",
			area: 70273.0,
			capital: "Dublin",
			region: "Europe",
			subregion: "Northern Europe",
			flagDescription: "Tricolor with green, white and orange stripes",
			currencies: "Euro (€)",
			continents: "Europe",
		},
	],
};

describe("Data Module", () => {
	beforeEach(() => {
		// Reset the module state
		jest.clearAllMocks();

		// Mock successful fetch
		global.fetch.mockResolvedValue({
			json: jest.fn().mockResolvedValue(mockCountryData),
		});

		// Mock AlaSQL
		global.alasql.mockImplementation((query, params) => {
			if (query.includes("CREATE TABLE")) return true;
			if (query.includes("DELETE FROM")) return true;
			if (query.includes("INSERT INTO")) return true;

			// Mock query execution
			if (query.includes("region = 'Europe'")) {
				return [
					{ name: "United Kingdom", ISO_A3: "GBR" },
					{ name: "Ireland", ISO_A3: "IRL" },
				];
			}
			if (query.includes("flagDescription LIKE '%green%'")) {
				return [{ name: "Ireland", ISO_A3: "IRL" }];
			}
			return [];
		});
	});

	test("should fetch and process country data correctly", async () => {
		await fetchCountryData();

		expect(global.fetch).toHaveBeenCalledWith("data/countryData.json");

		const countryData = getCountryData();
		expect(countryData).toHaveProperty("USA");
		expect(countryData).toHaveProperty("GBR");
		expect(countryData).toHaveProperty("IRL");

		expect(countryData.USA.name).toBe("United States");
		expect(countryData.GBR.region).toBe("Europe");
		expect(countryData.IRL.flagDescription).toContain("green");
	});

	test("should not fetch data twice if already loaded", async () => {
		// First fetch
		await fetchCountryData();
		global.fetch.mockClear();

		// Second fetch should not call fetch again
		await fetchCountryData();
		expect(global.fetch).not.toHaveBeenCalled();
	});

	test("should handle fetch errors gracefully", async () => {
		// Clear any existing data first
		const { clearCountryData } = await import("../js/data.js");
		clearCountryData();

		global.fetch.mockRejectedValue(new Error("Network error"));

		await expect(fetchCountryData()).rejects.toThrow("Network error");
	});

	test("should execute SQL queries correctly", async () => {
		await fetchCountryData();

		const result = executeQuery(
			"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe'"
		);
		expect(result).toEqual([
			{ name: "United Kingdom", ISO_A3: "GBR" },
			{ name: "Ireland", ISO_A3: "IRL" },
		]);
	});

	test("should handle query execution errors", async () => {
		global.alasql.mockImplementation(() => {
			throw new Error("SQL syntax error");
		});

		await fetchCountryData();

		expect(() => {
			executeQuery("INVALID SQL");
		}).toThrow("Error executing query: SQL syntax error");
	});

	test("should return available statistics", async () => {
		await fetchCountryData();

		const stats = getAvailableStats();
		expect(stats).toContain("name");
		expect(stats).toContain("population");
		expect(stats).toContain("region");
		expect(stats).toContain("flagDescription");
	});

	test("should return empty array for stats when no data loaded", async () => {
		// Clear data first to ensure empty state
		const { clearCountryData } = await import("../js/data.js");
		clearCountryData();

		const stats = getAvailableStats();
		expect(stats).toEqual([]);
	});
});
