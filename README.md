# 🌍 NationsNavigator

Embark on a global adventure with NationsNavigator! 🚀 This innovative web app combines the power of AI 🧠 with interactive maps 🗺️ to create a unique world exploration experience. Discover fascinating facts about countries, answer geographical queries, and watch as the world lights up with knowledge! 💡

## ✨ Features

- 🗺️ Interactive world map powered by Leaflet.js
- 🏙️ Click on countries for detailed info (population, capital, languages, and more!)
- 🤖 AI-powered query system for answering your burning questions about nations and geography
- 🌟 Watch countries light up based on AI-generated responses
- 📊 Local data storage with easy-peasy update mechanism

## 🛠️ How It Works

NationsNavigator uses a smart AI brain 🧠 (WebLLM) right in your browser to answer your questions about countries and geography. It's like having a genius globetrotter at your fingertips! The AI works hand in hand with our interactive map to create a fun and educational experience. Plus, all the country data lives right on your computer and can be updated with a magic Python spell! 🐍✨

## 🚀 Setup

1. Clone this cosmic repository:

   ```
   git clone https://github.com/yourusername/NationsNavigator.git
   cd NationsNavigator
   ```

2. Fire up a local server (Python's got your back!):

   ```
   python -m http.server 8000
   ```

3. Blast off to `http://localhost:8000` in your favorite browser! 🚀

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
   python update_country_data.py
   ```
5. Watch as the latest country data flows into your app! 🌊

Remember to run this magical update regularly to keep your world data sparkling! ✨

## 🛠️ Tech Magic

- 🎨 HTML5 and CSS3 for that sleek look
- 🧙‍♂️ JavaScript (ES6+) for interactive wizardry
- 🗺️ Leaflet.js for map-tastic experiences
- 🤖 WebLLM for AI superpowers
- 🔍 AlaSQL for data-querying magic
- 🐍 Python with requests for data update sorcery

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
- Llama-2.7B-Instruct-q4f16_1-MLC
- Llama-1.3B-Instruct-q4f16_1-MLC

Feel free to experiment with different models to see how they perform!
