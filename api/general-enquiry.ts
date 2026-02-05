import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { full_name, email, mobile, message } = req.body;

    // 🔒 Validation
    if (!full_name || !email || !mobile || !message) {
      return res.status(400).json({
        error: 'All fields are required',
      });
    }

    // 💾 Save to Supabase
    const { error } = await supabase
      .from('general_enquiries')
      .insert([
        {
          full_name,
          email,
          mobile,
          message,
        },
      ]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // 📧 Send Email Notification
    await resend.emails.send({
      from: 'RIS Foods <no-reply@resend.dev>',
      to: process.env.ADMIN_EMAIL!,
      subject: '📩 New General Enquiry – RIS Foods',
      html: `
        <h2>New General Enquiry</h2>
        <p><strong>Name:</strong> ${full_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'Enquiry submitted successfully',
    });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({
      error: 'Something went wrong',
    });
  }
}
