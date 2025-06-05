// Debug script to understand the data mismatch
const fs = require('fs');

async function debugDataMismatch() {
    console.log("=== DEBUGGING DATA MISMATCH ===");
    
    // Load country data directly
    const data = JSON.parse(fs.readFileSync('data/countryData.json', 'utf8'));
    const countryData = {};
    data.countries.forEach((country) => {
        countryData[country.ISO_A3] = country;
    });
    
    console.log("Total countries in countryData:", Object.keys(countryData).length);
    
    // Simulate the query that was failing
    const countries = data.countries;
    const queryResult = countries.filter(country => 
        country.flagDescription && country.flagDescription.toLowerCase().includes('red')
    ).map(country => ({
        name: country.name,
        ISO_A3: country.ISO_A3
    }));
    
    console.log("Query would return", queryResult.length, "countries with red flags");
    
    // Check first few results
    console.log("\nFirst 10 query results:");
    queryResult.slice(0, 10).forEach((country, index) => {
        const hasCountryData = !!countryData[country.ISO_A3];
        console.log(`${index + 1}. ${country.name} (${country.ISO_A3}) - Has data: ${hasCountryData}`);
    });
    
    // Count how many query results have corresponding country data
    const matchingResults = queryResult.filter(result => countryData[result.ISO_A3]);
    console.log(`\nAll results should have data: ${matchingResults.length} out of ${queryResult.length}`);
    
    // Let's also check a sample of countries that have ISO_A3 codes to understand the issue
    console.log("\n=== SAMPLE COUNTRY DATA ===");
    const sampleCountries = Object.values(countryData).slice(0, 5);
    sampleCountries.forEach(country => {
        console.log(`${country.name} (${country.ISO_A3}): ${country.flagDescription ? 'Has flag description' : 'No flag description'}`);
    });
    
    // Let's specifically look for countries with red flags in the first part of the alphabet
    console.log("\n=== RED FLAG COUNTRIES (A-E) ===");
    const redFlagCountries = countries.filter(country => 
        country.name.charAt(0) <= 'E' &&
        country.flagDescription && 
        country.flagDescription.toLowerCase().includes('red')
    );
    
    redFlagCountries.forEach(country => {
        console.log(`${country.name} (${country.ISO_A3}): ${country.flagDescription.substring(0, 100)}...`);
    });
}

debugDataMismatch().catch(console.error);
