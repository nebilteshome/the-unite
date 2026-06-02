import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, type, data } = req.body;

  try {
    let html = '';

    if (type === 'welcome') {
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e5e5e5;">
          <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.05em; margin-bottom: 24px;">Welcome to the Club</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #555;">Thank you for joining THEE UNITE. You now have access to exclusive collections and personalized shopping experiences.</p>
          <div style="margin-top: 40px;">
            <a href="${process.env.APP_URL}" style="background: black; color: white; padding: 16px 32px; text-decoration: none; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Start Exploring</a>
          </div>
        </div>
      `;
    } else if (type === 'order_confirmation') {
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e5e5e5;">
          <h1 style="font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.05em; margin-bottom: 24px;">Order Confirmed</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #555;">Thank you for your purchase. We are processing your order and will notify you when it ships.</p>
          <div style="margin: 32px 0; padding: 24px; background: #f9f9f9; border: 1px solid #e5e5e5;">
            <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px;">Order Details</p>
            <p style="font-size: 14px; margin: 0;">Total: $${data.total.toFixed(2)}</p>
          </div>
          <div style="margin-top: 40px;">
            <a href="${process.env.APP_URL}/account" style="background: black; color: white; padding: 16px 32px; text-decoration: none; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">View Account</a>
          </div>
        </div>
      `;
    }

    const { data: resData, error } = await resend.emails.send({
      from: 'THEE UNITE <onboarding@resend.dev>', // Update with verified domain in production
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) throw error;

    return res.status(200).json(resData);
  } catch (error: any) {
    console.error('Email Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
