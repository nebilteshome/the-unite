import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clerkId, email } = req.body;

  if (!clerkId || !email) {
    return res.status(400).json({ error: 'Missing clerkId or email' });
  }

  try {
    // 1. Check if profile exists by email in Supabase
    // Note: We use the Clerk ID as the Supabase ID for simplicity if creating a new one
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (!profile) {
      // Create profile using Clerk ID as the ID
      // We wrap it in a try-catch because the 'profiles' table might have a UUID constraint
      try {
        await supabaseAdmin.from('profiles').insert({
          id: clerkId,
          email: email,
          role: email === 'fffg3839@gmail.com' ? 'admin' : 'user'
        });
      } catch (e) {
        // If UUID constraint fails, we'll let the DB trigger handle it or skip
        console.warn("Profile creation with Clerk ID failed, likely a UUID constraint. Falling back.");
      }
    } else if (email === 'fffg3839@gmail.com' && profile.role !== 'admin') {
      // Ensure admin role is set
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('email', email);
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
