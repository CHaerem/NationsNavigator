import json
import requests
from datetime import datetime

COUNTRY_DATA_FILE = '../data/countryData.json'
REST_COUNTRIES_API = 'https://restcountries.com/v3.1/all'

def fetch_from_api(url):
    response = requests.get(url)
    response.raise_for_status()  # This will raise an exception for HTTP errors
    return response.json()

def extract_colors(alt_text):
    common_colors = ['red', 'blue', 'green', 'yellow', 'white', 'black', 'orange', 'purple']
    return [color for color in common_colors if alt_text and color in alt_text.lower()]

def update_country_data():
    try:
        # Load existing data
        with open(COUNTRY_DATA_FILE, 'r') as file:
            existing_data = json.load(file)

        # Fetch new data from RestCountries API
        rest_countries_data = fetch_from_api(REST_COUNTRIES_API)

        # Update country data
        updated_countries = []
        for country in rest_countries_data:
            existing_country = next((c for c in existing_data['countries'] if c['ISO_A3'] == country['cca3']), {})
            updated_country = {
                'ISO_A3': country['cca3'],
                'name': country['name']['common'],
                'population': country['population'],
                'languages': list(country.get('languages', {}).values()),
                'area': country.get('area'),
                'capital': country.get('capital', ['N/A'])[0],
                'region': country.get('region', ''),
                'subregion': country.get('subregion', ''),
                'flagUrl': country['flags']['png'],
                'flagColors': extract_colors(country['flags'].get('alt', '')),
                'customData': existing_country.get('customData', {})
            }
            updated_countries.append(updated_country)

        # Update metadata
        new_data = {
            'countries': updated_countries,
            'metadata': {
                'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
                'version': f"{float(existing_data['metadata']['version']) + 0.1:.1f}",
                'sources': ['RestCountries API']
            }
        }

        # Write updated data to file
        with open(COUNTRY_DATA_FILE, 'w') as file:
            json.dump(new_data, file, indent=2)

        print('Country data updated successfully')
    except Exception as error:
        print('Error updating country data:', str(error))

if __name__ == '__main__':
    update_country_data()