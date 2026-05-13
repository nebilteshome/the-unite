
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function checkTables() {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  const tables = ['categories', 'products', 'orders', 'profiles'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Table "${table}": ${error.message}`);
    } else {
      console.log(`✅ Table "${table}": Exists`);
    }
  }
}

checkTables();
