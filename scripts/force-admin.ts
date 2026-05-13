
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function forceAdmin() {
  const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  const email = 'fffg3839@gmail.com';

  console.log(`Checking profile for: ${email}...`);

  // First, let's see if we can find ANY profile
  const { data: allProfiles, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  if (fetchError) {
    console.error('❌ Error fetching profiles:', fetchError.message);
    return;
  }

  console.log(`Found ${allProfiles?.length || 0} total profiles in table.`);
  
  const myProfile = allProfiles?.find(p => p.email === email);
  
  if (myProfile) {
    console.log('✅ Found profile. Updating to admin...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', myProfile.id);
      
    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
    } else {
      console.log('✅ Success! Account is now an admin.');
    }
  } else {
    console.log('❌ Could not find a profile for that email.');
    console.log('This usually means the trigger to create a profile didn\'t run or you need to confirm your email.');
    console.log('List of emails found:', allProfiles?.map(p => p.email).join(', ') || 'None');
  }
}

forceAdmin();
