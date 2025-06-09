// @ts-check
import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests/e2e",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : 4, // Increased workers for faster execution
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: [
		["line"], // Simpler reporter for faster output
		["html", { open: "never" }], // Don't auto-open HTML report
	],
	/* Global timeout for all tests */
	timeout: 30000, // 30 seconds per test
	/* Expect timeout */
	expect: {
		timeout: 5000, // 5 seconds for assertions
	},
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: "http://localhost:8002",

		/* Enable touch support for all tests */
		hasTouch: true,

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "off", // Disable trace for faster execution

		/* Take screenshot on failure */
		screenshot: "off", // Disable screenshots for speed

		/* Record video on failure */
		video: "off", // Disable video recording for speed

		/* Navigation timeout */
		navigationTimeout: 10000, // 10 seconds for navigation

		/* Action timeout */
		actionTimeout: 5000, // 5 seconds for actions
	},

	/* Configure projects for major browsers - optimized for speed */
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				launchOptions: {
					args: [
						"--no-sandbox",
						"--disable-setuid-sandbox",
						"--disable-web-security",
					],
				},
			},
		},

		// Disable other browsers for faster testing - enable only when needed
		// {
		//   name: 'firefox',
		//   use: { ...devices['Desktop Firefox'] },
		// },

		// {
		//   name: 'webkit',
		//   use: { ...devices['Desktop Safari'] },
		// },

		/* Test against mobile viewports - reduced to one device */
		{
			name: "Mobile Chrome",
			use: {
				...devices["Pixel 5"],
				hasTouch: true, // Enable touch support
				launchOptions: {
					args: ["--no-sandbox", "--disable-setuid-sandbox"],
				},
			},
		},
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: "python3 -m http.server 8002",
		url: "http://localhost:8002",
		reuseExistingServer: true, // Always reuse existing server
		timeout: 60 * 1000, // Reduced to 1 minute
		stdout: "ignore", // Suppress server output for cleaner logs
		stderr: "pipe",
	},
});
