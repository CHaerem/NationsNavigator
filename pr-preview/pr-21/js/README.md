# JavaScript Modules

This directory contains the core ES6+ modules that implement NationsNavigator's functionality using a modern component-based architecture.

## Directory Structure

```
js/
├── components/          # UI Component Classes
│   ├── BaseComponent.js
│   ├── UIManager.js
│   ├── CountryInfoComponent.js
│   ├── MessageDisplayComponent.js
│   ├── SearchBarComponent.js
│   ├── SettingsModalComponent.js
│   ├── DownloadModalComponent.js
│   └── PerformanceDashboard.js     # Performance measurement interface
├── services/           # Service Layer
│   └── UIService.js
├── config/            # Configuration Modules
│   └── ModelConfig.js
├── main.js            # Application Bootstrap
├── map.js             # Geospatial Visualization
├── data.js            # Data Management Layer
├── llm.js             # Enhanced AI Integration
├── utils.js           # Utility Functions
├── debug.js           # Development Utilities
├── QueryAnalyzer.js   # Query analysis and intent classification
├── CountryTools.js    # Function calling tools for advanced operations
└── PerformanceBenchmark.js  # Performance measurement and validation
```

## Core Modules

### `main.js` - Application Bootstrap
- Orchestrates application initialization sequence
- Coordinates data loading, map setup, and WebLLM initialization
- Implements dependency injection pattern for module coordination
- Provides legacy function exports for backwards compatibility

### `map.js` - Geospatial Visualization  
- Manages Leaflet.js integration with OpenStreetMap tiles
- Handles GeoJSON country boundary rendering and styling
- Implements three-state country highlighting system (default/selected/highlighted)
- Provides geospatial event handling for country click interactions
- Supports infinite world wrapping and dynamic coordinate handling

### `data.js` - Data Management Layer
- Loads and parses country dataset from `../data/countryData.json`
- Provides AlaSQL database abstraction with helper query functions
- Implements data validation and error handling for country lookups
- Manages country data caching and statistics

### `llm.js` - Enhanced AI Integration
- Manages WebLLM model lifecycle (loading, inference, cleanup)
- **JSON Mode**: Structured outputs with metadata and confidence scores
- **Enhanced SQL Generation**: Advanced prompt engineering with query analysis integration
- **Function Calling**: processQueryWithTools for complex multi-step operations
- Supports multiple LLM models with configurable context windows
- Handles model switching, caching, and performance optimization
- Provides hardware capability detection and model recommendations
- Implements graceful fallbacks and error handling for reliability

### `utils.js` - Utility Functions
- Shared utility functions and helper methods
- Common algorithms and data processing functions
- Cross-module helper utilities

### `debug.js` - Development Utilities
- Provides configurable logging system for development and debugging
- Implements log level filtering and formatted console output
- Used across all modules for consistent debugging experience

## UI Components

### `components/BaseComponent.js`
- Base class providing common functionality for all UI components
- Handles element selection, initialization state, and error handling
- Provides consistent component lifecycle management

### `components/UIManager.js`
- Central coordinator for all UI components and their lifecycle
- Manages component initialization, updates, and cleanup
- Provides graceful fallback behavior when components aren't ready
- Implements service injection for modular architecture

### `components/CountryInfoComponent.js`
- Manages country information display panel
- Handles country data formatting and presentation
- Updates country details when selections change on the map

### `components/MessageDisplayComponent.js`
- Controls status messages and user feedback display
- Manages loading states, error messages, and success notifications
- Provides consistent messaging interface across the application

### `components/SearchBarComponent.js`
- Handles search input field and query submission with **dual query modes**
- **Standard Mode** (Enter): Fast SQL-based queries for simple questions
- **Advanced Mode** (Shift+Enter): Function calling with tools for complex analysis
- Manages search state and user interactions with keyboard shortcuts
- Provides input validation and query preprocessing

### `components/SettingsModalComponent.js`
- Manages settings modal interface and configuration
- Handles model selection and application preferences
- Provides persistent settings storage

### `components/DownloadModalComponent.js`
- Controls model download interface and workflow
- Provides hardware recommendations and model information
- Manages download progress and status updates

### `components/PerformanceDashboard.js`
- Interactive performance measurement and benchmarking interface
- Real-time testing of query analysis accuracy and response times
- Export capabilities for detailed performance analysis
- Visual analytics with charts and metrics for optimization insights

## Service Layer

### `services/UIService.js`
- Service layer for UI operations and component communication
- Resolves circular dependencies between core modules and UI components
- Provides abstraction layer for UI operations
- Enables dependency injection and modular testing

## Configuration

### `config/ModelConfig.js`
- Centralized configuration for WebLLM models
- Hardware recommendation algorithms and model specifications
- Performance optimization settings and model parameters

## 🚀 Advanced LLM Modules

### `QueryAnalyzer.js` - Query Analysis and Intent Classification
- **Intent Classification**: Categorizes queries (geographic, population, language, flag, complex)
- **Entity Extraction**: Identifies regions, countries, languages, colors, and numerical values
- **Complexity Assessment**: Routes simple vs complex queries to optimal processing methods
- **Confidence Scoring**: Provides reliability metrics for query understanding
- **Suggestion System**: Offers query improvement recommendations

### `CountryTools.js` - Function Calling Tools
Advanced tools for complex country data operations:
- **search_countries**: Filter by region, population, language, flag colors, currency
- **get_country_details**: Retrieve comprehensive information for specific countries
- **compare_countries**: Side-by-side analysis of multiple countries across metrics
- **get_statistics**: Calculate rankings, totals, and statistical summaries
- **Result Formatting**: Structured output formatting for UI display

### `PerformanceBenchmark.js` - Performance Measurement and Validation
- **Comprehensive Benchmarking**: Test query analysis, SQL generation, and tool usage
- **Before/After Comparisons**: Measure improvements from standard vs enhanced processing
- **Legacy Compatibility**: Maintains backward compatibility with existing performance tests
- **Integration with New System**: Connects to structured performance evaluation framework

## Architecture Patterns

- **Component-Based Architecture**: Modular UI components with clear responsibilities
- **ES6 Modules**: Clean import/export with explicit dependencies
- **Separation of Concerns**: Each module and component has a single, well-defined responsibility  
- **Service Layer Pattern**: Abstraction layer for cross-module communication
- **Dependency Injection**: UIManager and services coordinate component initialization
- **Graceful Degradation**: Fallback behavior when components aren't initialized
- **Clean Architecture**: Legacy code removed, modern patterns throughout

## Testing Strategy

Each module is thoroughly tested with:
- **Unit Tests**: Individual module functionality testing
- **Component Tests**: UI component behavior and lifecycle testing
- **Integration Tests**: Cross-module communication and data flow testing
- **Mock Strategy**: Comprehensive mocking of external dependencies (WebLLM, Leaflet, AlaSQL)

See the `../tests/` directory for detailed test implementations and coverage reports.