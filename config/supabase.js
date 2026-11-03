import { createClient } from "@supabase/supabase-js";

let client;

// Created on first use, so building the app doesn't need the settings.
// The key is public by design: row level security in docs/schema.sql protects the data.
export function supabase() {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  return client;
}
