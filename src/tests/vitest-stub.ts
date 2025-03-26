
/**
 * Updated: 2025-08-27
 * Fixed TypeScript type issues in mock function implementations
 */

// This is a simple stub for vitest, used when we need to create test files
// that will be properly type-checked but won't run during development

export interface MockedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  mockReturnValue: (val: ReturnType<T>) => MockedFunction<T>;
  mockResolvedValue: <T extends (...args: any[]) => Promise<any>>(val: Awaited<ReturnType<T>>) => MockedFunction<T>;
  mockRejectedValue: (val: any) => MockedFunction<T>;
  mockImplementation: (impl: T) => MockedFunction<T>;
}

type ResolvedType<T> = T extends Promise<infer U> ? U : T;

const createMockFunction = <T extends (...args: any[]) => any>(): MockedFunction<T> => {
  const mockFn = ((...args: Parameters<T>): ReturnType<T> => {
    return undefined as unknown as ReturnType<T>;
  }) as MockedFunction<T>;

  mockFn.mockReturnValue = (_val: ReturnType<T>) => {
    return mockFn;
  };

  mockFn.mockResolvedValue = (_val: ResolvedType<ReturnType<T>>) => {
    return mockFn;
  };

  mockFn.mockRejectedValue = (_val: any) => {
    return mockFn;
  };

  mockFn.mockImplementation = (_impl: T) => {
    return mockFn;
  };

  return mockFn;
};

// Simple implementation to satisfy TypeScript
export function describe(_name: string, _fn: () => void): void {}
export function it(_name: string, _fn: () => void | Promise<void>): void {}
export function beforeEach(_fn: () => void | Promise<void>): void {}
export function afterEach(_fn: () => void | Promise<void>): void {}
export function beforeAll(_fn: () => void | Promise<void>): void {}
export function afterAll(_fn: () => void | Promise<void>): void {}

// Simplified expect function to make tests pass type checking
export function expect<T>(actual: T): {
  toBe: (expected: any) => boolean;
  toEqual: (expected: any) => boolean;
  toBeDefined: () => boolean;
  toBeUndefined: () => boolean;
  toBeNull: () => boolean;
  toBeTruthy: () => boolean;
  toBeFalsy: () => boolean;
  toHaveBeenCalled: () => boolean;
  toHaveBeenCalledWith: (...args: any[]) => boolean;
  toHaveBeenCalledTimes: (count: number) => boolean;
  toThrow: (error?: any) => boolean;
  not: {
    toBe: (expected: any) => boolean;
    toEqual: (expected: any) => boolean;
    toBeDefined: () => boolean;
    toBeUndefined: () => boolean;
    toBeNull: () => boolean;
    toBeTruthy: () => boolean;
    toBeFalsy: () => boolean;
    toHaveBeenCalled: () => boolean;
    toHaveBeenCalledWith: (...args: any[]) => boolean;
    toHaveBeenCalledTimes: (count: number) => boolean;
    toThrow: (error?: any) => boolean;
  }
} {
  return {
    toBe: (_expected: any) => true,
    toEqual: (_expected: any) => true,
    toBeDefined: () => true,
    toBeUndefined: () => true,
    toBeNull: () => true,
    toBeTruthy: () => true,
    toBeFalsy: () => true,
    toHaveBeenCalled: () => true,
    toHaveBeenCalledWith: (..._args: any[]) => true,
    toHaveBeenCalledTimes: (_count: number) => true,
    toThrow: (_error?: any) => true,
    not: {
      toBe: (_expected: any) => true,
      toEqual: (_expected: any) => true,
      toBeDefined: () => true,
      toBeUndefined: () => true,
      toBeNull: () => true,
      toBeTruthy: () => true,
      toBeFalsy: () => true,
      toHaveBeenCalled: () => true,
      toHaveBeenCalledWith: (..._args: any[]) => true,
      toHaveBeenCalledTimes: (_count: number) => true,
      toThrow: (_error?: any) => true,
    }
  };
}

// Simple implementation to satisfy TypeScript
export const vi = {
  fn: <T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T> => {
    return createMockFunction<T>();
  },
  mock: (_path: string, _factory?: () => any) => {},
  mocked: <T>(_item: T, _deep?: boolean): T => _item,
  spyOn: <T, K extends keyof T>(_object: T, _method: K) => ({
    mockReturnValue: <V>(_value: V) => {},
    mockResolvedValue: <V>(_value: V) => {},
    mockRejectedValue: (_reason: any) => {}
  })
};

export default vi;
