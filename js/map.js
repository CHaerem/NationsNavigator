import { countryData } from "./data.js";
import { updateCountryInfo, updateMessage } from "./ui.js";

let map, geojsonLayer, selectedCountryLayer;

export async function initMap() {
	try {
		map = L.map("map").setView([0, 0], 2);
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution: "© OpenStreetMap contributors",
		}).addTo(map);

		const response = await fetch(
			"https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"
		);
		const data = await response.json();
		geojsonLayer = L.geoJSON(data, {
			style: () => ({
				fillColor: "#ccc",
				weight: 1,
				opacity: 1,
				color: "white",
				fillOpacity: 0.7,
			}),
			onEachFeature: (feature, layer) => {
				layer.on("click", () => {
					const props = countryData[feature.properties.ISO_A3];
					if (props) {
						if (selectedCountryLayer) {
							selectedCountryLayer.setStyle({
								fillColor: "#ccc",
								fillOpacity: 0.7,
							});
						}
						layer.setStyle({ fillColor: "#9b59b6", fillOpacity: 0.7 });
						selectedCountryLayer = layer;
						updateCountryInfo(props);
					}
				});
			},
		}).addTo(map);
		console.log("Map loaded successfully");
	} catch (error) {
		console.error("Error loading map data:", error);
		throw error;
	}
}

export function resetMap() {
	geojsonLayer.eachLayer((layer) =>
		layer.setStyle({ fillColor: "#ccc", fillOpacity: 0.7 })
	);
	closeDetails();
	updateMessage("");
}

export function closeDetails() {
	if (selectedCountryLayer) {
		selectedCountryLayer.setStyle({ fillColor: "#ccc", fillOpacity: 0.7 });
	}
	updateCountryInfo(null);
	selectedCountryLayer = null;
}

export function highlightCountries(condition, filterCriteria) {
	let highlightedCount = 0;
	geojsonLayer.eachLayer(function (layer) {
		const props = countryData[layer.feature.properties.ISO_A3];
		if (props && condition(layer)) {
			layer.setStyle({ fillColor: "#9b59b6", fillOpacity: 0.7 });
			highlightedCount++;
			console.log(`Highlighted: ${props.name}`);
		} else if (layer !== selectedCountryLayer) {
			layer.setStyle({ fillColor: "#ccc", fillOpacity: 0.7 });
		}
	});

	updateMessage(
		(prevMessage) =>
			prevMessage +
			(highlightedCount === 0
				? "\n\nNo countries highlighted."
				: `\n\n${highlightedCount} countries highlighted (${filterCriteria}).`)
	);
}
