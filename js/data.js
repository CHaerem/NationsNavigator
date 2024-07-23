export let countryData = {};

export async function fetchCountryData() {
	if (Object.keys(countryData).length > 0) {
		console.log("Country data already loaded");
		return;
	}

	try {
		const response = await fetch("https://restcountries.com/v3.1/all");
		const data = await response.json();
		data.forEach((country) => {
			countryData[country.cca3] = {
				name: country.name.common,
				population: country.population,
				languages: country.languages
					? Object.values(country.languages).join(",")
					: "",
				area: country.area,
				capital: country.capital ? country.capital[0] : "N/A",
				region: country.region || "",
				subregion: country.subregion || "",
				flagUrl: country.flags.png,
				flagColors: extractColors(country.flags.alt).join(","),
				ISO_A3: country.cca3,
			};
		});
		console.log("Country data loaded successfully");
		initializeAlaSQLTable();
	} catch (error) {
		console.error("Error fetching country data:", error);
		throw error;
	}
}

function extractColors(altText) {
	const commonColors = [
		"red",
		"blue",
		"green",
		"yellow",
		"white",
		"black",
		"orange",
		"purple",
	];
	return (
		commonColors.filter((color) => altText?.toLowerCase().includes(color)) || []
	);
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
