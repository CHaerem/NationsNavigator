// Utility functions for error handling, network detection, and retry mechanisms

export function isOnline() {
	return navigator.onLine;
}

export function addNetworkListeners(callback) {
	window.addEventListener('online', () => callback(true));
	window.addEventListener('offline', () => callback(false));
}

export async function retryOperation(operation, maxRetries = 3, delay = 1000) {
	let lastError;
	
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			console.warn(`Attempt ${attempt} failed:`, error.message);
			
			if (attempt < maxRetries) {
				// Exponential backoff
				const waitTime = delay * Math.pow(2, attempt - 1);
				await new Promise(resolve => setTimeout(resolve, waitTime));
			}
		}
	}
	
	throw new Error(`Operation failed after ${maxRetries} attempts: ${lastError.message}`);
}

export function createRetryButton(onRetry, text = "Retry") {
	return `<button onclick="(${onRetry.toString()})()" style="
		background-color: var(--primary-color);
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 10px;
		font-size: 13px;
	">${text}</button>`;
}

export function formatError(error, context = "") {
	let message = context ? `${context}: ` : "";
	
	if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
		message += "Network connection issue. Please check your internet connection.";
	} else if (error.message.includes('timeout')) {
		message += "Request timed out. The server may be busy.";
	} else if (error.message.includes('parse') || error.message.includes('JSON')) {
		message += "Data format error. The response was not in the expected format.";
	} else {
		message += error.message;
	}
	
	return message;
}

export function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// Simple cache implementation for query results
export class QueryCache {
	constructor(maxSize = 50, ttl = 5 * 60 * 1000) { // 5 minutes TTL
		this.cache = new Map();
		this.maxSize = maxSize;
		this.ttl = ttl;
	}
	
	get(key) {
		const item = this.cache.get(key);
		if (!item) return null;
		
		if (Date.now() - item.timestamp > this.ttl) {
			this.cache.delete(key);
			return null;
		}
		
		return item.value;
	}
	
	set(key, value) {
		if (this.cache.size >= this.maxSize) {
			// Remove oldest entry
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}
		
		this.cache.set(key, {
			value,
			timestamp: Date.now()
		});
	}
	
	clear() {
		this.cache.clear();
	}
	
	size() {
		return this.cache.size;
	}
}

// Performance monitoring utilities
export class PerformanceMonitor {
	constructor() {
		this.metrics = new Map();
	}
	
	start(label) {
		this.metrics.set(label, {
			startTime: performance.now(),
			endTime: null,
			duration: null
		});
	}
	
	end(label) {
		const metric = this.metrics.get(label);
		if (metric) {
			metric.endTime = performance.now();
			metric.duration = metric.endTime - metric.startTime;
		}
		return metric?.duration || 0;
	}
	
	getMetric(label) {
		return this.metrics.get(label);
	}
	
	getAllMetrics() {
		return Array.from(this.metrics.entries()).map(([label, data]) => ({
			label,
			...data
		}));
	}
	
	clear() {
		this.metrics.clear();
	}
}