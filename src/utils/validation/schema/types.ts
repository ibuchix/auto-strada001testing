
/**
 * Types for schema validation
 * Created: 2025-04-19 - Split from schemaValidation.ts
 */

export type ColumnDefinition = {
  name: string;
  type: string;
  isNullable: boolean;
};

// Map JavaScript/TypeScript types to PostgreSQL types
export const typeMapping: Record<string, string[]> = {
  string: ['text', 'varchar', 'char', 'uuid', 'jsonb', 'json'],
  number: ['int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'integer', 'bigint'],
  boolean: ['bool', 'boolean'],
  object: ['jsonb', 'json'],
  array: ['_text', '_int4', '_int8', '_float4', '_float8', '_bool', 'jsonb', 'json', 'ARRAY'],
  Date: ['timestamp', 'timestamptz', 'date', 'time', 'timetz'],
};
