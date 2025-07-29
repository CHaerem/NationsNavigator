// Centralized model configuration
export const MODEL_CONFIGS = {
	"Llama-3.1-8B-Instruct-q4f16_1-MLC": {
		model_id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
		size_mb: 5100, // ~5.1 GB
		description: "Llama-3.1-8B 💪 (Most Powerful)",
	},
	"Llama-3.2-3B-Instruct-q4f16_1-MLC": {
		model_id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
		size_mb: 1800, // ~1.8 GB
		description: "Llama-3.2-3B 🧠 (Balanced)",
	},
	"Llama-3.2-1B-Instruct-q4f16_1-MLC": {
		model_id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
		size_mb: 650, // ~650 MB
		description: "Llama-3.2-1B ⚡ (Fastest)",
	},
	"Qwen2.5-1.5B-Instruct-q4f16_1-MLC": {
		model_id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
		context_window_size: 2048,
		size_mb: 950, // ~950 MB
		description: "Qwen2.5-1.5B 🚀 (Efficient)",
	},
};

export const DEFAULT_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

// Hardware recommendation logic
export class HardwareRecommendation {
	static detectCapabilities() {
		const hardware = {
			ram: 'unknown',
			cores: 'unknown',
			connection: 'unknown',
			gpu: 'unknown'
		};

		try {
			// Detect hardware cores
			if (navigator.hardwareConcurrency) {
				hardware.cores = navigator.hardwareConcurrency;
			}

			// Detect connection type
			if (navigator.connection) {
				hardware.connection = navigator.connection.effectiveType || 'unknown';
			}

			// Try to get GPU info (limited by privacy)
			const canvas = document.createElement('canvas');
			const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			if (gl) {
				const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
				if (debugInfo) {
					hardware.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
				}
			}

			// Estimate RAM (very rough approximation)
			if (navigator.deviceMemory) {
				hardware.ram = navigator.deviceMemory;
			}
		} catch (error) {
			console.warn('Hardware detection limited by browser privacy settings');
		}

		return hardware;
	}

	static getRecommendation(hardware) {
		const strengths = [];
		const limitations = [];
		let recommendedModel = DEFAULT_MODEL;
		let confidence = 'medium';
		let reason = 'Safe default choice for most devices';

		// Analyze RAM
		if (hardware.ram !== 'unknown') {
			if (hardware.ram >= 8) {
				strengths.push('Good RAM (8GB+)');
				recommendedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC";
				reason = 'Your device has sufficient RAM for the balanced 3B model';
				confidence = 'high';
			} else if (hardware.ram >= 4) {
				strengths.push('Adequate RAM (4-8GB)');
				recommendedModel = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";
				reason = 'Efficient model recommended for your RAM capacity';
			} else {
				limitations.push('Limited RAM (<4GB)');
				recommendedModel = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
				reason = 'Lightweight model recommended for your device';
			}
		}

		// Analyze CPU cores
		if (hardware.cores !== 'unknown') {
			if (hardware.cores >= 8) {
				strengths.push('Multi-core CPU (8+ cores)');
			} else if (hardware.cores >= 4) {
				strengths.push('Quad-core CPU');
			} else {
				limitations.push('Limited CPU cores');
			}
		}

		// Analyze connection
		if (hardware.connection !== 'unknown') {
			if (['4g', '5g'].includes(hardware.connection)) {
				strengths.push('Fast mobile connection');
			} else if (hardware.connection === '3g') {
				limitations.push('Slow connection (3G)');
			}
		}

		// GPU analysis
		if (hardware.gpu !== 'unknown') {
			if (hardware.gpu.toLowerCase().includes('nvidia') || 
				hardware.gpu.toLowerCase().includes('amd') ||
				hardware.gpu.toLowerCase().includes('intel')) {
				strengths.push('Dedicated/integrated GPU');
			}
		}

		return {
			modelId: recommendedModel,
			confidence,
			reason,
			strengths,
			limitations
		};
	}
}