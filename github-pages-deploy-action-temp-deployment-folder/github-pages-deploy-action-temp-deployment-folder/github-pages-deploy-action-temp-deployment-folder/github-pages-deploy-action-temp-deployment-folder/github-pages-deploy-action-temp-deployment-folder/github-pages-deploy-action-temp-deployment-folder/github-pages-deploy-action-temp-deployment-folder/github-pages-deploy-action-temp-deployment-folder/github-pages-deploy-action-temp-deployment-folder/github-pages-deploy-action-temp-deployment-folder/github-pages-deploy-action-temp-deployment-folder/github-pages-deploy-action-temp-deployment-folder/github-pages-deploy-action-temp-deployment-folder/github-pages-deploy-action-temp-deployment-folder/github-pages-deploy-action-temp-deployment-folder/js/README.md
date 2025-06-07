# JavaScript Modules

This directory contains the core logic for NationsNavigator.

- `main.js` bootstraps the application, loading data and initializing the map and WebLLM.
- `map.js` manages the Leaflet map, country layers and highlighting utilities.
- `data.js` loads `../data/countryData.json` and provides helper functions for querying it with AlaSQL.
- `llm.js` interfaces with WebLLM to generate SQL from user questions and process results.
- `ui.js` updates the DOM and handles user interactions.
- `debug.js` offers lightweight logging utilities used across the codebase.
