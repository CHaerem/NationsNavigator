import { processQuery, resetMap } from "./main.js";
import { highlightCountry } from "./map.js";

export function updateCountryInfo(props) {
	const countryInfoElement = document.getElementById("country-info");
	const closeBtnElement = document.getElementById("close-btn");

	if (props) {
		const currencies = props.currencies.split(",").join(", ");
		const languages = props.languages.split(",").join(", ");
		const continents = props.continents.split(",").join(", ");
		const borders = props.borders.split(",").join(", ");

		countryInfoElement.innerHTML = `
      <img src="${props.flagUrl}" alt="${props.name} flag" class="flag">
      <h3>${props.name}</h3>
      <p><strong>Official Name:</strong> ${props.officialName}</p>
      <p><strong>Capital:</strong> ${props.capital}</p>
      <p><strong>Population:</strong> ${props.population.toLocaleString()}</p>
      <p><strong>Area:</strong> ${
				props.area ? props.area.toLocaleString() + " km²" : "N/A"
			}</p>
      <p><strong>Region:</strong> ${props.region}</p>
      <p><strong>Subregion:</strong> ${props.subregion || "N/A"}</p>
      <p><strong>Languages:</strong> ${languages || "N/A"}</p>
      <p><strong>Currencies:</strong> ${currencies || "N/A"}</p>
      <p><strong>Continents:</strong> ${continents || "N/A"}</p>
      <p><strong>Borders:</strong> ${borders || "None"}</p>
      <p><strong>Driving Side:</strong> ${props.drivingSide}</p>
      <p><strong>UN Member:</strong> ${props.unMember ? "Yes" : "No"}</p>
      <p><strong>Independence Status:</strong> ${props.independenceStatus}</p>
      <h4>Flag Information</h4>
      <p><strong>Description:</strong> ${
				props.flagDescription || "No description available"
			}</p>
      <p><strong>Flag Emoji:</strong> ${props.flagEmoji || "N/A"}</p>
    `;
		closeBtnElement.style.display = "block";
	} else {
		countryInfoElement.innerHTML = "Click on a country to see its information.";
		closeBtnElement.style.display = "none";
	}
}

export function updateMessage(message) {
	const messageElement = document.getElementById("message");
	messageElement.innerHTML = message;

	// Attach event listeners to any new toggle-countries links
	messageElement.querySelectorAll(".toggle-countries").forEach((link) => {
		link.addEventListener("click", toggleCountriesList);
	});

	// Attach event listeners to any new country links
	messageElement.querySelectorAll(".country-link").forEach((link) => {
		link.addEventListener("click", (event) => {
			event.preventDefault();
			const iso = event.target.getAttribute("data-iso");
			highlightCountry(iso);
		});
	});
}

export function updateLLMStatus(status) {
	document.getElementById("llm-status").textContent = status;
	document.getElementById("search-btn").disabled = status !== "WebLLM ready";
}

export function setupEventListeners() {
	document.getElementById("search-btn").addEventListener("click", () => {
		if (!document.getElementById("search-btn").disabled) {
			processQuery();
		} else {
			updateMessage("WebLLM is still initializing. Please wait.");
		}
	});
	document.getElementById("reset-btn").addEventListener("click", resetMap);
	document.getElementById("close-btn").addEventListener("click", () => {
		updateCountryInfo(null);
	});
	document
		.getElementById("query-input")
		.addEventListener("keyup", function (event) {
			if (
				event.key === "Enter" &&
				!document.getElementById("search-btn").disabled
			) {
				processQuery();
			}
		});
}

export function toggleCountriesList(event) {
	event.preventDefault();
	const fullList = event.target.nextElementSibling;
	const linkText = event.target;
	if (fullList.style.display === "none") {
		fullList.style.display = "inline";
		linkText.textContent = "(Hide)";
	} else {
		fullList.style.display = "none";
		linkText.textContent = "(Show all)";
	}
}
