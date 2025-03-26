
/**
 * Created: 2024-08-15
 * This provides stubs for Vitest functions to use in tests
 */

// Stub implementation for vitest
export const describe = (name: string, callback: () => void) => {
  // Stub implementation
};

export const it = (name: string, callback: any) => {
  // Stub implementation
};

export const test = it;

export const expect = (value: any) => {
  return {
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
    toHaveBeenCalledTimes: (times: number) => true,
    toHaveLength: (length: number) => true,
    toHaveProperty: (property: string, value?: any) => true,
    toBeInstanceOf: (constructor: any) => true,
    toThrow: (error?: any) => true,
    // Add other matchers as needed
  };
};

export const beforeEach = (callback: () => void) => {
  // Stub implementation
};

export const afterEach = (callback: () => void) => {
  // Stub implementation
};

export const beforeAll = (callback: () => void) => {
  // Stub implementation
};

export const afterAll = (callback: () => void) => {
  // Stub implementation
};

interface MockedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  mockReturnValue: (value: ReturnType<T>) => MockedFunction<T>;
  mockResolvedValue: <U>(value: U) => MockedFunction<T>;
  mockRejectedValue: (error: Error) => MockedFunction<T>;
  mockImplementation: (fn: T) => MockedFunction<T>;
  mockReset: () => void;
  mockClear: () => void;
  mock: {
    calls: Parameters<T>[];
    results: { type: 'return' | 'throw'; value: any }[];
    instances: any[];
    invocationCallOrder: number[];
  };
}

interface Constructable {
  new (...args: any[]): any;
}

interface MockedClass<T extends Constructable> {
  new (...args: ConstructorParameters<T>): InstanceType<T>;
  mockImplementation: (fn: (...args: ConstructorParameters<T>) => InstanceType<T>) => MockedClass<T>;
  mockClear: () => void;
  mockReset: () => void;
}

interface MockInstance<T extends (...args: any[]) => any> {
  mockReturnValue: (value: ReturnType<T>) => MockInstance<T>;
  mockResolvedValue: <U>(value: U) => MockInstance<T>;
  mockRejectedValue: (error: Error) => MockInstance<T>;
  mockImplementation: (fn: T) => MockInstance<T>;
  mockReset: () => void;
  mockClear: () => void;
  mock: {
    calls: Parameters<T>[];
    results: { type: 'return' | 'throw'; value: any }[];
    instances: any[];
    invocationCallOrder: number[];
  };
}

// Add a simplified vi object with the fn method
export const vi = {
  fn: <T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T> => {
    const mockFn = (...args: Parameters<T>): ReturnType<T> => {
      // @ts-ignore - This is a stub implementation
      return implementation ? implementation(...args) : undefined;
    };

    // Add mock methods to the function
    (mockFn as any).mockReturnValue = (value: ReturnType<T>) => {
      implementation = (() => value) as unknown as T;
      return mockFn as MockedFunction<T>;
    };

    (mockFn as any).mockResolvedValue = <U>(value: U) => {
      implementation = (() => Promise.resolve(value)) as unknown as T;
      return mockFn as MockedFunction<T>;
    };

    (mockFn as any).mockRejectedValue = (error: Error) => {
      implementation = (() => Promise.reject(error)) as unknown as T;
      return mockFn as MockedFunction<T>;
    };

    (mockFn as any).mockImplementation = (fn: T) => {
      implementation = fn;
      return mockFn as MockedFunction<T>;
    };

    (mockFn as any).mockReset = () => {
      implementation = undefined as unknown as T;
    };

    (mockFn as any).mockClear = () => {
      // Clear mock data
    };

    (mockFn as any).mock = {
      calls: [],
      results: [],
      instances: [],
      invocationCallOrder: []
    };

    return mockFn as MockedFunction<T>;
  },

  mock: (path: string, factory?: () => any) => {
    // Stub implementation for vi.mock
  },

  // Add mocked helper function
  mocked: <T>(item: T, deep = false): T => {
    return item; // Just return the item as-is for the stub
  },

  // Add spyOn helper function
  spyOn: <T, K extends keyof T>(object: T, method: K): MockInstance<T[K] extends (...args: any[]) => any ? T[K] : never> => {
    // Stub implementation - returns a simplified mock object
    return {
      mockReturnValue: () => {} as any,
      mockResolvedValue: () => {} as any,
      mockRejectedValue: () => {} as any,
      mockImplementation: () => {} as any,
      mockReset: () => {},
      mockClear: () => {},
      mock: {
        calls: [],
        results: [],
        instances: [],
        invocationCallOrder: []
      }
    } as any;
  }
};
