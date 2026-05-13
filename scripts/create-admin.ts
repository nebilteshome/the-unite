
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Note: Creating a user with just the anon key might not work depending on Supabase settings.
// Usually, we need the Service Role Key for this kind of administrative task, 
// but we'll try with the credentials we have first.

async function createAdmin() {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  const email = 'fffg3839@gmail.com';
  const password = 'Jo2450';

  console.log(`Attempting to create user: ${email}...`);

  // 1. Sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.log('ℹ️ User already exists in Auth.');
    } else {
      console.error('❌ Sign up error:', signUpError.message);
      return;
    }
  } else {
    console.log('✅ User created in Auth.');
  }

  // 2. We need the user ID. If they already existed, we need to find them.
  // Using the anon key we can't search auth.users, but the trigger should have created a profile.
  
  console.log('Updating profile to admin role...');
  
  // Try to update the profile directly by email
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', email)
    .select();

  if (updateError) {
    console.error('❌ Error updating profile:', updateError.message);
  } else if (updateData && updateData.length > 0) {
    console.log('✅ Success! Account is now an Admin.');
  } else {
    console.log('⚠️ Could not find a profile for that email. The user may need to confirm their email first, or the trigger didn\'t fire.');
  }
}

createAdmin();
