import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allow both your live domain and local testing
const allowedOrigins = ['https://litnlearn.com', 'http://localhost:5173'];

serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://litnlearn.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight CORS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. THE BOUNCER: Extract and verify the user's email from their secure token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    
    const token = authHeader.replace('Bearer ', '');
    // Decode the JWT payload (the middle part of the token)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // If the user making this request is not you, instantly reject it
    if (payload.email !== 'kira14122@gmail.com') {
      console.error(`🚨 Unauthorized email attempt blocked from: ${payload.email}`);
      return new Response(JSON.stringify({ error: 'Unauthorized. Admin access required.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. The Party: Process the email exactly as before
    const { toEmail, studentName, messageBody } = await req.json();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`
      },
      body: JSON.stringify({
        from: 'Dr. Chouit <dr.chouit@litnlearn.com>',
        to: [toEmail],
        subject: `New Message from Lit & Learn`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Hello ${studentName},</h2>
            <p style="white-space: pre-wrap;">${messageBody}</p>
            <br/>
            <p>Best regards,<br/><strong>Dr. Chouit Abderraouf</strong><br/>Lit & Learn</p>
          </div>
        `
      })
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});