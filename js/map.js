import { countryData } from "./data.js";
import { updateCountryInfo, updateMessage } from "./ui.js";

let map, geojsonLayer, selectedCountryLayer;
let filteredCountries = []; // Store filtered countries

const defaultColor = "#E8E8E8";
const selectedColor = "#3498db";
const highlightedColor = "#9b59b6";

let isInitialized = false;

export async function initMap() {
	if (isInitialized) {
		console.log("Map is already initialized");
		return;
	}

	try {
		map = L.map("map", {
			center: [20, 0],
			zoom: 3,
			minZoom: 2,
			maxZoom: 18,
			worldCopyJump: true,
			maxBoundsViscosity: 1.0,
		});

		L.tileLayer(
			"https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
			{
				attribution: "©OpenStreetMap, ©CartoDB",
				noWrap: false,
			}
		).addTo(map);

		const response = await fetch(
			"https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
		);
		const data = await response.json();

		function onEachFeature(feature, layer) {
			layer.on("click", () => {
				const props = countryData[feature.properties.ISO_A3];
				if (props) {
					if (selectedCountryLayer === layer) {
						// Deselect the country if it's clicked again
						if (filteredCountries.includes(feature.properties.ISO_A3)) {
							layer.setStyle({ fillColor: highlightedColor, fillOpacity: 0.7 });
						} else {
							layer.setStyle({ fillColor: defaultColor, fillOpacity: 0.7 });
						}
						selectedCountryLayer = null;
						updateCountryInfo(null);
					} else {
						// Select the new country
						if (selectedCountryLayer) {
							if (
								filteredCountries.includes(
									selectedCountryLayer.feature.properties.ISO_A3
								)
							) {
								selectedCountryLayer.setStyle({
									fillColor: highlightedColor,
									fillOpacity: 0.7,
								});
							} else {
								selectedCountryLayer.setStyle({
									fillColor: defaultColor,
									fillOpacity: 0.7,
								});
							}
						}
						layer.setStyle({ fillColor: selectedColor, fillOpacity: 0.7 });
						selectedCountryLayer = layer;
						updateCountryInfo(props);
					}
				}
			});
		}

		geojsonLayer = L.geoJSON(data, {
			style: (feature) => ({
				fillColor: defaultColor,
				weight: 1,
				opacity: 1,
				color: "white",
				fillOpacity: 0.7,
			}),
			onEachFeature: onEachFeature,
		}).addTo(map);

		console.log("Map and geojsonLayer loaded successfully");
		isInitialized = true;
	} catch (error) {
		console.error("Error loading map data:", error);
		throw error;
	}
}

export function resetMap() {
	if (!geojsonLayer) {
		console.error("geojsonLayer is not initialized");
		return;
	}
	geojsonLayer.eachLayer((layer) => {
		layer.setStyle({ fillColor: defaultColor, fillOpacity: 0.7 });
	});
	closeDetails();
	updateMessage("");
	filteredCountries = []; // Reset filtered countries
}

export function closeDetails() {
	if (selectedCountryLayer) {
		if (
			filteredCountries.includes(selectedCountryLayer.feature.properties.ISO_A3)
		) {
			selectedCountryLayer.setStyle({
				fillColor: highlightedColor,
				fillOpacity: 0.7,
			});
		} else {
			selectedCountryLayer.setStyle({
				fillColor: defaultColor,
				fillOpacity: 0.7,
			});
		}
	}
	updateCountryInfo(null);
	selectedCountryLayer = null;
}

export function highlightCountries(condition, filterCriteria) {
	if (!geojsonLayer) {
		console.error("geojsonLayer is not initialized");
		return;
	}
	let highlightedCount = 0;
	filteredCountries = []; // Reset filtered countries

	geojsonLayer.eachLayer(function (layer) {
		const props = countryData[layer.feature.properties.ISO_A3];
		if (props && condition(layer)) {
			layer.setStyle({ fillColor: highlightedColor, fillOpacity: 0.7 });
			highlightedCount++;
			filteredCountries.push(layer.feature.properties.ISO_A3); // Add to filtered countries
		} else if (layer !== selectedCountryLayer) {
			layer.setStyle({ fillColor: defaultColor, fillOpacity: 0.7 });
		}
	});

	// If the selected country is not in the filtered list, deselect it
	if (
		selectedCountryLayer &&
		!filteredCountries.includes(selectedCountryLayer.feature.properties.ISO_A3)
	) {
		selectedCountryLayer.setStyle({
			fillColor: defaultColor,
			fillOpacity: 0.7,
		});
		selectedCountryLayer = null;
		updateCountryInfo(null);
	}

	updateMessage(
		(prevMessage) =>
			prevMessage +
			(highlightedCount === 0
				? "\n\nNo countries highlighted."
				: `\n\n${highlightedCount} countries highlighted (${filterCriteria}).`)
	);
}

// Initialize the map
export function initializeMap() {
	if (!isInitialized) {
		initMap()
			.then(() => {
				console.log("Map initialization complete");
			})
			.catch((error) => {
				console.error("Error initializing map:", error);
			});
	} else {
		console.log("Map is already initialized");
	}
}
