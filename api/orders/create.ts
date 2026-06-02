import { createClient } from '@supabase/supabase-js';
import { getPayPalAccessToken, getPayPalBaseUrl } from '../utils/paypal';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { items } = req.body;

  try {
    // 1. Validate items and calculate total from Supabase
    const { data: products } = await supabase
      .from('products')
      .select('id, price')
      .in('id', items.map((i: any) => i.id));

    if (!products) throw new Error("Products not found");

    const total = items.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    // 2. Create PayPal Order
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: total.toFixed(2),
            },
          },
        ],
      }),
    });

    const order = await response.json();
    return res.status(200).json(order);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
