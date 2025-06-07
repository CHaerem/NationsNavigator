import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";

describe("Model Cache Detection", () => {
	let checkModelCacheStatus, getModelConfigs;
	let mockCaches;

	beforeEach(async () => {
		// Mock the Cache API
		mockCaches = new Map();
		global.caches = {
			keys: jest.fn(),
			open: jest.fn(),
		};

		// Import the functions we want to test
		const llmModule = await import("../js/llm.js");
		checkModelCacheStatus = llmModule.checkModelCacheStatus;
		getModelConfigs = llmModule.getModelConfigs;
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("checkModelCacheStatus", () => {
		test("should return false when Cache API is not available", async () => {
			global.caches = undefined;
			
			const result = await checkModelCacheStatus("test-model");
			
			expect(result).toBe(false);
		});

		test("should return false when webllm/model cache does not exist", async () => {
			global.caches.open.mockRejectedValue(new Error("Cache not found"));
			
			const result = await checkModelCacheStatus("test-model");
			
			expect(result).toBe(false);
		});

		test("should return false when cache exists but model is not found", async () => {
			const mockCache = {
				keys: jest.fn().mockResolvedValue([
					{ url: "https://example.com/other-model-file.bin" },
					{ url: "https://example.com/config.json" }
				])
			};
			global.caches.open.mockResolvedValue(mockCache);
			
			const result = await checkModelCacheStatus("Llama-3.2-1B-Instruct-q4f16_1-MLC");
			
			expect(result).toBe(false);
			expect(global.caches.open).toHaveBeenCalledWith("webllm/model");
		});

		test("should return true when model is found in cache (exact match)", async () => {
			const mockCache = {
				keys: jest.fn().mockResolvedValue([
					{ url: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/resolve/main/model.bin" },
					{ url: "https://example.com/config.json" }
				])
			};
			global.caches.open.mockResolvedValue(mockCache);
			
			const result = await checkModelCacheStatus("Llama-3.2-1B-Instruct-q4f16_1-MLC");
			
			expect(result).toBe(true);
		});

		test("should return true when model is found in cache (case insensitive)", async () => {
			const mockCache = {
				keys: jest.fn().mockResolvedValue([
					{ url: "https://huggingface.co/mlc-ai/llama-3.2-1b-instruct-q4f16_1-mlc/resolve/main/weights.bin" }
				])
			};
			global.caches.open.mockResolvedValue(mockCache);
			
			const result = await checkModelCacheStatus("Llama-3.2-1B-Instruct-q4f16_1-MLC");
			
			expect(result).toBe(true);
		});

		test("should return true when model files are found with different extensions", async () => {
			const mockCache = {
				keys: jest.fn().mockResolvedValue([
					{ url: "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/resolve/main/tokenizer.json" },
					{ url: "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/resolve/main/params.bin" }
				])
			};
			global.caches.open.mockResolvedValue(mockCache);
			
			const result = await checkModelCacheStatus("Qwen2.5-1.5B-Instruct-q4f16_1-MLC");
			
			expect(result).toBe(true);
		});

		test("should handle cache access errors gracefully", async () => {
			global.caches.open.mockResolvedValue({
				keys: jest.fn().mockRejectedValue(new Error("Access denied"))
			});
			
			const result = await checkModelCacheStatus("test-model");
			
			expect(result).toBe(false);
		});

		test("should check all configured models independently", async () => {
			const mockCache = {
				keys: jest.fn().mockResolvedValue([
					{ url: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/resolve/main/model.bin" },
					// Only one model is cached
				])
			};
			global.caches.open.mockResolvedValue(mockCache);
			
			const configs = getModelConfigs();
			const modelIds = Object.values(configs).map(config => config.model_id);
			
			const results = await Promise.all(
				modelIds.map(modelId => checkModelCacheStatus(modelId))
			);
			
			// Only the Llama-3.2-1B model should be detected as cached
			expect(results[modelIds.indexOf("Llama-3.2-1B-Instruct-q4f16_1-MLC")]).toBe(true);
			expect(results[modelIds.indexOf("Llama-3.1-8B-Instruct-q4f16_1-MLC")]).toBe(false);
			expect(results[modelIds.indexOf("Qwen2.5-1.5B-Instruct-q4f16_1-MLC")]).toBe(false);
		});
	});

	describe("Real-world scenarios", () => {
		test("should detect models from typical WebLLM cache URLs", async () => {
			const mockCache = {
				keys: jest.fn().mockResolvedValue([
					{ url: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/resolve/main/params_shard_0.bin" },
					{ url: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/resolve/main/params_shard_1.bin" },
					{ url: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/resolve/main/tokenizer.json" },
					{ url: "https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC/resolve/main/mlc-chat-config.json" },
					{ url: "https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC/resolve/main/params_shard_0.bin" }
				])
			};
			global.caches.open.mockResolvedValue(mockCache);
			
			const llama1BResult = await checkModelCacheStatus("Llama-3.2-1B-Instruct-q4f16_1-MLC");
			const qwenResult = await checkModelCacheStatus("Qwen2.5-1.5B-Instruct-q4f16_1-MLC");
			const llama8BResult = await checkModelCacheStatus("Llama-3.1-8B-Instruct-q4f16_1-MLC");
			
			expect(llama1BResult).toBe(true);
			expect(qwenResult).toBe(true);
			expect(llama8BResult).toBe(false);
		});
	});
});