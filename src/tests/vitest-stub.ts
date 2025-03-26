
/**
 * This file provides test stubs for vitest
 * Changes made:
 * - 2025-12-01: Added mock property to vi for test compatibility
 */

// Empty stub (for now) - will be expanded as needed
const vi = {
  mock: (path: string) => ({
    mockImplementation: (impl: any) => {},
    mockReturnValue: (value: any) => {},
    mockResolvedValue: (value: any) => {}
  })
};

export { vi };
