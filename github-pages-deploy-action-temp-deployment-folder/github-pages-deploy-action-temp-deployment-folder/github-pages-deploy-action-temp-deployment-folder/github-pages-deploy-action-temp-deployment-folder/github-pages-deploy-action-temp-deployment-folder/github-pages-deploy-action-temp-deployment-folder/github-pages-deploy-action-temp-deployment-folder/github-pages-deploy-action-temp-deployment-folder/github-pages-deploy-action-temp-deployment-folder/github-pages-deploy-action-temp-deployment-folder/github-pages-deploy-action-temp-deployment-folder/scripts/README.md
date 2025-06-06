# Update Scripts

This folder contains utilities for maintaining the project data.

## `updateCountryData.py`

Fetches the latest information from the [RestCountries API](https://restcountries.com/) and updates `../data/countryData.json` with additional metadata. The script logs progress so you can track what was updated.

Run it with:

```bash
pip install requests
python updateCountryData.py
```

The metadata section inside `countryData.json` tracks the last update date and version.
