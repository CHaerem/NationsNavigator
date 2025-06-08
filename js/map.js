import { getCountryData } from "./data.js";
import { uiService } from "./services/UIService.js";
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
let worldData = null; // Store the original world data
let currentCopies = new Set(); // Track which copies currently exist
let isAddingCopies = false; // Prevent concurrent copy additions

// Helper function to shift coordinates for infinite scrolling
function shiftCoordinates(coordinates, longitudeOffset) {
	if (typeof coordinates[0] === "number") {
		// Point coordinates [lng, lat]
		return [coordinates[0] + longitudeOffset, coordinates[1]];
	} else if (Array.isArray(coordinates[0])) {
		// Array of coordinates (LineString, Polygon rings, etc.)
		return coordinates.map((coord) => shiftCoordinates(coord, longitudeOffset));
	} else {
		// Nested arrays (MultiPolygon, etc.)
		return coordinates.map((coord) => shiftCoordinates(coord, longitudeOffset));
	}
}

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
			maxBounds: [
				[-90, -Infinity],
				[90, Infinity],
			],
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

		// Store original data
		worldData = data;

		// Map the `id` field to `ISO_A3` in the `properties` object
		data.features.forEach((feature) => {
			if (feature.id) {
				feature.properties.ISO_A3 = feature.id;
			}
		});

		// Create initial world copies for seamless infinite scrolling
		const initialCopies = 3; // Start with fewer copies: -1, 0, 1
		const combinedFeatures = [];

		for (
			let i = -Math.floor(initialCopies / 2);
			i <= Math.floor(initialCopies / 2);
			i++
		) {
			const worldCopy = JSON.parse(JSON.stringify(data)); // Deep clone

			// Shift all coordinates by 360 degrees * offset
			worldCopy.features.forEach((feature) => {
				if (feature.geometry?.coordinates) {
					feature.geometry.coordinates = shiftCoordinates(
						feature.geometry.coordinates,
						i * 360
					);
					// Also add a copy identifier to distinguish copies
					feature.properties._copy = i;
					feature.properties._originalISO = feature.properties.ISO_A3;
				}
			});

			combinedFeatures.push(...worldCopy.features);
			currentCopies.add(i);
		}

		// Create the initial geojson layer
		const combinedData = {
			type: "FeatureCollection",
			features: combinedFeatures,
		};

		geojsonLayer = L.geoJSON(combinedData, {
			style: getCountryStyle,
			onEachFeature: onEachFeature,
		}).addTo(map);

		// Add event listener for dynamic copy management
		map.on("moveend", checkAndAddCopies);
		map.on("zoomend", checkAndAddCopies);

		debugLog("Map and geojsonLayer loaded successfully");
		isInitialized = true;
	} catch (error) {
		console.error("Error loading map data:", error);
		throw error;
	}
}

function getCountryStyle(feature) {
	// Generate a consistent color based on original country ISO code
	const iso =
		feature.properties._originalISO || feature.properties.ISO_A3 || feature.id;
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
	const originalISO =
		feature.properties._originalISO || feature.properties.ISO_A3;
	layer.on("click", () => handleCountryClick(originalISO, layer));

	// Add hover effects
	layer.on("mouseover", () => {
		// Don't hover if country is selected or highlighted
		if (
			layer.options.fillColor !== COLORS.SELECTED &&
			layer.options.fillColor !== COLORS.HIGHLIGHTED
		) {
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
			const iso = originalISO;
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
	// Use the original ISO code for data lookup (remove copy suffix if present)
	const originalISO = layer.feature.properties._originalISO || iso;
	const countryData = getCountryData();
	const props = countryData[originalISO];
	if (!props) return;

	if (layer.options.fillColor === COLORS.SELECTED) {
		// Deselect all copies of this country
		deselectAllCopiesOfCountry(originalISO);
		uiService.updateCountryInfo(null);
	} else {
		// Deselect any currently selected countries (including all their copies)
		geojsonLayer.eachLayer((l) => {
			if (l.options.fillColor === COLORS.SELECTED) {
				const layerOriginalISO =
					l.feature.properties._originalISO || l.feature.properties.ISO_A3;
				deselectAllCopiesOfCountry(layerOriginalISO);
			}
		});
		// Select all copies of the new country
		selectAllCopiesOfCountry(originalISO);
		uiService.updateCountryInfo(props);
	}
}

// Helper function to select all copies of a country
function selectAllCopiesOfCountry(originalISO) {
	geojsonLayer.eachLayer((layer) => {
		const layerOriginalISO =
			layer.feature.properties._originalISO || layer.feature.properties.ISO_A3;
		if (layerOriginalISO === originalISO) {
			layer.setStyle({
				fillColor: COLORS.SELECTED,
				fillOpacity: 1,
				weight: 2.5,
				color: COLORS.BORDER_SELECTED,
			});
			layer.bringToFront();
		}
	});
}

// Helper function to deselect all copies of a country
function deselectAllCopiesOfCountry(originalISO) {
	geojsonLayer.eachLayer((layer) => {
		const layerOriginalISO =
			layer.feature.properties._originalISO || layer.feature.properties.ISO_A3;
		if (layerOriginalISO === originalISO) {
			updateCountryStyle(layer, originalISO);
		}
	});
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
	
	// Clear filtered countries first
	filteredCountries.clear();
	
	// Reset all countries to their original style
	geojsonLayer.eachLayer((layer) => {
		const originalISO =
			layer.feature.properties._originalISO || layer.feature.properties.ISO_A3;
		
		// Restore original country color based on ISO
		let colorIndex = 0;
		if (originalISO) {
			for (let i = 0; i < originalISO.length; i++) {
				colorIndex += originalISO.charCodeAt(i);
			}
			colorIndex = colorIndex % COUNTRY_COLORS.length;
		}
		
		layer.setStyle({
			fillColor: COUNTRY_COLORS[colorIndex],
			fillOpacity: 0.85,
			weight: 1.2,
			color: COLORS.BORDER,
		});
	});
	
	uiService.updateCountryInfo(null);
	uiService.updateMessage("");
	
	// Clear search input
	const queryInput = document.getElementById("query-input");
	if (queryInput) {
		queryInput.value = "";
	}
	
	// Recenter map to world view with better zoom level
	if (map) {
		map.setView([20, 0], 3);
	}
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
	const countriesToHighlight = new Set();
	filteredCountries.clear();

	// First pass: determine which countries should be highlighted (only check original copies)
	geojsonLayer.eachLayer((layer) => {
		const iso =
			layer.feature.properties._originalISO || layer.feature.properties.ISO_A3;
		const copyNumber = layer.feature.properties._copy || 0;

		// Only evaluate condition on the original copy (copy 0) to avoid duplicates
		if (copyNumber === 0) {
			const props = countryData[iso];
			const conditionResult = props && condition(layer);

			if (debugCount < 5) {
				debugLog(
					`Layer ${debugCount}: ISO=${iso}, hasProps=${!!props}, conditionResult=${conditionResult}`
				);
				debugLog(
					"Available properties:",
					Object.keys(layer.feature.properties)
				);
				debugCount++;
			}

			if (conditionResult) {
				debugLog(`Country meets condition: ${iso}`);
				countriesToHighlight.add(iso);
				filteredCountries.add(iso);
				highlightedCount++;
			}
		}
	});

	// Second pass: apply highlighting to all copies of the selected countries
	geojsonLayer.eachLayer((layer) => {
		const iso =
			layer.feature.properties._originalISO || layer.feature.properties.ISO_A3;

		if (countriesToHighlight.has(iso)) {
			layer.setStyle({
				fillColor: COLORS.HIGHLIGHTED,
				fillOpacity: 1,
				weight: 2,
				color: COLORS.BORDER_HIGHLIGHTED,
			});
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
		const originalISO =
			layer.feature.properties._originalISO || layer.feature.properties.ISO_A3;
		if (originalISO === iso && !foundLayer) {
			foundLayer = layer; // Get the first copy we find
		}
	});

	if (foundLayer) {
		debugLog(`Highlighting country: ${iso}`);
		handleCountryClick(iso, foundLayer); // This will now select all copies

		// Bring all copies to front and fit bounds to the found layer
		geojsonLayer.eachLayer((layer) => {
			const originalISO =
				layer.feature.properties._originalISO ||
				layer.feature.properties.ISO_A3;
			if (originalISO === iso) {
				layer.bringToFront();
			}
		});

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

export function getFilteredCountries() {
	return filteredCountries;
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
	currentCopies.clear();
	worldData = null;
	isAddingCopies = false;
}

// Function to check if we need to add more world copies
function checkAndAddCopies() {
	if (isAddingCopies || !worldData || !geojsonLayer) return;

	const centerLng = map.getCenter().lng;

	// Calculate which copy we're currently closest to
	const currentCopyNumber = Math.round(centerLng / 360);

	// Check if we need copies to the left or right
	const neededCopies = [];
	const buffer = 2; // How many copies ahead to maintain

	for (
		let i = currentCopyNumber - buffer;
		i <= currentCopyNumber + buffer;
		i++
	) {
		if (!currentCopies.has(i)) {
			neededCopies.push(i);
		}
	}

	if (neededCopies.length > 0) {
		addWorldCopies(neededCopies);
	}

	// Optional: Remove distant copies to maintain performance (if we have too many)
	if (currentCopies.size > 7) {
		removeDistantCopies(currentCopyNumber);
	}
}

// Function to add specific world copies
function addWorldCopies(copyNumbers) {
	if (isAddingCopies || !worldData) return;

	isAddingCopies = true;

	try {
		const newFeatures = [];

		copyNumbers.forEach((copyNumber) => {
			if (currentCopies.has(copyNumber)) return; // Skip if already exists

			const worldCopy = JSON.parse(JSON.stringify(worldData));

			worldCopy.features.forEach((feature) => {
				if (feature.geometry?.coordinates) {
					feature.geometry.coordinates = shiftCoordinates(
						feature.geometry.coordinates,
						copyNumber * 360
					);
					feature.properties._copy = copyNumber;
					feature.properties._originalISO = feature.properties.ISO_A3;
				}
			});

			newFeatures.push(...worldCopy.features);
			currentCopies.add(copyNumber);
		});

		if (newFeatures.length > 0) {
			// Add the new features to the existing layer
			const newLayer = L.geoJSON(
				{
					type: "FeatureCollection",
					features: newFeatures,
				},
				{
					style: getCountryStyle,
					onEachFeature: onEachFeature,
				}
			);

			// Add all sublayers to the main geojsonLayer
			newLayer.eachLayer((layer) => {
				geojsonLayer.addLayer(layer);
			});

			// Apply current highlighting state to newly added copies
			if (filteredCountries.size > 0) {
				newLayer.eachLayer((layer) => {
					const originalISO = layer.feature.properties._originalISO || layer.feature.properties.ISO_A3;
					if (filteredCountries.has(originalISO)) {
						layer.setStyle({
							fillColor: COLORS.HIGHLIGHTED,
							fillOpacity: 1,
							weight: 2,
							color: COLORS.BORDER_HIGHLIGHTED,
						});
					}
				});
			}

			debugLog(
				`Added ${copyNumbers.length} world copies: ${copyNumbers.join(", ")}`
			);
		}
	} catch (error) {
		console.error("Error adding world copies:", error);
	} finally {
		isAddingCopies = false;
	}
}

// Function to remove distant copies to maintain performance
function removeDistantCopies(currentCopyNumber) {
	const maxDistance = 3;
	const copiesToRemove = [];

	currentCopies.forEach((copyNumber) => {
		if (Math.abs(copyNumber - currentCopyNumber) > maxDistance) {
			copiesToRemove.push(copyNumber);
		}
	});

	copiesToRemove.forEach((copyNumber) => {
		// Remove layers with this copy number
		geojsonLayer.eachLayer((layer) => {
			if (layer.feature.properties._copy === copyNumber) {
				geojsonLayer.removeLayer(layer);
			}
		});
		currentCopies.delete(copyNumber);
	});

	if (copiesToRemove.length > 0) {
		debugLog(`Removed distant copies: ${copiesToRemove.join(", ")}`);
	}
}
