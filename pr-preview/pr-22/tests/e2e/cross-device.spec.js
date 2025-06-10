import { test, expect } from "@playwright/test";

test.describe("Cross-Device - Essential Tests", () => {
	test("should work on desktop", async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 720 });

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

		// Verify basic functionality
		const mapElement = page.locator("#map");
		await expect(mapElement).toBeVisible();

		const mapBox = await mapElement.boundingBox();
		expect(mapBox?.width).toBeGreaterThan(500);
	});

	test("should work on mobile", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });

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

		// Verify mobile functionality
		const mapElement = page.locator("#map");
		await expect(mapElement).toBeVisible();

		const mapBox = await mapElement.boundingBox();
		expect(mapBox?.width).toBeGreaterThan(300);
	});
});
