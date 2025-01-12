-- Allow public to check for existing VINs
CREATE POLICY "Allow public to check for existing VINs"
ON cars FOR SELECT
TO public
USING (true);