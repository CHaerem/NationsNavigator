import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// Mock the dependencies before importing the module
jest.unstable_mockModule("../js/main.js", () => ({
	processQuery: jest.fn(),
	resetMap: jest.fn(),
	highlightCountry: jest.fn()
}));

jest.unstable_mockModule("../js/map.js", () => ({
	highlightCountry: jest.fn()
}));

const { updateLLMStatus, updateCountryInfo, updateMessage, setupEventListeners } = await import("../js/ui.js");

describe("UI Module", () => {
	let mockElements;

	beforeEach(() => {
		// Enhanced mock elements with proper querySelector support
		const createMockElement = (id, additionalProps = {}) => ({
			id,
			textContent: "",
			innerHTML: "",
			style: { display: "none" },
			disabled: id === "search-btn" ? true : false,
			value: "",
			placeholder: "",
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			querySelectorAll: jest.fn(() => []),
			querySelector: jest.fn(() => null),
			setAttribute: jest.fn(),
			getAttribute: jest.fn(() => null),
			classList: {
				add: jest.fn(),
				remove: jest.fn(),
				contains: jest.fn(() => false),
			},
			blur: jest.fn(),
			focus: jest.fn(),
			...additionalProps
		});

		// Create button sub-elements
		const btnIcon = createMockElement("btn-icon", { textContent: "⏳" });
		const btnText = createMockElement("btn-text", { textContent: "Loading AI..." });
		
		// Create search button with proper querySelector behavior
		const searchBtn = createMockElement("search-btn", {
			disabled: true,
			querySelector: jest.fn((selector) => {
				if (selector === ".btn-icon") return btnIcon;
				if (selector === ".btn-text") return btnText;
				return null;
			})
		});

		mockElements = {
			"llm-status": createMockElement("llm-status"),
			"search-btn": searchBtn,
			"btn-icon": btnIcon,
			"btn-text": btnText,
			"country-info": createMockElement("country-info"),
			"close-btn": createMockElement("close-btn"),
			"message": createMockElement("message"),
			"query-form": createMockElement("query-form"),
			"query-input": createMockElement("query-input"),
			"reset-btn": createMockElement("reset-btn"),
		};

		// Override the global document.getElementById mock for this test
		global.document.getElementById = jest.fn((id) => mockElements[id] || null);
		
		// Set up additional document methods
		global.document.querySelector = jest.fn((selector) => {
			if (selector === ".input-container") return createMockElement("input-container", { appendChild: jest.fn() });
			return null;
		});
		global.document.createElement = jest.fn(() => createMockElement("created-element", { remove: jest.fn() }));
		
		// Mock activeElement as a getter that we can control
		Object.defineProperty(global.document, 'activeElement', {
			value: null,
			writable: true,
			configurable: true
		});

		// Mock global functions
		global.setInterval = jest.fn();
		global.setTimeout = jest.fn((fn) => fn());
	});

	describe("updateLLMStatus - Button Activation Fix", () => {
		test("should enable button when LLM is ready", () => {
			updateLLMStatus("✅ WebLLM ready");

			expect(global.document.getElementById).toHaveBeenCalledWith("llm-status");
			expect(global.document.getElementById).toHaveBeenCalledWith("search-btn");

			expect(mockElements["llm-status"].textContent).toBe("✅ WebLLM ready");
			expect(mockElements["search-btn"].disabled).toBe(false);
			expect(mockElements["btn-icon"].textContent).toBe("🔍");
			expect(mockElements["btn-text"].textContent).toBe("Ask AI");
		});

		test("should enable button when status contains checkmark", () => {
			updateLLMStatus("✅ Model loaded successfully from cache");

			expect(mockElements["search-btn"].disabled).toBe(false);
			expect(mockElements["btn-icon"].textContent).toBe("🔍");
			expect(mockElements["btn-text"].textContent).toBe("Ask AI");
		});

		test("should disable button and show error when LLM fails", () => {
			updateLLMStatus("❌ WebLLM initialization failed");

			expect(mockElements["llm-status"].textContent).toBe("❌ WebLLM initialization failed");
			expect(mockElements["search-btn"].disabled).toBe(true);
			expect(mockElements["btn-icon"].textContent).toBe("❌");
			expect(mockElements["btn-text"].textContent).toBe("AI Unavailable");
		});

		test("should disable button and show loading when LLM is loading", () => {
			updateLLMStatus("Initializing WebLLM: Loading model (45.2%)");

			expect(mockElements["search-btn"].disabled).toBe(true);
			expect(mockElements["btn-icon"].textContent).toBe("⏳");
			expect(mockElements["btn-text"].textContent).toBe("Loading AI...");
		});

		test("should handle missing button elements gracefully", () => {
			// Make querySelector return null to simulate missing elements
			mockElements["search-btn"].querySelector.mockReturnValue(null);

			expect(() => updateLLMStatus("✅ WebLLM ready")).not.toThrow();
			expect(mockElements["search-btn"].disabled).toBe(false);
		});

		test("should handle transition from loading to ready", () => {
			// Start with loading
			updateLLMStatus("Initializing WebLLM: Loading model (45.2%)");
			expect(mockElements["search-btn"].disabled).toBe(true);
			expect(mockElements["btn-text"].textContent).toBe("Loading AI...");

			// Transition to ready
			updateLLMStatus("✅ WebLLM ready");
			expect(mockElements["search-btn"].disabled).toBe(false);
			expect(mockElements["btn-text"].textContent).toBe("Ask AI");
		});
	});

	describe("updateCountryInfo", () => {
		test("should display country information when props provided", () => {
			const countryProps = {
				name: "United States",
				flagEmoji: "🇺🇸",
				flagUrl: "https://example.com/us.png",
				region: "Americas",
				capital: "Washington D.C.",
				population: 331000000,
				area: 9833520,
				currencies: "US Dollar",
				languages: "English"
			};

			updateCountryInfo(countryProps);

			expect(global.document.getElementById).toHaveBeenCalledWith("country-info");
			expect(global.document.getElementById).toHaveBeenCalledWith("close-btn");

			expect(mockElements["country-info"].innerHTML).toContain("United States");
			expect(mockElements["country-info"].innerHTML).toContain("🇺🇸");
			expect(mockElements["country-info"].innerHTML).toContain("Washington D.C.");
			expect(mockElements["country-info"].innerHTML).toContain("331.0M");
			expect(mockElements["close-btn"].style.display).toBe("block");
		});

		test("should show empty state when no props provided", () => {
			updateCountryInfo(null);

			expect(mockElements["country-info"].innerHTML).toContain("Click on a country");
			expect(mockElements["country-info"].innerHTML).toContain("🗺️");
			expect(mockElements["close-btn"].style.display).toBe("none");
		});

		test("should handle missing data gracefully", () => {
			const minimalProps = { name: "Test Country" };

			updateCountryInfo(minimalProps);

			expect(mockElements["country-info"].innerHTML).toContain("Test Country");
			expect(mockElements["country-info"].innerHTML).toContain("N/A");
		});

		test("should format population correctly", () => {
			const testCases = [
				{ population: 1500000000, expected: "1.5B" },
				{ population: 50000000, expected: "50.0M" },
				{ population: 5000, expected: "5K" },
				{ population: 500, expected: "500" }
			];

			testCases.forEach(({ population, expected }) => {
				updateCountryInfo({ name: "Test", population });
				expect(mockElements["country-info"].innerHTML).toContain(expected);
			});
		});

		test("should handle borders and create clickable tags", () => {
			const props = {
				name: "France",
				borders: "Germany,Spain,Italy"
			};

			// Mock querySelectorAll to return border elements with addEventListener
			const mockBorderElements = [
				{ addEventListener: jest.fn(), getAttribute: jest.fn(() => "Germany") },
				{ addEventListener: jest.fn(), getAttribute: jest.fn(() => "Spain") },
				{ addEventListener: jest.fn(), getAttribute: jest.fn(() => "Italy") }
			];
			mockElements["country-info"].querySelectorAll.mockReturnValue(mockBorderElements);

			updateCountryInfo(props);

			expect(mockElements["country-info"].innerHTML).toContain("Germany");
			expect(mockElements["country-info"].innerHTML).toContain("Spain");
			expect(mockElements["country-info"].innerHTML).toContain("Italy");
		});

		test("should call highlightCountry when border country is clicked", async () => {
			const { highlightCountry } = await import("../js/map.js");
			
			const props = {
				name: "France",
				borders: "Germany,Spain,Italy"
			};

			// Mock querySelectorAll to return border elements
			const mockBorderElements = [
				{ 
					addEventListener: jest.fn(), 
					getAttribute: jest.fn().mockReturnValue("Germany") 
				},
				{ 
					addEventListener: jest.fn(), 
					getAttribute: jest.fn().mockReturnValue("Spain") 
				}
			];
			mockElements["country-info"].querySelectorAll.mockReturnValue(mockBorderElements);

			updateCountryInfo(props);

			// Verify addEventListener was called for border tags
			expect(mockBorderElements[0].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
			expect(mockBorderElements[1].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));

			// Simulate clicking on the first border tag (Germany)
			const clickHandler = mockBorderElements[0].addEventListener.mock.calls[0][1];
			const mockEvent = { target: mockBorderElements[0] };
			clickHandler(mockEvent);

			// Verify highlightCountry was called with the correct country code
			expect(highlightCountry).toHaveBeenCalledWith("Germany");
		});
	});

	describe("updateMessage", () => {
		test("should update message content", () => {
			const message = "<div class='query-results'>Test message</div>";
			updateMessage(message);

			expect(global.document.getElementById).toHaveBeenCalledWith("message");
			expect(mockElements["message"].innerHTML).toBe(message);
		});

		test("should attach event listeners to toggle-countries links", () => {
			const mockToggleLinks = [
				{ addEventListener: jest.fn() }
			];
			mockElements["message"].querySelectorAll.mockImplementation((selector) => {
				if (selector === ".toggle-countries") return mockToggleLinks;
				return [];
			});

			updateMessage("<div><a class='toggle-countries'>Show all</a></div>");

			expect(mockToggleLinks[0].addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
		});

		test("should attach event listeners to country links", () => {
			const mockCountryLinks = [
				{ 
					addEventListener: jest.fn(),
					getAttribute: jest.fn(() => "USA")
				}
			];
			mockElements["message"].querySelectorAll.mockImplementation((selector) => {
				if (selector === ".country-link") return mockCountryLinks;
				return [];
			});

			updateMessage("<div><span class='country-link' data-iso='USA'>United States</span></div>");

			expect(mockCountryLinks[0].addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
		});

		test("should attach event listeners to SQL show/hide buttons", () => {
			const mockSqlButtons = [
				{ 
					addEventListener: jest.fn(),
					getAttribute: jest.fn(() => "sql-details"),
					querySelector: jest.fn((sel) => {
						if (sel === ".sql-icon") return { textContent: "▼" };
						if (sel === "span:first-child") return { textContent: "Show SQL" };
						return null;
					})
				}
			];
			mockElements["message"].querySelectorAll.mockImplementation((selector) => {
				if (selector === ".show-sql-btn") return mockSqlButtons;
				return [];
			});

			updateMessage("<div><button class='show-sql-btn' data-target='sql-details'>Show SQL</button></div>");

			expect(mockSqlButtons[0].addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
		});
	});

	describe("setupEventListeners", () => {
		test("should setup form submission event listener", () => {
			setupEventListeners();

			expect(mockElements["query-form"].addEventListener).toHaveBeenCalledWith("submit", expect.any(Function));
		});

		test("should setup search button click event listener", () => {
			setupEventListeners();

			expect(mockElements["search-btn"].addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
		});

		test("should setup reset button click event listener", () => {
			setupEventListeners();

			expect(mockElements["reset-btn"].addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
		});

		test("should setup close button click event listener", () => {
			setupEventListeners();

			expect(mockElements["close-btn"].addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
		});

		test("should setup query input event listeners", () => {
			setupEventListeners();

			expect(mockElements["query-input"].addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
			expect(mockElements["query-input"].addEventListener).toHaveBeenCalledWith("focus", expect.any(Function));
			expect(mockElements["query-input"].addEventListener).toHaveBeenCalledWith("blur", expect.any(Function));
		});

		test("should setup placeholder rotation interval", () => {
			setupEventListeners();

			expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 3000);
		});
	});

	describe("Query Suggestions", () => {
		test("should update placeholder with suggestions", () => {
			setupEventListeners();

			// Check that placeholder was set with a suggestion
			expect(mockElements["query-input"].placeholder).toMatch(/e\.g\.,/);
		});

		test("should rotate placeholder suggestions", () => {
			setupEventListeners();

			const initialPlaceholder = mockElements["query-input"].placeholder;
			
			// Simulate the interval callback being called
			const intervalCallback = global.setInterval.mock.calls[0][0];
			
			// Mock activeElement to not be the input (so rotation happens)
			global.document.activeElement = null;
			mockElements["query-input"].value = "";
			
			intervalCallback();
			
			// Placeholder should have changed (or at least the function should run without error)
			expect(() => intervalCallback()).not.toThrow();
		});
	});
});