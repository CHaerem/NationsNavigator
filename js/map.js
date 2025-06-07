import { getCountryData } from "./data.js";
import { updateCountryInfo, updateMessage } from "./ui.js";
import { debugLog } from "./debug.js";

let map, geojsonLayer;
let filteredCountries = new Set(); // Use a Set for faster lookups

const COLORS = {
	DEFAULT: "#f8fafc",
	HOVER: "#e0f2fe",
	SELECTED: "#0ea5e9",
	HIGHLIGHTED: "#f59e0b",
	BORDER: "#475569",
	BORDER_SELECTED: "#0284c7",
	BORDER_HIGHLIGHTED: "#d97706",
};

// Array of sophisticated country colors for visual variety
const COUNTRY_COLORS = [
	"#f8fafc", // Light slate
	"#f1f5f9", // Slate 50
	"#e2e8f0", // Slate 200
	"#f0fdf4", // Green 50
	"#ecfdf5", // Green 100
	"#fef3c7", // Amber 100
	"#fef2f2", // Red 50
	"#fff7ed", // Orange 50
	"#f0f9ff", // Sky 50
	"#faf5ff", // Purple 50
	"#fefce8", // Yellow 50
	"#f0fdfa", // Teal 50
];

let isInitialized = false;

export async function initMap() {
        if (isInitialized) {
                debugLog("Map is already initialized");
                return;
        }

	try {
		map = L.map("map", {
			center: [20, 0],
			zoom: 3,
			minZoom: 2,
			maxZoom: 18,
			worldCopyJump: false,
			maxBounds: [[-85, -200], [85, 200]],
			maxBoundsViscosity: 0.0,
			inertia: true,
			inertiaDeceleration: 3000,
			inertiaMaxSpeed: Infinity,
			zoomControl: true,
			attributionControl: true,
		});

		L.tileLayer(
			"https://{s}.basemaps.cartocdn.com/voyager_nolabels/{z}/{x}/{y}{r}.png",
			{
				attribution: "©OpenStreetMap, ©CartoDB",
				noWrap: false,
				maxZoom: 18,
				detectRetina: true,
			}
		).addTo(map);

		const response = await fetch(
			"https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
		);
		const data = await response.json();

		// Map the `id` field to `ISO_A3` in the `properties` object
		data.features.forEach((feature) => {
			if (feature.id) {
				feature.properties.ISO_A3 = feature.id;
			}
		});

                geojsonLayer = L.geoJSON(data, {
                        style: getCountryStyle,
                        onEachFeature: onEachFeature,
                }).addTo(map);

                debugLog("Map and geojsonLayer loaded successfully");
                isInitialized = true;
	} catch (error) {
		console.error("Error loading map data:", error);
		throw error;
	}
}

function getCountryStyle(feature) {
	// Generate a consistent color based on country ISO code
	const iso = feature.properties.ISO_A3 || feature.id;
	let colorIndex = 0;
	if (iso) {
		// Simple hash function to get consistent color for each country
		for (let i = 0; i < iso.length; i++) {
			colorIndex += iso.charCodeAt(i);
		}
		colorIndex = colorIndex % COUNTRY_COLORS.length;
	}
	
	return {
		fillColor: COUNTRY_COLORS[colorIndex],
		weight: 1.2,
		opacity: 1,
		color: COLORS.BORDER,
		fillOpacity: 0.85,
		smooth: true,
	};
}

function onEachFeature(feature, layer) {
	layer.on("click", () => handleCountryClick(feature.properties.ISO_A3, layer));
	
	// Add hover effects
	layer.on("mouseover", () => {
		// Don't hover if country is selected or highlighted
		if (layer.options.fillColor !== COLORS.SELECTED && layer.options.fillColor !== COLORS.HIGHLIGHTED) {
			layer.setStyle({
				fillColor: COLORS.HOVER,
				weight: 2,
				color: "#1e293b",
				fillOpacity: 1,
			});
			layer.bringToFront();
		}
	});
	
	layer.on("mouseout", () => {
		if (layer.options.fillColor === COLORS.HOVER) {
			// Restore original country color
			const iso = layer.feature.properties.ISO_A3;
			let colorIndex = 0;
			if (iso) {
				for (let i = 0; i < iso.length; i++) {
					colorIndex += iso.charCodeAt(i);
				}
				colorIndex = colorIndex % COUNTRY_COLORS.length;
			}
			layer.setStyle({
				fillColor: COUNTRY_COLORS[colorIndex],
				weight: 1.2,
				color: COLORS.BORDER,
				fillOpacity: 0.85,
			});
		}
	});
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
		layer.setStyle({ 
			fillColor: COLORS.SELECTED, 
			fillOpacity: 1,
			weight: 2.5,
			color: COLORS.BORDER_SELECTED,
		});
		layer.bringToFront();
		updateCountryInfo(props);
	}
}

function updateCountryStyle(layer, iso) {
	const isHighlighted = filteredCountries.has(iso);
	let fillColor;
	
	if (isHighlighted) {
		fillColor = COLORS.HIGHLIGHTED;
	} else {
		// Restore original country color based on ISO
		let colorIndex = 0;
		if (iso) {
			for (let i = 0; i < iso.length; i++) {
				colorIndex += iso.charCodeAt(i);
			}
			colorIndex = colorIndex % COUNTRY_COLORS.length;
		}
		fillColor = COUNTRY_COLORS[colorIndex];
	}
	
	const borderColor = isHighlighted ? COLORS.BORDER_HIGHLIGHTED : COLORS.BORDER;
	const weight = isHighlighted ? 2 : 1.2;
	
	layer.setStyle({ 
		fillColor: fillColor, 
		fillOpacity: isHighlighted ? 1 : 0.85,
		weight: weight,
		color: borderColor,
	});
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

        debugLog("Starting highlighting process...");
        let debugCount = 0;

	const countryData = getCountryData();
	let highlightedCount = 0;
	filteredCountries.clear();

        geojsonLayer.eachLayer((layer) => {
                const iso = layer.feature.properties.ISO_A3;
                const props = countryData[iso];
                // Ensure props exist before evaluating the condition for highlighting
                const conditionResult = props && condition(layer);

                if (debugCount < 5) {
                        debugLog(
                                `Layer ${debugCount}: ISO=${iso}, hasProps=${!!props}, conditionResult=${conditionResult}`
                        );
                        debugLog("Available properties:", Object.keys(layer.feature.properties));
                        debugCount++;
                }

                if (conditionResult) {
                        debugLog(`Highlighting country: ${iso}`);
                        layer.setStyle({ 
                                fillColor: COLORS.HIGHLIGHTED, 
                                fillOpacity: 1,
                                weight: 2,
                                color: COLORS.BORDER_HIGHLIGHTED,
                        });
                        filteredCountries.add(iso);
                        highlightedCount++;
                } else if (layer.options.fillColor !== COLORS.SELECTED) {
                        // Restore original country color
                        let colorIndex = 0;
                        if (iso) {
                                for (let i = 0; i < iso.length; i++) {
                                        colorIndex += iso.charCodeAt(i);
                                }
                                colorIndex = colorIndex % COUNTRY_COLORS.length;
                        }
                        layer.setStyle({ 
                                fillColor: COUNTRY_COLORS[colorIndex], 
                                fillOpacity: 0.85,
                                weight: 1.2,
                                color: COLORS.BORDER,
                        });
                }
        });

        debugLog(`Highlighted ${highlightedCount} countries`);
        return highlightedCount;
}

export function highlightCountry(iso) {
        if (!geojsonLayer) {
                console.error("geojsonLayer is not initialized");
                return;
        }
        let foundLayer = null;
        geojsonLayer.eachLayer((layer) => {
                if (layer.feature.properties.ISO_A3 === iso) {
                        foundLayer = layer;
                }
        });

        if (foundLayer) {
                debugLog(`Highlighting country: ${iso}`);
                handleCountryClick(iso, foundLayer); // Call handleCountryClick to select and update info
                foundLayer.bringToFront();
                const bounds = foundLayer.getBounds();
                // Check for both local map and global map (for testing)
                const mapToUse = map || global.map;
		if (mapToUse && typeof mapToUse.fitBounds === "function") {
			// Ensure map and fitBounds are available
			mapToUse.fitBounds(bounds, {
				padding: [50, 50],
				maxZoom: 5,
			});
                } else {
                        console.error("Map or fitBounds function is not available.");
                }
        } else {
                debugLog(`Country layer not found for ISO: ${iso}`);
        }
}

export function initializeMap() {
        if (!isInitialized) {
                initMap()
                        .then(() => debugLog("Map initialization complete"))
                        .catch((error) => console.error("Error initializing map:", error));
        } else {
                debugLog("Map is already initialized");
        }
}

// Test helper function - only for testing
export function _setGeojsonLayerForTesting(layer) {
	geojsonLayer = layer;
}

// Test helper function to reset the module state
export function _resetForTesting() {
	geojsonLayer = null;
	isInitialized = false;
	filteredCountries.clear();
}
