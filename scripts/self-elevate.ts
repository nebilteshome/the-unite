
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function selfElevate() {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  const email = 'fffg3839@gmail.com';
  const password = 'Jo2450';

  console.log(`Signing in as ${email}...`);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    if (authError.message.includes('Email not confirmed')) {
      console.log('👉 Please check your email and confirm the account, or disable "Email Confirmation" in Supabase Auth settings.');
    }
    return;
  }

  const userId = authData.user?.id;
  console.log(`✅ Logged in! User ID: ${userId}`);

  console.log('Attempting to self-elevate to admin...');
  
  const { data, error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)
    .select();

  if (updateError) {
    console.error('❌ Update failed:', updateError.message);
  } else if (data && data.length > 0) {
    console.log('✅ SUCCESS! You are now an Admin.');
    console.log('You can now log in to the /admin dashboard on your website.');
  } else {
    console.log('❌ Profile not found or update ignored.');
  }
}

selfElevate();
