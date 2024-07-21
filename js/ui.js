import { processQuery, resetMap, closeDetails } from "./main.js";

export function updateCountryInfo(props) {
	const countryInfoElement = document.getElementById("country-info");
	const closeBtnElement = document.getElementById("close-btn");

	if (props) {
		countryInfoElement.innerHTML = `
      <img src="${props.flagUrl}" alt="${props.name} flag" class="flag">
      <h3>${props.name}</h3>
      <p>Capital: ${props.capital}<br>
      Population: ${props.population.toLocaleString()}<br>
      Area: ${props.area.toLocaleString()} km²<br>
      Region: ${props.region}<br>
      Subregion: ${props.subregion || "N/A"}<br>
      Languages: ${props.languages.join(", ")}<br>
      Flag Colors: ${props.flagColors.join(", ") || "Not available"}</p>
    `;
		closeBtnElement.style.display = "block";
	} else {
		countryInfoElement.innerHTML = "Click on a country to see its information.";
		closeBtnElement.style.display = "none";
	}
}

export function updateMessage(message) {
	if (typeof message === "function") {
		const currentMessage = document.getElementById("message").textContent;
		document.getElementById("message").textContent = message(currentMessage);
	} else {
		document.getElementById("message").textContent = message;
	}
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
	document.getElementById("close-btn").addEventListener("click", closeDetails);
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
