import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

// Mock data module
jest.unstable_mockModule(`${process.cwd()}/js/data.js`, () => ({
  getCountryData: jest.fn(() => ({
    USA: { name: "United States", ISO_A3: "USA", region: "Americas" }
  })),
  fetchCountryData: jest.fn(() => Promise.resolve()),
  isDataLoaded: jest.fn(() => true),
  executeQuery: jest.fn(() => [])
}));

// Mock main module
jest.unstable_mockModule(`${process.cwd()}/js/main.js`, () => ({
  processQuery: jest.fn(),
  resetMap: jest.fn(),
  highlightCountry: jest.fn(),
}));

// Mock UIService
jest.unstable_mockModule(`${process.cwd()}/js/services/UIService.js`, () => ({
  uiService: {
    updateMessage: jest.fn(),
    updateLLMStatus: jest.fn(),
    updateCountryInfo: jest.fn(),
    setUIManager: jest.fn()
  }
}));

describe("World copy rendering", () => {
  let mapModule;
  let mockMap;
  let mockGeojsonLayer;

  beforeEach(async () => {
    jest.clearAllMocks();
    const events = {};
    mockMap = {
      on: jest.fn((event, handler) => { events[event] = handler; }),
      getCenter: jest.fn(() => ({ lng: 0, lat: 0 })),
      getBounds: jest.fn(() => ({
        getNorthEast: () => ({ lng: 10, lat: 10 }),
        getSouthWest: () => ({ lng: -10, lat: -10 })
      })),
    };
    mockGeojsonLayer = {
      addLayer: jest.fn(),
      eachLayer: jest.fn(),
      removeLayer: jest.fn(),
      addTo: jest.fn(() => mockGeojsonLayer)
    };
    global.L = {
      map: jest.fn(() => mockMap),
      tileLayer: jest.fn(() => ({ addTo: jest.fn() })),
      geoJSON: jest.fn(() => mockGeojsonLayer)
    };
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          type: "FeatureCollection",
          features: [
            {
              id: "USA",
              properties: { ISO_A3: "USA" },
              geometry: {
                type: "Polygon",
                coordinates: [[[0,0],[1,0],[1,1],[0,1],[0,0]]]
              }
            }
          ]
        })
      })
    );

    mapModule = await import(`${process.cwd()}/js/map.js`);
    await mapModule.initMap();
    mapModule._checkAndAddCopiesForTesting();
  });

  afterEach(() => {
    mapModule._resetForTesting();
  });

  test("adds copies when dragging beyond bounds", () => {
    const initialCalls = mockGeojsonLayer.addLayer.mock.calls.length;
    mockMap.getCenter.mockReturnValue({ lng: 720, lat: 0 });

    mapModule._checkAndAddCopiesForTesting();

    expect(mockGeojsonLayer.addLayer.mock.calls.length).toBeGreaterThan(initialCalls);
  });
});
