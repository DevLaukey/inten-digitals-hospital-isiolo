import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabaseUrl = "https://your-supabase-url.supabase.co";
const supabaseKey = "your-anon-key";
export const supabase = createClient(supabaseUrl, supabaseKey);
