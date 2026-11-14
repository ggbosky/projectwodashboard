import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Bez nastavených proměnných zůstává aplikace v lokálním demo režimu.
export const supabase = url && key ? createClient(url, key) : null;
