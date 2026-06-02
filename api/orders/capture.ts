import { createClient } from '@supabase/supabase-js';
import { createClerkClient } from '@clerk/backend';
import { getPayPalAccessToken, getPayPalBaseUrl } from '../utils/paypal';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderID, formData, clerkId } = req.body;

  try {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = await response.json();

    if (captureData.status === 'COMPLETED') {
      let supabaseUserId = null;
      
      if (clerkId) {
        const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const clerkUser = await clerkClient.users.getUser(clerkId);
        supabaseUserId = clerkUser.publicMetadata.supabase_id;
      }

      // 1. Save order to Supabase
      const total = parseFloat(captureData.purchase_units[0].payments.captures[0].amount.value);
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: `${formData.firstName} ${formData.lastName}`,
          customer_email: formData.email,
          total: total,
          status: 'completed',
          user_id: supabaseUserId
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Trigger Order Confirmation Email
      try {
        await fetch(`${process.env.APP_URL}/api/emails/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.email,
            subject: 'Order Confirmed - THEE UNITE',
            type: 'order_confirmation',
            data: { total: total }
          })
        });
      } catch (emailErr) {
        console.error("Failed to send order confirmation email", emailErr);
      }

      return res.status(200).json(captureData);
    } else {
      return res.status(400).json(captureData);
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
