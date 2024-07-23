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
				languages: country.languages ? Object.values(country.languages) : [],
				area: country.area,
				capital: country.capital ? country.capital[0] : "N/A",
				region: country.region || "",
				subregion: country.subregion || "",
				flagUrl: country.flags.png,
				flagColors: extractColors(country.flags.alt),
				ISO_A3: country.cca3,
			};
		});
		console.log("Country data loaded successfully");
	} catch (error) {
		console.error("Error fetching country data:", error);
		throw error;
	}
}

export function getCountryData(iso_a3) {
	return countryData[iso_a3] || null;
}

export function getAvailableStats() {
	const sampleCountry = Object.values(countryData)[0];
	return sampleCountry ? Object.keys(sampleCountry) : [];
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

export function getRelevantData(stats) {
	if (stats.includes("all")) {
		return Object.values(countryData);
	}

	return Object.values(countryData).map((country) => {
		const relevantData = { name: country.name, ISO_A3: country.ISO_A3 };
		stats.forEach((stat) => {
			if (country.hasOwnProperty(stat)) {
				relevantData[stat] = country[stat];
			}
		});
		return relevantData;
	});
}
