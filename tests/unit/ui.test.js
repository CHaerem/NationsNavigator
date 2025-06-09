import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// Mock the UIService module before any imports  
jest.doMock("/Users/christopherhaerem/Privat/NationsNavigator/js/services/UIService.js", () => ({
	uiService: {
		updateMessage: jest.fn(),
		updateLLMStatus: jest.fn(),
		updateCountryInfo: jest.fn(),
		setUIManager: jest.fn()
	}
}));

const { updateLLMStatus, updateCountryInfo, updateMessage } = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/main.js");

describe("Legacy UI Functions (main.js exports)", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("updateLLMStatus", () => {
		test("should call uiService.updateLLMStatus", async () => {
			const { uiService } = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/services/UIService.js");
			
			updateLLMStatus("WebLLM ready");

			expect(uiService.updateLLMStatus).toHaveBeenCalledWith("WebLLM ready");
		});

		test("should handle various status messages", async () => {
			const { uiService } = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/services/UIService.js");
			
			updateLLMStatus("✅ WebLLM ready");
			updateLLMStatus("❌ WebLLM initialization failed");
			updateLLMStatus("Initializing WebLLM: Loading model (45.2%)");

			expect(uiService.updateLLMStatus).toHaveBeenCalledTimes(3);
		});
	});

	describe("updateCountryInfo", () => {
		test("should call uiService.updateCountryInfo", async () => {
			const { uiService } = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/services/UIService.js");
			
			const countryProps = {
				name: "France",
				capital: "Paris",
				region: "Europe"
			};

			updateCountryInfo(countryProps);

			expect(uiService.updateCountryInfo).toHaveBeenCalledWith(countryProps);
		});

		test("should handle null country data", async () => {
			const { uiService } = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/services/UIService.js");
			
			updateCountryInfo(null);

			expect(uiService.updateCountryInfo).toHaveBeenCalledWith(null);
		});
	});

	describe("updateMessage", () => {
		test("should call uiService.updateMessage", async () => {
			const { uiService } = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/services/UIService.js");
			
			const message = "<div>Test message</div>";
			updateMessage(message);

			expect(uiService.updateMessage).toHaveBeenCalledWith(message);
		});

		test("should handle various message types", async () => {
			const { uiService } = await import("/Users/christopherhaerem/Privat/NationsNavigator/js/services/UIService.js");
			
			updateMessage("<div class='processing'>Processing...</div>");
			updateMessage("<div class='error'>Error occurred</div>");
			updateMessage("✅ Success");

			expect(uiService.updateMessage).toHaveBeenCalledTimes(3);
		});
	});

	// Note: These functions now delegate to UIService, which handles the actual UI logic
});