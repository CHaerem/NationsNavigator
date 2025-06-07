// Mock for @mlc-ai/web-llm
import { jest } from "@jest/globals";

const mockEngine = {
	model_id: "test-model",
	chat: {
		completions: {
			create: jest.fn(() =>
				Promise.resolve({
					choices: [
						{
							message: {
								content:
									"SELECT name, ISO_A3 FROM countries WHERE region = 'Europe'",
							},
						},
					],
				})
			),
		},
	},
};

export const CreateMLCEngine = jest.fn((modelId, config) => {
	// Store engine globally so it can be accessed in tests
	global.mockEngine = mockEngine;
	return Promise.resolve(mockEngine);
});

export { mockEngine };
