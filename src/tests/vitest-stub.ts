/**
 * Created: 2025-08-25
 * Stub for Vitest testing functions
 */

// Define mock function types
interface MockedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  mockImplementation: (implementation: T) => MockedFunction<T>;
  mockReturnValue: (value: ReturnType<T>) => MockedFunction<T>;
  mockResolvedValue: <U>(value: U) => MockedFunction<T>;
  mockRejectedValue: (error: any) => MockedFunction<T>;
  calls: Parameters<T>[];
}

interface MockInstance<T extends (...args: any[]) => any> {
  calls: Parameters<T>[];
  mockImplementation: (implementation: T) => MockInstance<T>;
  mockReturnValue: (value: ReturnType<T>) => MockInstance<T>;
  mockResolvedValue: <U>(value: U) => MockInstance<T>;
  mockRejectedValue: (error: any) => MockInstance<T>;
}

// Helper for resolving nested promise types
type ResolvedType<T> = T extends Promise<infer U> ? U : T;

// Create a simple stub for vitest that can be extended
export const vi = {
  fn: <T extends (...args: any[]) => any>(implementation?: T): MockedFunction<T> => {
    const calls: Parameters<T>[] = [];
    
    const mockFn = (...args: Parameters<T>): ReturnType<T> => {
      calls.push(args);
      return implementation ? implementation(...args) : undefined as unknown as ReturnType<T>;
    };
    
    mockFn.calls = calls;
    
    mockFn.mockImplementation = (newImplementation: T): MockedFunction<T> => {
      return vi.fn(newImplementation);
    };
    
    mockFn.mockReturnValue = (returnValue: ReturnType<T>): MockedFunction<T> => {
      return vi.fn(() => returnValue as ReturnType<T>);
    };
    
    mockFn.mockResolvedValue = <U>(value: U): MockedFunction<T> => {
      return vi.fn(() => Promise.resolve(value) as unknown as ReturnType<T>);
    };
    
    mockFn.mockRejectedValue = (error: any): MockedFunction<T> => {
      return vi.fn(() => Promise.reject(error) as unknown as ReturnType<T>);
    };
    
    return mockFn;
  },
  
  mock: (path: string, factory?: () => any) => {
    // Simple implementation that does nothing
    console.log(`Mocking ${path}`);
  },
  
  mocked: <T>(item: T, deep?: boolean): T => {
    // Simply return the item as it comes to keep TypeScript happy
    return item;
  },
  
  spyOn: <T, K extends keyof T>(object: T, method: K): MockInstance<T[K] extends (...args: any[]) => any ? T[K] : never> => {
    const original = object[method];
    const calls: any[] = [];
    
    const spy = {
      calls,
      mockImplementation: (implementation: any) => {
        // @ts-ignore - type complexity
        object[method] = implementation;
        return spy;
      },
      mockReturnValue: (value: any) => {
        // @ts-ignore - type complexity
        object[method] = () => value;
        return spy;
      },
      mockResolvedValue: <U>(value: U) => {
        // @ts-ignore - type complexity
        object[method] = () => Promise.resolve(value);
        return spy;
      },
      mockRejectedValue: (error: any) => {
        // @ts-ignore - type complexity
        object[method] = () => Promise.reject(error);
        return spy;
      }
    };
    
    // @ts-ignore - type complexity
    object[method] = (...args: any[]) => {
      calls.push(args);
      // @ts-ignore - type complexity
      return original.apply(object, args);
    };
    
    return spy as any;
  },
  
  // Add a mock implementation of resetAllMocks
  resetAllMocks: () => {
    console.log('Mock reset');
    // This is a stub implementation that doesn't actually reset anything
  }
};

export default vi;
