
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function testConnection() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Missing Supabase environment variables.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('Testing connection to:', supabaseUrl);

  try {
    // Try to fetch categories (should be public)
    const { data, error } = await supabase.from('categories').select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "public.categories" does not exist')) {
        console.error('❌ Connection successful, but the "categories" table was not found.');
        console.error('👉 Did you run the SQL schema in the Supabase SQL Editor?');
      } else {
        console.error('❌ Supabase error:', error.message);
      }
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('✅ "categories" table exists and is accessible.');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();
