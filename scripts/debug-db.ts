import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function test() {
  console.log('Testing with:', supabaseUrl);
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  const { data, error } = await supabase.from('categories').select('*').limit(1);
  if (error) {
    console.error('Error details:', error);
  } else {
    console.log('Success!', data);
  }
}

test();
