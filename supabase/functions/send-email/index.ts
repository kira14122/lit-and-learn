// supabase/functions/send-email/index.ts
// Sends via Resend (outbound to students).
// Brevo is only used for the Gmail alias — completely separate, not touched here.
// Required Supabase secret: RESEND_API_KEY

const allowedOrigins = ['https://litnlearn.com', 'http://localhost:5173'];

Deno.serve(async (req) => {

  // ── CORS ───────────────────────────────────────────────────────────────────
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
    // ── Security: Admin-only ───────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const token   = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.email !== 'kira14122@gmail.com') {
      throw new Error('Unauthorized. Admin access required.');
    }

    // ── Read request body ──────────────────────────────────────────────────
    const { toEmail, studentName, messageBody, subject, attachment, replyTo } = await req.json();

    if (!toEmail || !messageBody) {
      throw new Error('Missing required fields: toEmail and messageBody.');
    }

    // ── Resend API key from Supabase secrets ───────────────────────────────
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) throw new Error('RESEND_API_KEY is not set in Supabase secrets.');

    // ── Build HTML email ───────────────────────────────────────────────────
    // Strip the plain-text signature the frontend appends (everything from "Best regards" down)
    // so we can replace it with a clean HTML version.
    const bodyOnly = messageBody.split(/\nBest regards/i)[0].trim();

    // Convert **markdown bold** → <strong>
    // Also bold bare section headers (lines ending in : with no markdown)
    // and strip wrapping quotation marks from AI-generated feedback
    const formattedBody = bodyOnly
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^(Skill Breakdown:|Instructor Feedback:|Score Breakdown:|Assessment:)\s*$/gm, '<strong>$1</strong>')
      .replace(/^[""]/gm, '')   // remove opening smart/straight quotes at line start
      .replace(/[""]\s*$/gm, '') // remove closing smart/straight quotes at line end
      .replace(/\n/g, '<br>');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #1e293b; max-width: 600px;">

        ${formattedBody}

        <br><br>

        <!-- Signature with indigo accent bar — table-based for email client compatibility -->
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:28px; padding-top:20px; border-top:1px solid #e2e8f0; width:100%;">
          <tr><td colspan="2" style="padding-bottom:16px; border-top:1px solid #e2e8f0; font-size:0;">&nbsp;</td></tr>
          <tr>
            <td style="width:3px; background-color:#4F46E5; border-radius:2px; vertical-align:top;">&nbsp;</td>
            <td style="padding-left:14px; vertical-align:top;">
              <p style="margin:0 0 1px; font-size:11px; color:#94A3B8; text-transform:uppercase; letter-spacing:0.1em;">Best regards</p>
              <p style="margin:6px 0 10px; font-weight:700; font-size:16px; color:#0f172a; letter-spacing:-0.01em;">Dr. Chouit Abderraouf</p>
              <p style="margin:3px 0; font-size:13px;">
                <a href="mailto:dr.chouit@litnlearn.com" style="color:#4F46E5; text-decoration:none;">dr.chouit@litnlearn.com</a>
              </p>
              <p style="margin:3px 0; font-size:13px;">
                <a href="https://litnlearn.com" style="color:#4F46E5; text-decoration:none;">litnlearn.com</a>
              </p>
            </td>
          </tr>
        </table>

      </div>
    `;

    // ── Build Resend payload ───────────────────────────────────────────────
    const resendPayload: any = {
      from:     'Dr. Chouit <dr.chouit@litnlearn.com>',
      to:       [toEmail],
      reply_to: replyTo || 'dr.chouit@litnlearn.com',
      subject:  subject || 'Message from Lit & Learn',
      html:     htmlContent,
    };

    // ── Attachment (optional) ──────────────────────────────────────────────
    // Resend expects: { filename, content (base64) }
    if (attachment?.filename && attachment?.content) {
      resendPayload.attachments = [
        { filename: attachment.filename, content: attachment.content }
      ];
    }

    // ── Send via Resend API ────────────────────────────────────────────────
    const resendRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend API error:', JSON.stringify(resendData));
      throw new Error(resendData.message || `Resend rejected the request (${resendRes.status})`);
    }

    console.log('Email sent via Resend. ID:', resendData.id);

    return new Response(
      JSON.stringify({ success: true, messageId: resendData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('send-email error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});