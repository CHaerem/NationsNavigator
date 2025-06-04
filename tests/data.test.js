import fs from 'fs/promises';

/** Ensure countryData.json has at least one country */

test('country data loads', async () => {
  const raw = await fs.readFile('data/countryData.json', 'utf-8');
  const data = JSON.parse(raw);
  expect(Array.isArray(data.countries)).toBe(true);
  expect(data.countries.length).toBeGreaterThan(0);
});
