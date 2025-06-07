let countryData = {};

export function getCountryData() {
	return countryData;
}

export async function fetchCountryData() {
	if (Object.keys(countryData).length > 0) {
		console.log("Country data already loaded");
		return;
	}

	try {
		const response = await fetch("data/countryData.json");
		const data = await response.json();
		data.countries.forEach((country) => {
			countryData[country.ISO_A3] = country;
		});
		console.log("Country data loaded successfully");
		console.log("Data version:", data.metadata.version);
		console.log("Last updated:", data.metadata.lastUpdated);
		initializeAlaSQLTable();
	} catch (error) {
		console.error("Error fetching country data:", error);
		throw error;
	}
}

function initializeAlaSQLTable() {
	const countryArray = Object.values(countryData);

	alasql("CREATE TABLE IF NOT EXISTS countries");
	alasql.tables.countries.data = countryArray;

	console.log("AlaSQL table 'countries' initialized with data");
}

export function getAvailableStats() {
	const sampleCountry = Object.values(countryData)[0];
	return sampleCountry ? Object.keys(sampleCountry) : [];
}

export function getExampleCountry() {
	return Object.values(countryData)[0];
}

export function executeQuery(sqlQuery) {
	console.log("Executing query:", sqlQuery);

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
