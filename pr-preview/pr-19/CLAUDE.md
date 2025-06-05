# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Testing
- `npm test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Development Server
- `npm run serve` - Start Python HTTP server on port 8000
- `python3 -m http.server 8000` - Alternative server command

### Country Data Updates
```bash
cd scripts
python updateCountryData.py
```

## Architecture Overview

### Module Structure
The application follows an ES6 module architecture with clear separation of concerns:

- **main.js** - Application entry point and initialization orchestration
- **map.js** - Leaflet map management, country highlighting, and geospatial interactions
- **llm.js** - WebLLM integration for AI-powered query processing and SQL generation
- **data.js** - Country data management and AlaSQL database operations
- **ui.js** - DOM manipulation and event handling
- **debug.js** - Debug logging utilities

### Data Flow
1. **Initialization**: main.js orchestrates loading country data, initializing map, and setting up WebLLM
2. **Query Processing**: User queries → llm.js generates SQL → data.js executes against AlaSQL → map.js highlights results
3. **Map Interactions**: Click events on countries → data lookup → ui.js displays country information

### Key Technologies
- **Leaflet.js** for interactive mapping with GeoJSON country boundaries
- **WebLLM** for browser-based AI query processing (multiple model support)
- **AlaSQL** for in-browser SQL queries against country dataset
- **Jest** with jsdom for comprehensive testing

### Testing Architecture
- Uses Jest with jsdom environment for DOM testing
- Extensive mocking of external dependencies (WebLLM, Leaflet, fetch)
- Test setup in `tests/setup.js` provides global mocks and utilities
- Module mocking via `moduleNameMapper` for external CDN dependencies

### Country Data Schema
Countries stored as objects with properties: name, ISO_A3, capital, population, area, region, subregion, languages, currencies, continents, borders, flagDescription, flagUrl, flagEmoji, etc.

### Map Highlighting System
- Three color states: DEFAULT (#E8E8E8), SELECTED (#3498db), HIGHLIGHTED (#9b59b6)
- Countries highlighted based on SQL query results
- Click interactions for country selection and info display

### LLM Model Configuration
Supports multiple WebLLM models with configurable context windows:
- Llama-3.1-8B-Instruct-q4f16_1-MLC
- Llama-3.2-3B-Instruct-q4f16_1-MLC
- Llama-3.2-1B-Instruct-q4f16_1-MLC
- Qwen2.5-1.5B-Instruct-q4f16_1-MLC
- Phi-3.5-mini-instruct-q4f16_1-MLC
- Mistral-7B-Instruct-v0.3-q4f16_1-MLC
