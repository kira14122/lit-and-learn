import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const allowedOrigins = ['https://litnlearn.com', 'http://localhost:5173'];

serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://litnlearn.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Verify User
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));

    if (payload.email !== 'kira14122@gmail.com') {
      throw new Error('Unauthorized. Admin access required.');
    }

    // 2. Get Payload
    const { toEmail, studentName, messageBody, subject, attachment } = await req.json();

    // 3. Build Email
    const emailPayload: any = {
      from: 'Dr. Chouit <dr.chouit@litnlearn.com>',
      to: [toEmail],
      subject: subject || 'New Message from Lit & Learn',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          ${studentName ? `<h2>Hello ${studentName},</h2>` : ''}
          <p style="white-space: pre-wrap;">${messageBody}</p>
          <br/>
          <p>Best regards,<br/><strong>Dr. Chouit Abderraouf</strong><br/>Lit & Learn</p>
        </div>
      `
    };

    if (attachment && attachment.filename && attachment.content) {
      emailPayload.attachments = [
        {
          filename: attachment.filename,
          content: attachment.content
        }
      ];
    }

    // 4. Send to Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`
      },
      body: JSON.stringify(emailPayload)
    });

    const data = await res.json();

    // 🔥 THE FIX: Actually check if Resend rejected the email!
    if (!res.ok) {
      console.error("Resend API Error:", data);
      throw new Error(data.message || JSON.stringify(data));
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});