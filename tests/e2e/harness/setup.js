/**
 * tests/e2e/harness/setup.js
 * Browser environment emulation and test harness for headless Node.js test execution.
 */

class MockStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(String(key)) ? this.store.get(String(key)) : null;
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }

  removeItem(key) {
    this.store.delete(String(key));
  }

  clear() {
    this.store.clear();
  }

  key(index) {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  get length() {
    return this.store.size;
  }
}

// Polyfill global browser objects if missing in Node.js
if (!globalThis.localStorage) {
  globalThis.localStorage = new MockStorage();
}

if (!globalThis.sessionStorage) {
  globalThis.sessionStorage = new MockStorage();
}

if (!globalThis.window) {
  globalThis.window = globalThis;
}

if (!globalThis.document) {
  globalThis.document = {
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      setAttribute: () => {},
      getAttribute: () => null,
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      appendChild: () => {},
      removeChild: () => {},
    }),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: {
      appendChild: () => {},
      removeChild: () => {},
      style: {},
    },
  };
}

if (!globalThis.navigator) {
  globalThis.navigator = {
    userAgent: 'Node.js/Test-Runner (SchoolERP-E2E)',
  };
}

/**
 * Resets mocked storage and global test state.
 */
export function resetStorage() {
  if (globalThis.localStorage && typeof globalThis.localStorage.clear === 'function') {
    globalThis.localStorage.clear();
  }
  if (globalThis.sessionStorage && typeof globalThis.sessionStorage.clear === 'function') {
    globalThis.sessionStorage.clear();
  }
}

export { MockStorage };
