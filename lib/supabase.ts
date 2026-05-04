import { createClient } from '@supabase/supabase-js';

// Credentials provided for the project hub
const supabaseUrl = 'https://uaqpearggivpwhextmki.supabase.co';
const supabaseAnonKey = 'sb_publishable_3jKQt1tu0TbrRonr3kmVGw_Tr5u3i3b';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
