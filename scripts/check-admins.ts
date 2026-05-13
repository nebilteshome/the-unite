
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function checkAdmins() {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  console.log('Checking for admin accounts...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('role', 'admin');

  if (error) {
    console.error('❌ Error checking admins:', error.message);
  } else if (data && data.length > 0) {
    console.log(`✅ Found ${data.length} admin account(s):`);
    data.forEach(admin => console.log(` - ${admin.email}`));
  } else {
    console.log('⚠️ No admin accounts found in the "profiles" table.');
    console.log('👉 You will need to create a user in Supabase Auth and manually set their role to "admin" in the "profiles" table.');
  }
}

checkAdmins();
