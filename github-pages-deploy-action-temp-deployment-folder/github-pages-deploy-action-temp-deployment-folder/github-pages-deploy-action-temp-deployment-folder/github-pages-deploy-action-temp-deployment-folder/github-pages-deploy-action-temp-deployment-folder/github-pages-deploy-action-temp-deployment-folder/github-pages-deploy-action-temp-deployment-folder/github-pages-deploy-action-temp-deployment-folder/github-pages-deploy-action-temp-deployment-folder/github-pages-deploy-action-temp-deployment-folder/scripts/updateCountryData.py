import json
import requests
from datetime import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

COUNTRY_DATA_FILE = '../data/countryData.json'
REST_COUNTRIES_API = 'https://restcountries.com/v3.1/all'

def fetch_from_api(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logging.error(f"Error fetching data from {url}: {str(e)}")
        return None

def get_flag_data(country):
    return {
        'description': country['flags'].get('alt', 'No description available'),
        'emoji': country.get('flag', ''),
    }

def update_country_data():
    try:
        with open(COUNTRY_DATA_FILE, 'r') as file:
            existing_data = json.load(file)

        rest_countries_data = fetch_from_api(REST_COUNTRIES_API)
        if not rest_countries_data:
            raise Exception("Failed to fetch data from REST Countries API")

        updated_countries = []
        for country in rest_countries_data:
            existing_country = next((c for c in existing_data['countries'] if c['ISO_A3'] == country['cca3']), {})
            
            flag_data = get_flag_data(country)
            
            updated_country = {
                'ISO_A3': country['cca3'],
                'ISO_A2': country['cca2'],
                'name': country['name']['common'],
                'officialName': country['name']['official'],
                'population': country['population'],
                'languages': ','.join(country.get('languages', {}).values()),
                'area': country.get('area'),
                'capital': country.get('capital', ['N/A'])[0] if country.get('capital') else 'N/A',
                'region': country.get('region', ''),
                'subregion': country.get('subregion', ''),
                'flagUrl': country['flags']['png'],
                'flagSvg': country['flags']['svg'],
                'flagDescription': flag_data['description'],
                'flagEmoji': flag_data['emoji'],
                'currencies': ','.join([f"{curr['name']} ({curr.get('symbol', 'N/A')})" for curr in country.get('currencies', {}).values()]),
                'timezones': ','.join(country.get('timezones', [])),
                'continents': ','.join(country.get('continents', [])),
                'borders': ','.join(country.get('borders', [])),
                'drivingSide': country.get('car', {}).get('side', 'N/A'),
                'unMember': country.get('unMember', False),
                'independenceStatus': country.get('independent', 'Unknown'),
                'customData': existing_country.get('customData', {})
            }
            updated_countries.append(updated_country)

        new_data = {
            'countries': updated_countries,
            'metadata': {
                'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
                'version': f"{float(existing_data['metadata']['version']) + 0.1:.1f}",
                'sources': ['RestCountries API']
            }
        }

        with open(COUNTRY_DATA_FILE, 'w') as file:
            json.dump(new_data, file, indent=2)

        logging.info('Country data updated successfully')
    except Exception as error:
        logging.error(f'Error updating country data: {str(error)}')

if __name__ == '__main__':
    update_country_data()