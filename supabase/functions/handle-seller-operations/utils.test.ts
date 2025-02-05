
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { calculateMD5, corsHeaders } from "./utils.ts";

Deno.test("calculateMD5 generates correct hash", () => {
  const input = "test123";
  const expectedHash = "cc03e747a6afbbcbf8be7668acfebee5"; // pre-calculated MD5 hash for "test123"
  const result = calculateMD5(input);
  assertEquals(result, expectedHash);
});

Deno.test("corsHeaders contains correct headers", () => {
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
  assertEquals(
    corsHeaders["Access-Control-Allow-Headers"],
    "authorization, x-client-info, apikey, content-type"
  );
});
