type CaseTransform = {
  [key: string]: any;
};

export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const transformObjectToSnakeCase = (obj: CaseTransform): CaseTransform => {
  const snakeCaseObj: CaseTransform = {};
  
  Object.keys(obj).forEach(key => {
    const snakeKey = toSnakeCase(key);
    snakeCaseObj[snakeKey] = obj[key];
  });
  
  return snakeCaseObj;
};

export const transformObjectToCamelCase = (obj: CaseTransform): CaseTransform => {
  const camelCaseObj: CaseTransform = {};
  
  Object.keys(obj).forEach(key => {
    const camelKey = toCamelCase(key);
    camelCaseObj[camelKey] = obj[key];
  });
  
  return camelCaseObj;
};