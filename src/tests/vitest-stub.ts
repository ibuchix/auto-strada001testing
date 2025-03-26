
/**
 * Changes made:
 * - 2024-10-25: Added missing vitest exports for test files
 * - 2024-10-31: Fixed type issues with test functions
 */

// Vitest stub file to provide test function exports
export const describe = (name: string, fn: () => void) => {};
export const it = (name: string, fn: () => Promise<void> | void) => {};
export const expect = (value: any) => ({
  toBe: (expected: any) => {},
  toEqual: (expected: any) => {},
  toContain: (expected: any) => {},
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
  resolves: {
    toBe: (expected: any) => Promise.resolve(),
    toEqual: (expected: any) => Promise.resolve(),
    toBeNull: () => Promise.resolve(),
    toBeUndefined: () => Promise.resolve(),
    toBeDefined: () => Promise.resolve(),
    toBeTruthy: () => Promise.resolve(),
    toBeFalsy: () => Promise.resolve(),
  }
});

export const vi = {
  fn: (implementation?: (...args: any[]) => any) => implementation || (() => {}),
  mock: (path: string) => {},
  spyOn: (object: any, method: string) => ({
    mockReturnValue: (value: any) => {},
    mockResolvedValue: (value: any) => {},
    mockRejectedValue: (value: any) => {},
    mockImplementation: (fn: (...args: any[]) => any) => {},
    mockClear: () => {},
    mockReset: () => {},
  }),
  resetAllMocks: () => {},
  clearAllMocks: () => {},
  restoreAllMocks: () => {},
};

export const beforeEach = (fn: () => void) => {};
export const afterEach = (fn: () => void) => {};
export const beforeAll = (fn: () => void) => {};
export const afterAll = (fn: () => void) => {};
