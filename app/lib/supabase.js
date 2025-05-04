import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yqawkwrnoaotzyqdpnkc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYXdrd3Jub2FvdHp5cWRwbmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NjU4NDAsImV4cCI6MjA2MTI0MTg0MH0.EX45IBTKSMZ7S6WIzNkRt6HWQQGN64GzziRyd9_GJ6Q';

// Wir verwenden den echten Supabase-Client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase; 