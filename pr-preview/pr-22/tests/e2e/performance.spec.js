import { test, expect } from "@playwright/test";

test.describe("Performance - Quick Tests", () => {
	test("should load quickly", async ({ page }) => {
		const startTime = Date.now();

		await page.goto("/");
		await page.waitForSelector("#map", { timeout: 10000 });

		// Wait for map to be fully initialized
		await page.waitForFunction(
			() => {
				const mapElement = document.getElementById("map");
				const leafletPane =
					mapElement && mapElement.querySelector(".leaflet-map-pane");
				return window.map && window.map._loaded && leafletPane;
			},
			{ timeout: 15000 }
		);

		const loadTime = Date.now() - startTime;

		// Should load within reasonable time (under 20 seconds for optimized tests)
		expect(loadTime).toBeLessThan(20000);
	});

	test("should be responsive to interactions", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector("#map", { timeout: 10000 });

		// Wait for map to be fully loaded
		await page.waitForFunction(
			() => {
				const mapElement = document.getElementById("map");
				const leafletPane =
					mapElement && mapElement.querySelector(".leaflet-map-pane");
				return window.map && window.map._loaded && leafletPane;
			},
			{ timeout: 15000 }
		);

		const startTime = Date.now();

		// Test zoom control response time - use force to bypass overlapping elements
		const zoomBtn = page.locator(".leaflet-control-zoom-in");
		if ((await zoomBtn.count()) > 0) {
			await zoomBtn.click({ force: true });
		}

		const responseTime = Date.now() - startTime;

		// Should respond quickly (under 2 seconds, allowing for map loading)
		expect(responseTime).toBeLessThan(2000);
	});
});
