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
    // 1. Get Clerk User
    const clerkUser = await clerkClient.users.getUser(clerkId);
    let supabaseId = clerkUser.publicMetadata.supabase_id as string;

    if (!supabaseId) {
      // 2. Check if profile exists by email in Supabase
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profile) {
        supabaseId = profile.id;
      } else {
        // 3. Create new shadow user in Supabase auth.users
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { clerk_id: clerkId }
        });

        if (createError) throw createError;
        supabaseId = newUser.user.id;

        // 3b. Send Welcome Email
        try {
          await fetch(`${process.env.APP_URL}/api/emails/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              subject: 'Welcome to THEE UNITE',
              type: 'welcome'
            })
          });
        } catch (emailErr) {
          console.error("Failed to send welcome email", emailErr);
        }
      }

      // 4. Update Clerk Public Metadata
      await clerkClient.users.updateUser(clerkId, {
        publicMetadata: {
          supabase_id: supabaseId
        }
      });
    }

    return res.status(200).json({ supabaseId });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
