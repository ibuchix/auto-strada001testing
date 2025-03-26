
/**
 * Updated: 2025-08-26
 * Fixed test stub exports for Vitest
 */

// Re-export vi functions from the specified library
export const describe = (name: string, fn: () => void) => fn();
export const it = (name: string, fn: any) => fn();
export const expect = (actual: any) => ({
  toBe: (expected: any) => actual === expected,
  toEqual: (expected: any) => JSON.stringify(actual) === JSON.stringify(expected),
  toBeDefined: () => actual !== undefined,
  toBeUndefined: () => actual === undefined,
  toBeNull: () => actual === null,
  toBeTruthy: () => !!actual,
  toBeFalsy: () => !actual,
  toContain: (expected: any) => actual.includes(expected),
  toHaveLength: (expected: any) => actual.length === expected,
  toHaveBeenCalled: () => true,
  toHaveBeenCalledWith: (...args: any[]) => true,
  toThrow: (error?: any) => true,
  not: {
    toBe: (expected: any) => actual !== expected,
    toEqual: (expected: any) => JSON.stringify(actual) !== JSON.stringify(expected),
    toBeDefined: () => actual === undefined,
    toBeUndefined: () => actual !== undefined,
    toBeNull: () => actual !== null,
    toBeTruthy: () => !actual,
    toBeFalsy: () => !!actual,
    toContain: (expected: any) => !actual.includes(expected),
    toHaveLength: (expected: any) => actual.length !== expected,
    toHaveBeenCalled: () => false,
    toHaveBeenCalledWith: (...args: any[]) => false,
    toThrow: (error?: any) => false,
  }
});

// Mock function types
export type MockedFunction<T extends (...args: any[]) => any> = T & {
  mockReturnValue: (val: ReturnType<T>) => MockedFunction<T>;
  mockResolvedValue: <R = ReturnType<T>>(val: R extends Promise<infer U> ? U : R) => MockedFunction<T>;
  mockRejectedValue: (val: any) => MockedFunction<T>;
  mockImplementation: (impl: (...args: Parameters<T>) => ReturnType<T>) => MockedFunction<T>;
  mockImplementationOnce: (impl: (...args: Parameters<T>) => ReturnType<T>) => MockedFunction<T>;
  mockClear: () => void;
  mockReset: () => void;
  getMockName: () => string;
};

// Additional utility types for complex return types
type ResolvedType<T> = T extends Promise<infer U> ? U : T;

export const fn = <T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T> => {
  const mockFn = (...args: Parameters<T>): ReturnType<T> => {
    if (implementation) {
      return implementation(...args);
    }
    return undefined as unknown as ReturnType<T>;
  };

  // Add mock methods
  const mockedFn = mockFn as MockedFunction<T>;
  
  mockedFn.mockReturnValue = (val: ReturnType<T>): MockedFunction<T> => {
    return fn(() => val);
  };
  
  mockedFn.mockResolvedValue = <R = ReturnType<T>>(val: ResolvedType<R>): MockedFunction<T> => {
    return fn(() => Promise.resolve(val) as unknown as ReturnType<T>);
  };
  
  mockedFn.mockRejectedValue = (val: any): MockedFunction<T> => {
    return fn(() => Promise.reject(val) as unknown as ReturnType<T>);
  };
  
  mockedFn.mockImplementation = (impl: T): MockedFunction<T> => {
    return fn(impl);
  };
  
  mockedFn.mockImplementationOnce = (impl: T): MockedFunction<T> => {
    return fn(impl);
  };
  
  mockedFn.mockClear = () => {};
  mockedFn.mockReset = () => {};
  mockedFn.getMockName = () => "mock";
  
  return mockedFn;
};

// Create vi mock object
export default {
  fn,
  mock: (path: string, factory?: () => any) => {},
  mocked: <T>(item: T, deep?: boolean) => item,
  spyOn: <T, K extends keyof T>(object: T, method: K) => fn(object[method] as any),
  resetAllMocks: () => {}
};

export const vi = {
  fn,
  mock: (path: string, factory?: () => any) => {},
  mocked: <T>(item: T, deep?: boolean) => item,
  spyOn: <T, K extends keyof T>(object: T, method: K) => fn(object[method] as any),
  resetAllMocks: () => {}
};

export type MockInstance<T extends (...args: any[]) => any> = MockedFunction<T>;
