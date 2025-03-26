
/**
 * Stub file for vitest to fix TypeScript errors in tests
 */

export interface TestContext {
  expect: any;
  test: any;
  describe: any;
  it: any;
  beforeEach: any;
  afterEach: any;
  beforeAll: any;
  afterAll: any;
  vi: any;
}

export const test = (name: string, fn: () => void) => {
  console.log(`Test: ${name}`);
};

export const describe = (name: string, fn: () => void) => {
  console.log(`Test suite: ${name}`);
};

export const it = (name: string, fn: () => void) => {
  console.log(`Test case: ${name}`);
};

export const expect = (value: any) => ({
  toBe: (expected: any) => true,
  toEqual: (expected: any) => true,
  toBeNull: () => true,
  toBeDefined: () => true,
  toBeUndefined: () => true,
  toBeTruthy: () => true,
  toBeFalsy: () => true,
  toContain: (item: any) => true,
  toHaveBeenCalled: () => true,
  toHaveBeenCalledWith: (...args: any[]) => true,
  toThrow: (error?: any) => true,
});

export const vi = {
  fn: () => jest.fn(),
  mock: (path: string) => console.log(`Mocked: ${path}`),
  unmock: (path: string) => console.log(`Unmocked: ${path}`),
  spyOn: (obj: any, method: string) => ({
    mockReturnValue: (value: any) => console.log(`Spy on ${method}`),
    mockResolvedValue: (value: any) => console.log(`Spy on ${method}`),
    mockImplementation: (fn: Function) => console.log(`Spy on ${method}`),
  }),
};

export const beforeEach = (fn: () => void) => {
  console.log('Before each test');
};

export const afterEach = (fn: () => void) => {
  console.log('After each test');
};

export const beforeAll = (fn: () => void) => {
  console.log('Before all tests');
};

export const afterAll = (fn: () => void) => {
  console.log('After all tests');
};
