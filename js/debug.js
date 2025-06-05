export const DEBUG = true;
export function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

