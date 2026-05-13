
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function listUsers() {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  console.log('Fetching all users from profiles...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('email, role');

  if (error) {
    console.error('❌ Error:', error.message);
  } else if (data && data.length > 0) {
    console.log(`✅ Found ${data.length} user(s):`);
    data.forEach(user => console.log(` - ${user.email} (Role: ${user.role})`));
  } else {
    console.log('ℹ️ No users found in the "profiles" table yet.');
  }
}

listUsers();
