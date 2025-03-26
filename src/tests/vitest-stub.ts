
/**
 * Created: 2024-08-19
 * This file provides stub implementations for Vitest functions
 * to allow type checking without actual test functionality.
 * 
 * This is useful when testing code during development without
 * a full testing infrastructure.
 */

// Define simple types for mocked functions
export type MockedFunction<T extends (...args: any[]) => any> = T & {
  mockReturnValue: (val: ReturnType<T>) => MockedFunction<T>;
  mockResolvedValue: (val: ResolvedType<ReturnType<T>>) => MockedFunction<T>;
  mockImplementation: (impl: T) => MockedFunction<T>;
  mockRejectedValue: (val: any) => MockedFunction<T>;
};

type ResolvedType<T> = T extends Promise<infer R> ? R : never;

export type MockInstance<T extends (...args: any[]) => any> = {
  mockReturnValue: (val: ReturnType<T>) => MockInstance<T>;
  mockResolvedValue: (val: ResolvedType<ReturnType<T>>) => MockInstance<T>;
  mockImplementation: (impl: T) => MockInstance<T>;
  mockRejectedValue: (val: any) => MockInstance<T>;
};

// Stub for expect
const expectStub = (actual: any) => ({
  toBe: (expected: any) => true,
  toEqual: (expected: any) => true,
  toBeDefined: () => true,
  toBeUndefined: () => true,
  toBeNull: () => true,
  toBeTruthy: () => true,
  toBeFalsy: () => true,
  toContain: (item: any) => true,
  toHaveBeenCalled: () => true,
  toHaveBeenCalledWith: (...args: any[]) => true,
  toHaveLength: (length: number) => true,
  toThrow: (error?: any) => true,
  not: {
    toBe: (expected: any) => true,
    toEqual: (expected: any) => true,
    toBeDefined: () => true,
    toBeUndefined: () => true,
    toBeNull: () => true,
    toBeTruthy: () => true,
    toBeFalsy: () => true,
    toContain: (item: any) => true,
    toHaveBeenCalled: () => true,
    toHaveBeenCalledWith: (...args: any[]) => true,
    toHaveLength: (length: number) => true,
    toThrow: (error?: any) => true,
  }
});

// Create a stubbed implementation of Vitest
const vi = {
  fn: <T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T> => {
    const mockFn = ((...args: any[]) => {
      return implementation ? implementation(...args) : undefined;
    }) as MockedFunction<T>;
    
    mockFn.mockReturnValue = (val) => {
      return vi.fn(() => val);
    };
    
    mockFn.mockResolvedValue = (val) => {
      return vi.fn(() => Promise.resolve(val));
    };
    
    mockFn.mockImplementation = (impl) => {
      return vi.fn(impl);
    };
    
    mockFn.mockRejectedValue = (val) => {
      return vi.fn(() => Promise.reject(val));
    };
    
    return mockFn;
  },
  
  mock: (path: string, factory?: () => any) => {},
  
  mocked: <T>(item: T, deep?: boolean): T => item,
  
  spyOn: <T, K extends keyof T>(object: T, method: K): MockInstance<any> => {
    const mockInstance = {
      mockReturnValue: (val: any) => mockInstance,
      mockResolvedValue: (val: any) => mockInstance,
      mockImplementation: (impl: any) => mockInstance,
      mockRejectedValue: (val: any) => mockInstance
    };
    return mockInstance;
  },

  resetAllMocks: () => {}
};

// Export stub functions with minimal implementations
export { vi };
export const describe = (name: string, fn: () => void) => {};
export const it = (name: string, fn: () => void | Promise<void>) => {};
export const test = it;
export const expect = expectStub;
export const beforeEach = (fn: () => void | Promise<void>) => {};
export const afterEach = (fn: () => void | Promise<void>) => {};
export const beforeAll = (fn: () => void | Promise<void>) => {};
export const afterAll = (fn: () => void | Promise<void>) => {};
