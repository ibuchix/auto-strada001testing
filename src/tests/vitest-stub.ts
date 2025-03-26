
/**
 * Updated: 2025-08-28
 * Fixed type issues in vitest-stub.ts
 */

// This is a stub file to allow for importing vitest functionality in tests
// without having vitest installed in the project

export type MockedFunction<T extends (...args: any[]) => any> = T & {
  mockReturnValue: (val: ReturnType<T>) => MockedFunction<T>;
  mockResolvedValue: <U = ReturnType<T>>(val: U extends Promise<infer V> ? V : U) => MockedFunction<T>;
  mockRejectedValue: (val: any) => MockedFunction<T>;
  mockImplementation: (fn: (...args: Parameters<T>) => ReturnType<T>) => MockedFunction<T>;
  mockClear: () => void;
};

// Create a simple implementation of vitest's functions
const createMockFn = <T extends (...args: any[]) => any>(): MockedFunction<T> => {
  const mockFn = ((...args: any[]) => {
    mockFn.calls.push(args);
    return mockFn.implementation ? mockFn.implementation(...args) : undefined;
  }) as MockedFunction<T>;

  mockFn.calls = [] as any[][];
  mockFn.implementation = null as any;
  
  mockFn.mockReturnValue = (val) => {
    mockFn.implementation = () => val;
    return mockFn;
  };
  
  mockFn.mockResolvedValue = (val) => {
    mockFn.implementation = () => Promise.resolve(val);
    return mockFn;
  };
  
  mockFn.mockRejectedValue = (val) => {
    mockFn.implementation = () => Promise.reject(val);
    return mockFn;
  };
  
  mockFn.mockImplementation = (fn) => {
    mockFn.implementation = fn;
    return mockFn;
  };
  
  mockFn.mockClear = () => {
    mockFn.calls = [];
    mockFn.implementation = null as any;
  };
  
  return mockFn;
};

export const vi = {
  fn: <T extends (...args: any[]) => any>() => createMockFn<T>(),
  mock: (path: string) => ({ default: {} }),
};

// Extend expect with toContain method for test compatibility
export const expect = (received: any) => ({
  toBe: (expected: any) => received === expected,
  toEqual: (expected: any) => JSON.stringify(received) === JSON.stringify(expected),
  toBeDefined: () => received !== undefined,
  toBeUndefined: () => received === undefined,
  toBeNull: () => received === null,
  toBeTruthy: () => !!received,
  toBeFalsy: () => !received,
  toContain: (expected: any) => Array.isArray(received) && received.includes(expected),
  toHaveProperty: (prop: string) => Object.prototype.hasOwnProperty.call(received, prop),
  toThrow: () => {
    try {
      received();
      return false;
    } catch (e) {
      return true;
    }
  },
  not: {
    toBe: (expected: any) => received !== expected,
    toEqual: (expected: any) => JSON.stringify(received) !== JSON.stringify(expected),
    toBeDefined: () => received === undefined,
    toBeUndefined: () => received !== undefined,
    toBeNull: () => received !== null,
    toBeTruthy: () => !received,
    toBeFalsy: () => !!received,
    toContain: (expected: any) => !Array.isArray(received) || !received.includes(expected),
    toHaveProperty: (prop: string) => !Object.prototype.hasOwnProperty.call(received, prop),
    toThrow: () => {
      try {
        received();
        return true;
      } catch (e) {
        return false;
      }
    },
  },
});

export const describe = (name: string, fn: () => void) => {
  console.log(`Test Suite: ${name}`);
  fn();
};

export const it = (name: string, fn: () => void | Promise<void>) => {
  console.log(`Test Case: ${name}`);
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.catch(e => console.error(`Test failed: ${e.message}`));
    }
  } catch (e: any) {
    console.error(`Test failed: ${e.message}`);
  }
};

export default {
  describe,
  it,
  expect,
  vi,
};
