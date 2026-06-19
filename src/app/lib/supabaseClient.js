import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Format URL if only project reference is provided
let formattedUrl = supabaseUrl;
if (formattedUrl && !formattedUrl.startsWith('http')) {
  formattedUrl = `https://${formattedUrl}.supabase.co`;
}

let supabaseClientInstance = null;
try {
  if (formattedUrl && supabaseAnonKey) {
    supabaseClientInstance = createClient(formattedUrl, supabaseAnonKey);
  } else {
    console.warn("Supabase credentials missing. Supabase client will run in offline fallback mode.");
  }
} catch (e) {
  console.error("Failed to initialize Supabase client:", e);
}

export const supabase = supabaseClientInstance;
