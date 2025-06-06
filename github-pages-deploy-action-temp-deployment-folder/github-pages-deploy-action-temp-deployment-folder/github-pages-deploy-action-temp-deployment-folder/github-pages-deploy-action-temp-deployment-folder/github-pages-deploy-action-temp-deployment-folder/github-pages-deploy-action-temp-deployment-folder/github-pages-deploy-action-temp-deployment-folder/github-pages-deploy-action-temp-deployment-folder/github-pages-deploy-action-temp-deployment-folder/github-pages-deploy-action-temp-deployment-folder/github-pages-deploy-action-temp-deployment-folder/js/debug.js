export const DEBUG = true;
export function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

export function debugTime(label) {
  if (DEBUG) {
    console.time(label);
  }
}

export function debugTimeEnd(label) {
  if (DEBUG) {
    console.timeEnd(label);
  }
}

