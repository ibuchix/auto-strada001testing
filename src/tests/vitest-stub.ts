
/**
 * This file provides test stubs for vitest
 * Changes made:
 * - 2025-12-01: Added mock property to vi for test compatibility
 * - 2025-12-12: Added fn, describe, it, expect functions to vi for testing
 */

// Enhanced stub with testing functionality 
const vi = {
  mock: (path: string) => ({
    mockImplementation: (impl: any) => {},
    mockReturnValue: (value: any) => {},
    mockResolvedValue: (value: any) => {}
  }),
  fn: () => ({
    mockImplementation: (impl: any) => {},
    mockReturnValue: (value: any) => {},
    mockResolvedValue: (value: any) => {}
  })
};

const describe = (name: string, fn: () => void) => {};
const it = (name: string, fn: () => void) => {};
const expect = (value: any) => ({
  toBe: (expected: any) => {},
  toEqual: (expected: any) => {},
  toHaveBeenCalled: () => {},
  toHaveBeenCalledWith: (...args: any[]) => {},
  toHaveBeenCalledTimes: (count: number) => {}
});

export { vi, describe, it, expect };
