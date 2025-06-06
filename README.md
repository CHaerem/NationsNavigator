# 🌍 NationsNavigator

Embark on a global adventure with NationsNavigator! 🚀 This innovative web app combines the power of AI 🧠 with interactive maps 🗺️ to create a unique world exploration experience. Discover fascinating facts about countries, answer geographical queries, and watch as the world lights up with knowledge! 💡

## 🌐 Live Demo

Check out the deployed version of NationsNavigator here: [NationsNavigator Live](https://chaerem.github.io/NationsNavigator/)

## ✨ Features

- 🗺️ Interactive world map powered by Leaflet.js
- 🏙️ Click on countries for detailed info (population, capital, languages, and more!)
- 🤖 AI-powered query system for answering your burning questions about nations and geography
- 🌟 Watch countries light up based on AI-generated responses
- 📊 Local data storage with easy-peasy update mechanism

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
├── js/              # JavaScript modules
├── data/            # Country data JSON
├── scripts/         # Python utilities
├── tests/           # Jest test suite
├── package.json     # npm configuration
└── README.md        # Project overview
```

Each folder includes its own README with additional details about the contents.

## 🏗️ Architecture

### Module Design
- **main.js**: Application orchestration and initialization flow
- **map.js**: Leaflet integration with country highlighting and geospatial event handling
- **llm.js**: WebLLM model management and natural language to SQL conversion
- **data.js**: AlaSQL database operations and country data management
- **ui.js**: DOM manipulation and user interaction event handling
- **utils.js**: Shared utility functions and helper methods

### Data Flow
```
User Query → WebLLM (NL→SQL) → AlaSQL Database → Map Highlighting → UI Updates
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

- 🔍 Zoom and pan around the world map like a digital explorer
- 👆 Click on countries to uncover their secrets
- 💬 Ask the AI anything about nations or geography in the search bar
- 🌟 Watch in awe as countries light up to answer your questions
- 🔄 Hit the "Reset" button to clear the slate and start a new adventure

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

NationsNavigator includes a Jest test suite. Install dependencies once with `npm install` and then run:

```bash
npm test
```

This will execute all tests in the `tests/` directory.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, ES6+ JavaScript modules
- **Mapping**: Leaflet.js with GeoJSON for interactive world visualization
- **AI/ML**: WebLLM for browser-based language model inference
- **Database**: AlaSQL for client-side SQL query processing
- **Testing**: Jest with jsdom for comprehensive unit testing
- **Data Pipeline**: Python with requests library for API integration
- **Deployment**: GitHub Pages with automated CI/CD

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

## 📦 GitHub Pages CI/CD

This repository automatically deploys to **GitHub Pages** when you push to the `main` branch. The workflow is simple and reliable - it takes your source code and publishes it directly to GitHub Pages without any complex build steps or preview deployments.
