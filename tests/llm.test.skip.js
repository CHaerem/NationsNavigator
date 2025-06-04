// Renamed to .skip.js to skip heavy network-based tests
import { initWebLLM } from "../js/llm.js";

describe("LLM Model Selection and Initialization", () => {
  test("should initialize with Llama-3.1-8B-Instruct-q4f16_1-MLC model", async () => {
    const selectedModel = "Llama-3.1-8B-Instruct-q4f16_1-MLC";
    await initWebLLM(selectedModel);
    expect(engine).toBeDefined();
    expect(engine.model_id).toBe("Llama-3.1-8B-Instruct-q4f16_1-MLC-1k");
  });

  test("should initialize with Llama-2.7B-Instruct-q4f16_1-MLC model", async () => {
    const selectedModel = "Llama-2.7B-Instruct-q4f16_1-MLC";
    await initWebLLM(selectedModel);
    expect(engine).toBeDefined();
    expect(engine.model_id).toBe("Llama-2.7B-Instruct-q4f16_1-MLC-1k");
  });

  test("should initialize with Llama-1.3B-Instruct-q4f16_1-MLC model", async () => {
    const selectedModel = "Llama-1.3B-Instruct-q4f16_1-MLC";
    await initWebLLM(selectedModel);
    expect(engine).toBeDefined();
    expect(engine.model_id).toBe("Llama-1.3B-Instruct-q4f16_1-MLC-1k");
  });

  test("should initialize with Llama-3.2-10B-Instruct-q4f16_1-MLC model", async () => {
    const selectedModel = "Llama-3.2-10B-Instruct-q4f16_1-MLC";
    await initWebLLM(selectedModel);
    expect(engine).toBeDefined();
    expect(engine.model_id).toBe("Llama-3.2-10B-Instruct-q4f16_1-MLC-1k");
  });
});
