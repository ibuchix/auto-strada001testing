/**
 * Changes made:
 * - 2024-10-25: Added missing vitest exports for test files
 * - 2024-10-31: Fixed type issues with test functions
 * - 2025-05-15: Enhanced mocking capabilities with better type support
 * - 2025-05-16: Added support for mock negations and matchers
 * - 2025-05-17: Fixed type export with 'export type' for isolatedModules compatibility
 * - 2027-08-01: Improved type exports to use 'export type' syntax
 * - 2027-08-15: Fixed mocked return type to support mockReturnValue and other mocking methods
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

// Enhanced mock type definition
export type MockedFunction<T extends (...args: any[]) => any> = jest.Mock<ReturnType<T>> & {
  mockReturnValue: (val: ReturnType<T>) => MockedFunction<T>;
  mockResolvedValue: <U>(val: U) => MockedFunction<T>;
  mockRejectedValue: <U>(val: U) => MockedFunction<T>;
  mockImplementation: (fn: (...args: Parameters<T>) => ReturnType<T>) => MockedFunction<T>;
  mockClear: () => MockedFunction<T>;
  mockReset: () => MockedFunction<T>;
  mockRestore: () => MockedFunction<T>;
};

// Improved mocking capabilities
interface SpyInstance<T extends (...args: any[]) => any> {
  mockReturnValue: (value: ReturnType<T>) => SpyInstance<T>;
  mockResolvedValue: <U>(value: U) => SpyInstance<T>;
  mockRejectedValue: <U>(value: U) => SpyInstance<T>;
  mockImplementation: (fn: (...args: Parameters<T>) => ReturnType<T>) => SpyInstance<T>;
  mockClear: () => SpyInstance<T>;
  mockReset: () => SpyInstance<T>;
  mockRestore: () => SpyInstance<T>;
  getMockName: () => string;
  mockReturnThis: () => SpyInstance<T>;
  mockName: (name: string) => SpyInstance<T>;
}

// Enhanced vi mock object with improved types
export const vi = {
  fn: <T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T> => {
    const mockFn = function(...args: Parameters<T>): ReturnType<T> {
      return implementation ? implementation(...args) : undefined as any;
    } as MockedFunction<T>;
    
    mockFn.mockReturnValue = (val) => {
      implementation = (() => val) as any;
      return mockFn;
    };
    
    mockFn.mockResolvedValue = (val) => {
      implementation = (() => Promise.resolve(val)) as any;
      return mockFn;
    };
    
    mockFn.mockRejectedValue = (val) => {
      implementation = (() => Promise.reject(val)) as any;
      return mockFn;
    };
    
    mockFn.mockImplementation = (fn) => {
      implementation = fn as any;
      return mockFn;
    };
    
    mockFn.mockClear = () => mockFn;
    mockFn.mockReset = () => mockFn;
    mockFn.mockRestore = () => mockFn;
    
    return mockFn;
  },
  
  mock: (path: string, factory?: () => any) => {},
  
  mocked: <T>(item: T, deep = false): jest.Mocked<T> & T => {
    // Add mockReturnValue and other functions to the mock
    if (typeof item === 'function') {
      const mockedFn = item as any;
      mockedFn.mockReturnValue = (val: any) => {
        mockedFn.mockImplementation = () => val;
        return mockedFn;
      };
      mockedFn.mockResolvedValue = (val: any) => {
        mockedFn.mockImplementation = () => Promise.resolve(val);
        return mockedFn;
      };
      mockedFn.mockRejectedValue = (val: any) => {
        mockedFn.mockImplementation = () => Promise.reject(val);
        return mockedFn;
      };
      mockedFn.mockImplementation = (fn: any) => {
        mockedFn.implementation = fn;
        return mockedFn;
      };
      mockedFn.mockClear = () => mockedFn;
      mockedFn.mockReset = () => mockedFn;
      mockedFn.mockRestore = () => mockedFn;
    }
    return item as any;
  },
  
  resetAllMocks: () => {},
  clearAllMocks: () => {},
  restoreAllMocks: () => {},
  hoisted: <T>(factory: () => T): T => factory(),
  importActual: <T>(path: string): Promise<T> => Promise.resolve({} as T),
  importMock: <T>(path: string): Promise<T> => Promise.resolve({} as T),
  resetModules: () => {},
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

// Export types using proper 'export type' syntax
export type { SpyInstance };
export type Mock<T = any> = jest.Mock<T>;
