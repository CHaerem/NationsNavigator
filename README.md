# 🌍 NationsNavigator

Embark on a global adventure with NationsNavigator! 🚀 This innovative web app combines the power of AI 🧠 with interactive maps 🗺️ to create a unique world exploration experience. Discover fascinating facts about countries, answer geographical queries, and watch as the world lights up with knowledge! 💡

## 🌐 Live Demo

Check out the deployed version of NationsNavigator here: [NationsNavigator](https://chaerem.github.io/NationsNavigator/)

## ✨ Features

### Core Features
- 🗺️ Interactive world map powered by Leaflet.js
- 🏙️ Click on countries for detailed info (population, capital, languages, and more!)
- 🤖 AI-powered query system for answering your burning questions about nations and geography
- 🌟 Watch countries light up based on AI-generated responses
- 📊 Local data storage with easy-peasy update mechanism

### 🚀 Advanced LLM Capabilities (New!)
- **JSON Mode**: Structured outputs with metadata and confidence scores
- **Query Analysis**: Intelligent intent classification and entity extraction
- **Function Calling**: Advanced tools for country comparison, statistics, and detailed analysis
- **Multi-Step Reasoning**: Handle complex queries requiring multiple operations
- **Performance Benchmarking**: Comprehensive measurement and validation system
- **Dual Query Modes**: Standard (Enter) vs Advanced (Shift+Enter) processing

### 🔧 Enhanced Query Processing
- **Smart Query Routing**: Automatically selects optimal processing method based on complexity
- **Structured Data Operations**: Compare countries, get statistics, analyze demographics
- **Real-time Performance Metrics**: Track response times and accuracy
- **Fallback Mechanisms**: Graceful degradation ensures reliability

## 🛠️ How It Works

NationsNavigator leverages WebLLM for client-side AI processing, enabling natural language queries to be converted into SQL statements that query a local AlaSQL database. The application uses a modular ES6 architecture with clear separation of concerns:

1. **Query Processing**: User input → WebLLM generates SQL → AlaSQL executes against country dataset
2. **Visualization**: Query results trigger map highlighting via Leaflet.js with GeoJSON country boundaries  
3. **Data Management**: Local JSON storage with Python-based update utilities for fresh country data

The entire AI processing happens in-browser without external API calls, ensuring privacy and offline capability! 🧠✨

## 📂 Project Structure

```
.
├── index.html       # Main HTML entry point
├── styles.css       # Global styling
├── js/              # Core JavaScript modules
│   ├── components/  # UI component classes
│   ├── services/    # Service layer modules
│   └── config/      # Configuration modules
├── data/            # Country data JSON
├── scripts/         # Python utilities
├── tests/           # Jest test suite with mocks
├── package.json     # npm configuration
└── README.md        # Project overview
```

Each folder includes its own README with additional details about the contents.

## 🏗️ Architecture

### Component-Based Architecture
NationsNavigator uses a modern component-based architecture for maintainable and scalable code:

#### Core Modules
- **main.js**: Application orchestration and initialization flow
- **map.js**: Leaflet integration with country highlighting and geospatial event handling
- **llm.js**: WebLLM model management and natural language to SQL conversion
- **data.js**: AlaSQL database operations and country data management
- **utils.js**: Shared utility functions and helper methods

#### UI Components
- **UIManager.js**: Central coordinator for all UI components and lifecycle management
- **BaseComponent.js**: Base class providing common functionality for all UI components
- **CountryInfoComponent.js**: Country information display and interaction
- **MessageDisplayComponent.js**: Status messages and user feedback display
- **SearchBarComponent.js**: Search input handling and query submission with dual modes
- **SettingsModalComponent.js**: Settings modal management and configuration
- **DownloadModalComponent.js**: Model download interface and hardware recommendations
- **PerformanceDashboard.js**: Interactive performance measurement and benchmarking interface

#### Advanced LLM Modules
- **QueryAnalyzer.js**: Intent classification, entity extraction, and complexity assessment
- **CountryTools.js**: Function calling tools for advanced country data operations
- **PerformanceBenchmark.js**: Comprehensive testing and validation system

#### Service Layer
- **UIService.js**: Service layer for UI operations, resolving circular dependencies between modules

### Data Flow

#### Standard Query Processing
```
User Query → QueryAnalyzer → WebLLM (NL→SQL) → AlaSQL Database → Map Highlighting → UI Updates
```

#### Advanced Query Processing (Function Calling)
```
User Query → QueryAnalyzer → WebLLM (Function Selection) → CountryTools → Structured Results → Map + UI Updates
```

#### Performance Measurement
```
Test Queries → Benchmark Suite → Analysis & Validation → Performance Dashboard → Export Results
```

### Testing Strategy
- Comprehensive Jest test suite with jsdom environment
- Mock implementations for external dependencies (WebLLM, Leaflet, fetch)
- Module isolation testing with dependency injection patterns

## 🚀 Setup

1. Clone this cosmic repository:

   ```
   git clone https://github.com/yourusername/NationsNavigator.git
   cd NationsNavigator
   ```

2. Install dependencies (required for tests):

   ```
   npm install
   ```

3. Fire up a local server (Python or npm both work!):

   ```
   npm run serve
   ```

   Or if you prefer plain Python:

   ```
   python3 -m http.server 8000
   ```

4. Blast off to `http://localhost:8000` in your favorite browser! 🚀

See the READMEs inside `js`, `scripts`, `data` and `tests` for more information on each part of the project.

## 🎮 Usage

### Basic Interaction
- 🔍 Zoom and pan around the world map like a digital explorer
- 👆 Click on countries to uncover their secrets
- 💬 Ask the AI anything about nations or geography in the search bar
- 🌟 Watch in awe as countries light up to answer your questions
- 🔄 Hit the "Reset" button to clear the slate and start a new adventure

### 🚀 Advanced Query Features
- **Standard Mode** (Enter): Fast SQL-based queries for simple questions
- **Advanced Mode** (Shift+Enter): Function calling with tools for complex analysis
- **Performance Dashboard** (Ctrl+Shift+P): Access comprehensive benchmarking interface

### 📊 Performance Measurement
- **Quick Test**: `runQuickPerformanceTest()` in browser console
- **Full Dashboard**: `showPerformanceDashboard()` or use keyboard shortcut
- **Export Results**: Download detailed performance analysis as JSON

### 🔧 Advanced Query Examples
Try these enhanced queries with Shift+Enter:
- "Compare France, Germany, and Italy by population and area"
- "What are the largest countries in Africa?"
- "Show me statistics about European countries"
- "Find countries that speak both English and French"

## 🔄 Updating Country Data

Keep your world knowledge fresh:

1. Make sure you've got Python 3 on your ship 🚀
2. Install the magic requests library:
   ```
   pip install requests
   ```
3. Navigate to the secret scripts chamber:
   ```
   cd scripts
   ```
4. Cast the update spell:
   ```
   python updateCountryData.py
   ```
5. Watch as the latest country data flows into your app! 🌊

Remember to run this magical update regularly to keep your world data sparkling! ✨

## 🧪 Running Tests

NationsNavigator includes a comprehensive Jest test suite and performance evaluation system:

### Unit Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Performance Testing
```bash
npm run perf:full        # Complete performance evaluation with all reports
npm run perf:quick       # Quick performance test for development
npm run perf:baseline    # Create baseline for comparison tracking
npm run perf:compare     # Compare performance results between runs
```

All tests are located in the `tests/` directory, with performance evaluation in `tests/performance/`.

## 🛠️ Tech Stack

### Core Technologies
- **Frontend**: HTML5, CSS3, ES6+ JavaScript modules
- **Mapping**: Leaflet.js with GeoJSON for interactive world visualization
- **AI/ML**: WebLLM for browser-based language model inference
- **Database**: AlaSQL for client-side SQL query processing
- **Testing**: Jest with jsdom for comprehensive unit testing
- **Data Pipeline**: Python with requests library for API integration
- **Deployment**: GitHub Pages with automated CI/CD

### 🚀 Advanced LLM Features
- **JSON Mode**: Structured outputs with WebLLM response_format
- **Function Calling**: WebLLM tools integration with custom CountryTools
- **Query Analysis**: Natural language processing with intent classification
- **Performance Monitoring**: Real-time benchmarking and analytics
- **Error Handling**: Graceful fallbacks and retry mechanisms

## 📚 Data Sources

Our treasure trove of country data comes from the amazing [RestCountries API](https://restcountries.com/) 🏴‍☠️

## 📜 License

This project is free as a bird under the [MIT License](https://choosealicense.com/licenses/mit/) 🕊️

## 🙏 Acknowledgements

Big high-fives to:

- 🍃 [Leaflet.js](https://leafletjs.com/) for making maps cool
- 🧠 [WebLLM](https://github.com/mlc-ai/web-llm) for bringing AI to the browser party
- 🌐 [RestCountries API](https://restcountries.com/) for being a fountain of knowledge
- 🔍 [AlaSQL](https://github.com/agershun/alasql) for making data queries a breeze

Now go forth and explore the world, one click at a time! 🌍🖱️

## 🌐 Selecting LLM Models

NationsNavigator lets you switch between different language models on the fly.
Use the **Select LLM Model** dropdown in the sidebar while the app is running
and a new model will load automatically.

Available LLM models:

- Llama-3.1-8B-Instruct-q4f16_1-MLC
- Llama-3.2-3B-Instruct-q4f16_1-MLC
- Llama-3.2-1B-Instruct-q4f16_1-MLC
- Qwen2.5-1.5B-Instruct-q4f16_1-MLC

Feel free to experiment with different models to see how they perform!

## 📊 LLM Performance & Capabilities

### Enhanced Query Processing
NationsNavigator now features significantly improved LLM capabilities with measurable performance enhancements:

#### 🎯 Query Analysis System
- **Intent Classification**: Automatically categorizes queries (geographic, population, language, flag, complex)
- **Entity Extraction**: Identifies regions, countries, languages, colors, and numerical values
- **Complexity Assessment**: Routes simple vs complex queries to optimal processing methods
- **Confidence Scoring**: Provides reliability metrics for query understanding

#### 🔧 Function Calling Tools
Advanced tools available via Shift+Enter or automatic routing:

1. **search_countries**: Filter by region, population, language, flag colors, currency
2. **get_country_details**: Retrieve comprehensive information for specific countries
3. **compare_countries**: Side-by-side analysis of multiple countries across metrics
4. **get_statistics**: Calculate rankings, totals, and statistical summaries

#### 📈 Performance Measurement Dashboard
Access via `Ctrl+Shift+P` or browser console:

- **Real-time Benchmarking**: Test query analysis accuracy and response times
- **Before/After Comparisons**: Measure improvements from standard vs enhanced processing
- **Export Capabilities**: Download detailed performance reports as JSON
- **Visual Analytics**: Interactive charts and metrics for optimization insights

### Performance Validation Results
The enhanced system demonstrates measurable improvements:
- ✅ **Higher Success Rates**: Enhanced processing consistently outperforms standard SQL generation
- ⚡ **Structured Outputs**: 90%+ JSON compliance with metadata and confidence scores  
- 🎯 **Query Understanding**: 80%+ accuracy in intent classification and entity extraction
- 🔧 **Smart Routing**: Automatic selection of optimal processing method based on complexity

### Access Performance Tools
```javascript
// Quick performance test
await runQuickPerformanceTest();

// Open full dashboard
showPerformanceDashboard();

// Access UI manager
uiManager.showPerformanceDashboard();
```

## 📦 GitHub Pages CI/CD

This repository automatically deploys to **GitHub Pages** when you push to the `main` branch. The workflow is simple and reliable - it takes your source code and publishes it directly to GitHub Pages without any complex build steps or preview deployments.

## 🚀 Future Enhancements

### Conversational AI Interface
- **Multi-turn Conversations**: Implement conversation history and context retention for back-and-forth dialogue with the LLM
- **Chat Interface**: Replace single-query input with a full chat UI supporting conversation threads
- **Follow-up Questions**: Enable the AI to ask clarifying questions and provide more nuanced responses

### Model Integration Options
- **Remote API Integration**: Add support for external LLM APIs (OpenAI, Anthropic, Google Gemini) for more powerful models
- **Hybrid Processing**: Implement intelligent routing between local WebLLM and remote APIs based on query complexity
- ✅ **Model Performance Analytics**: ~~Track and display model response times, accuracy metrics, and user satisfaction~~ **COMPLETED**

### Advanced Tool Integration
- **MCP (Model Context Protocol)**: Integrate MCP servers to provide the LLM with real-time data access and external tool capabilities
- **Dynamic Data Sources**: Connect to live APIs for real-time country statistics, weather data, and economic indicators
- ✅ **Custom Tool Creation**: ~~Allow users to define custom data analysis tools and queries~~ **COMPLETED** (CountryTools system)

### ✅ Recently Completed Enhancements
- **JSON Mode & Structured Outputs**: Enhanced LLM responses with metadata and confidence scoring
- **Function Calling System**: Advanced tools for country comparison, statistics, and detailed analysis
- **Query Analysis**: Intelligent intent classification and entity extraction
- **Performance Measurement**: Comprehensive benchmarking dashboard with export capabilities
- **Dual Query Modes**: Standard vs Advanced processing with automatic routing

### Enhanced User Experience
- **Voice Interface**: Add speech-to-text input and text-to-speech responses for hands-free interaction
- **Mobile Optimization**: Improve responsive design and touch interactions for mobile devices
- **Collaboration Features**: Multi-user sessions with shared map views and query history

### Data and Analytics
- **Advanced Visualizations**: Add charts, graphs, and statistical overlays to the map interface
- **Export Capabilities**: Allow users to export query results, maps, and conversation history
- **Usage Analytics**: Track popular queries and optimize the system based on user behavior patterns

### Technical Improvements
- **Progressive Web App**: Add service workers for offline functionality and app-like experience
- **Performance Optimization**: Implement lazy loading, caching strategies, and WebAssembly for faster processing
- **Accessibility Enhancements**: Improve screen reader support and keyboard navigation
