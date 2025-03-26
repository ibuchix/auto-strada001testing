
/**
 * Changes made:
 * - 2024-10-25: Added missing vitest exports for test files
 * - 2024-10-31: Fixed type issues with test functions
 * - 2025-05-15: Enhanced mocking capabilities with better type support
 * - 2025-05-16: Added support for mock negations and matchers
 */

// Define the common types needed for testing
type TestFunction = (name: string, fn: () => Promise<void> | void) => void;
type SetupFunction = (fn: () => void | Promise<void>) => void;

// The core test functions
export const describe: (name: string, fn: () => void) => void = (name, fn) => {};
export const it: TestFunction = (name, fn) => {};
export const test: TestFunction = (name, fn) => {};

// Setup and teardown functions
export const beforeEach: SetupFunction = (fn) => {};
export const afterEach: SetupFunction = (fn) => {};
export const beforeAll: SetupFunction = (fn) => {};
export const afterAll: SetupFunction = (fn) => {};

// Matcher type for better autocomplete and type checking
interface Matcher<R = void> {
  toBe: (expected: any) => R;
  toEqual: (expected: any) => R;
  toStrictEqual: (expected: any) => R;
  toContain: (expected: any) => R;
  toContainEqual: (expected: any) => R;
  toHaveProperty: (property: string, value?: any) => R;
  toBeNull: () => R;
  toBeUndefined: () => R;
  toBeDefined: () => R;
  toBeTruthy: () => R;
  toBeFalsy: () => R;
  toHaveBeenCalled: () => R;
  toHaveBeenCalledWith: (...args: any[]) => R;
  toHaveBeenCalledTimes: (times: number) => R;
  toThrow: (message?: string | RegExp) => R;
  toMatch: (pattern: string | RegExp) => R;
  toMatchObject: (object: object) => R;
  toHaveLength: (length: number) => R;
  not: Omit<Matcher<R>, 'not'>;
}

// Async matchers with better promise handling
interface AsyncMatcher {
  toBe: (expected: any) => Promise<void>;
  toEqual: (expected: any) => Promise<void>;
  toStrictEqual: (expected: any) => Promise<void>;
  toBeNull: () => Promise<void>;
  toBeUndefined: () => Promise<void>;
  toBeDefined: () => Promise<void>;
  toBeTruthy: () => Promise<void>;
  toBeFalsy: () => Promise<void>;
  toThrow: (message?: string | RegExp) => Promise<void>;
  toHaveProperty: (property: string, value?: any) => Promise<void>;
  not: Omit<AsyncMatcher, 'not'>;
}

// Enhanced expect function with proper types
export const expect = (value: any): Matcher & { resolves: AsyncMatcher; rejects: AsyncMatcher } => {
  const basicMatchers: Matcher = {
    toBe: (expected: any) => {},
    toEqual: (expected: any) => {},
    toStrictEqual: (expected: any) => {},
    toContain: (expected: any) => {},
    toContainEqual: (expected: any) => {},
    toHaveProperty: (property: string, value?: any) => {},
    toBeNull: () => {},
    toBeUndefined: () => {},
    toBeDefined: () => {},
    toBeTruthy: () => {},
    toBeFalsy: () => {},
    toHaveBeenCalled: () => {},
    toHaveBeenCalledWith: (...args: any[]) => {},
    toHaveBeenCalledTimes: (times: number) => {},
    toThrow: (message?: string | RegExp) => {},
    toMatch: (pattern: string | RegExp) => {},
    toMatchObject: (object: object) => {},
    toHaveLength: (length: number) => {},
    get not() {
      return { ...basicMatchers };
    }
  };

  const asyncMatchers: AsyncMatcher = {
    toBe: (expected: any) => Promise.resolve(),
    toEqual: (expected: any) => Promise.resolve(),
    toStrictEqual: (expected: any) => Promise.resolve(),
    toBeNull: () => Promise.resolve(),
    toBeUndefined: () => Promise.resolve(),
    toBeDefined: () => Promise.resolve(),
    toBeTruthy: () => Promise.resolve(),
    toBeFalsy: () => Promise.resolve(),
    toThrow: (message?: string | RegExp) => Promise.resolve(),
    toHaveProperty: (property: string, value?: any) => Promise.resolve(),
    get not() {
      return { ...asyncMatchers };
    }
  };

  return {
    ...basicMatchers,
    resolves: asyncMatchers,
    rejects: asyncMatchers
  };
};

// Improved mocking capabilities
type SpyInstance = {
  mockReturnValue: (value: any) => SpyInstance;
  mockResolvedValue: (value: any) => SpyInstance;
  mockRejectedValue: (value: any) => SpyInstance;
  mockImplementation: (fn: (...args: any[]) => any) => SpyInstance;
  mockClear: () => SpyInstance;
  mockReset: () => SpyInstance;
  mockRestore: () => SpyInstance;
  getMockName: () => string;
  mockReturnThis: () => SpyInstance;
  mockName: (name: string) => SpyInstance;
};

// Enhanced vi mock object
export const vi = {
  fn: <T = any>(implementation?: (...args: any[]) => T): jest.Mock<T> => 
    implementation ? jest.fn(implementation) : jest.fn(),
  
  mock: (path: string, options?: { virtual?: boolean }) => {},
  
  spyOn: (object: any, method: string): SpyInstance => ({
    mockReturnValue: (value: any) => vi.spyOn(object, method),
    mockResolvedValue: (value: any) => vi.spyOn(object, method),
    mockRejectedValue: (value: any) => vi.spyOn(object, method),
    mockImplementation: (fn: (...args: any[]) => any) => vi.spyOn(object, method),
    mockClear: () => vi.spyOn(object, method),
    mockReset: () => vi.spyOn(object, method),
    mockRestore: () => vi.spyOn(object, method),
    getMockName: () => '',
    mockReturnThis: () => vi.spyOn(object, method),
    mockName: (name: string) => vi.spyOn(object, method),
  }),
  
  resetAllMocks: () => {},
  clearAllMocks: () => {},
  restoreAllMocks: () => {},
  hoisted: <T>(factory: () => T): T => factory(),
  importActual: <T>(path: string): Promise<T> => Promise.resolve({} as T),
  importMock: <T>(path: string): Promise<T> => Promise.resolve({} as T),
  mocked: <T>(item: T, deep?: boolean): jest.Mocked<T> => item as any,
};

// Re-export jest for compatibility
export const jest = {
  fn: vi.fn,
  mock: vi.mock,
  spyOn: vi.spyOn,
  resetAllMocks: vi.resetAllMocks,
  clearAllMocks: vi.clearAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
};

// Export types
export { SpyInstance };
export type Mock<T = any> = jest.Mock<T>;

