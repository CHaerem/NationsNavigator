# JavaScript Modules

This directory contains the core ES6+ modules that implement NationsNavigator's functionality using a modular architecture pattern.

## Module Descriptions

### `main.js` - Application Bootstrap
- Orchestrates application initialization sequence
- Coordinates data loading, map setup, and WebLLM initialization
- Implements dependency injection pattern for module coordination

### `map.js` - Geospatial Visualization  
- Manages Leaflet.js integration with OpenStreetMap tiles
- Handles GeoJSON country boundary rendering and styling
- Implements three-state country highlighting system (default/selected/highlighted)
- Provides geospatial event handling for country click interactions

### `data.js` - Data Management Layer
- Loads and parses country dataset from `../data/countryData.json`
- Provides AlaSQL database abstraction with helper query functions
- Implements data validation and error handling for country lookups

### `llm.js` - AI Integration
- Manages WebLLM model lifecycle (loading, inference, cleanup)
- Converts natural language queries to SQL using prompt engineering
- Supports multiple LLM models with configurable context windows
- Handles model switching and performance optimization

### `ui.js` - User Interface Controller
- Manages DOM manipulation and event binding
- Updates country information panels and status indicators
- Handles user interactions for queries, map controls, and model selection
- Implements responsive UI state management

### `debug.js` - Development Utilities
- Provides configurable logging system for development and debugging
- Implements log level filtering and formatted console output
- Used across all modules for consistent debugging experience

## Architecture Patterns

- **ES6 Modules**: Clean import/export with explicit dependencies
- **Separation of Concerns**: Each module has a single, well-defined responsibility  
- **Event-Driven**: Modules communicate through custom events and callbacks
- **Dependency Injection**: Main.js coordinates module initialization and connections
