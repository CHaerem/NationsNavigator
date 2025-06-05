import { getCountryData } from "./data.js";
import { updateCountryInfo, updateMessage } from "./ui.js";

let map, geojsonLayer;
let filteredCountries = new Set(); // Use a Set for faster lookups

const COLORS = {
	DEFAULT: "#E8E8E8",
	SELECTED: "#3498db",
	HIGHLIGHTED: "#9b59b6",
};

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

		geojsonLayer = L.geoJSON(data, {
			style: getCountryStyle,
			onEachFeature: onEachFeature,
		}).addTo(map);

		console.log("Map and geojsonLayer loaded successfully");
		isInitialized = true;
	} catch (error) {
		console.error("Error loading map data:", error);
		throw error;
	}
}

function getCountryStyle(feature) {
	return {
		fillColor: COLORS.DEFAULT,
		weight: 1,
		opacity: 1,
		color: "white",
		fillOpacity: 0.7,
	};
}

function onEachFeature(feature, layer) {
	layer.on("click", () => handleCountryClick(feature.properties.ISO_A3, layer));
}

function handleCountryClick(iso, layer) {
	const countryData = getCountryData();
	const props = countryData[iso];
	if (!props) return;

	if (layer.options.fillColor === COLORS.SELECTED) {
		// Deselect the country if it's clicked again
		updateCountryStyle(layer, iso);
		updateCountryInfo(null);
	} else {
		// Select the new country
		geojsonLayer.eachLayer((l) => {
			if (l.options.fillColor === COLORS.SELECTED) {
				updateCountryStyle(l, l.feature.properties.ISO_A3);
			}
		});
		layer.setStyle({ fillColor: COLORS.SELECTED, fillOpacity: 0.7 });
		updateCountryInfo(props);
	}
}

function updateCountryStyle(layer, iso) {
	const color = filteredCountries.has(iso)
		? COLORS.HIGHLIGHTED
		: COLORS.DEFAULT;
	layer.setStyle({ fillColor: color, fillOpacity: 0.7 });
}

export function resetMap() {
	if (!geojsonLayer) {
		console.error("geojsonLayer is not initialized");
		return;
	}
	geojsonLayer.eachLayer((layer) =>
		updateCountryStyle(layer, layer.feature.properties.ISO_A3)
	);
	updateCountryInfo(null);
	updateMessage("");
	filteredCountries.clear();
}

export function highlightCountries(condition) {
	if (!geojsonLayer) {
		console.error("geojsonLayer is not initialized");
		return 0;
	}

	const countryData = getCountryData();
	let highlightedCount = 0;
	filteredCountries.clear();

	geojsonLayer.eachLayer((layer) => {
		const iso = layer.feature.properties.ISO_A3;
		const props = countryData[iso];
		if (props && condition(layer)) {
			layer.setStyle({ fillColor: COLORS.HIGHLIGHTED, fillOpacity: 0.7 });
			filteredCountries.add(iso);
			highlightedCount++;
		} else if (layer.options.fillColor !== COLORS.SELECTED) {
			layer.setStyle({ fillColor: COLORS.DEFAULT, fillOpacity: 0.7 });
		}
	});

	return highlightedCount;
}

export function highlightCountry(iso) {
	if (!geojsonLayer) {
		console.error("geojsonLayer is not initialized");
		return;
	}

	geojsonLayer.eachLayer((layer) => {
		if (layer.feature.properties.ISO_A3 === iso) {
			handleCountryClick(iso, layer);
			layer.bringToFront();

			const bounds = layer.getBounds();
			map.fitBounds(bounds, {
				padding: [50, 50],
				maxZoom: 5,
			});
		}
	});
}

export function initializeMap() {
	if (!isInitialized) {
		initMap()
			.then(() => console.log("Map initialization complete"))
			.catch((error) => console.error("Error initializing map:", error));
	} else {
		console.log("Map is already initialized");
	}
}
