
-- Function to retrieve column information for schema validation
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    columns.column_name::TEXT,
    columns.data_type::TEXT,
    columns.is_nullable::TEXT
  FROM 
    information_schema.columns
  WHERE 
    columns.table_schema = 'public'
    AND columns.table_name = table_name;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_table_columns TO authenticated;

-- Add comment to explain function's purpose
COMMENT ON FUNCTION public.get_table_columns IS 
  'Returns column metadata for a given table to support client-side schema validation';
