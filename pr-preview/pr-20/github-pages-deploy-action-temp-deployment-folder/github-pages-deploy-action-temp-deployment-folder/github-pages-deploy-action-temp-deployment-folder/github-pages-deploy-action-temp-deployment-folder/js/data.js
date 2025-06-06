import { debugLog } from "./debug.js";

let countryData = {};

export function clearCountryData() {
	countryData = {};
}

export function getCountryData() {
	return countryData;
}

export async function fetchCountryData() {
        if (Object.keys(countryData).length > 0) {
                debugLog("Country data already loaded");
                return;
        }

	try {
		const response = await fetch("data/countryData.json");
		
		if (!response.ok) {
			const status = response.status || 'Unknown';
			const statusText = response.statusText || 'Unknown Error';
			throw new Error(`HTTP Error: ${status} - ${statusText}`);
		}
		
		const data = await response.json();
		
		if (!data.countries || !Array.isArray(data.countries)) {
			throw new Error("Invalid data format: countries array not found");
		}
		
		if (data.countries.length === 0) {
			throw new Error("No country data available");
		}
		
                data.countries.forEach((country) => {
                        countryData[country.ISO_A3] = country;
                });
                debugLog("Country data loaded successfully");
                debugLog("Data version:", data.metadata.version);
                debugLog("Last updated:", data.metadata.lastUpdated);
                initializeAlaSQLTable();
	} catch (error) {
		console.error("Error fetching country data:", error);
		
		// Provide more specific error messages
		if (error instanceof TypeError && error.message.includes('fetch')) {
			throw new Error("Network error: Unable to load country data. Please check your internet connection.");
		} else if (error.name === 'SyntaxError') {
			throw new Error("Data format error: Country data file is corrupted or invalid.");
		} else {
			throw new Error(`Failed to load country data: ${error.message}`);
		}
	}
}

function initializeAlaSQLTable() {
        const countryArray = Object.values(countryData);

        alasql("CREATE TABLE IF NOT EXISTS countries");
        alasql.tables.countries.data = countryArray;
        debugLog("AlaSQL table 'countries' initialized with data");
}

export function getAvailableStats() {
	if (Object.keys(countryData).length === 0) {
		return [];
	}
	const sampleCountry = Object.values(countryData)[0];
	return sampleCountry ? Object.keys(sampleCountry) : [];
}

export function getExampleCountry() {
	return Object.values(countryData)[0];
}

export function executeQuery(sqlQuery) {
        debugLog("Executing query:", sqlQuery);

        try {
                const result = alasql(sqlQuery);
                return result;
	} catch (error) {
		console.error("Error executing query:", error);
		const customError = new Error(`Error executing query: ${error.message}`);
		customError.sqlQuery = sqlQuery;
		throw customError;
	}
}
