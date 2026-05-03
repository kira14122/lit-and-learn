import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { toEmail, studentName, messageBody } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Dr. Chouit <dr.chouit@litnlearn.com>', 
        to: [toEmail],
        subject: `Message for ${studentName} - Lit & Learn`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 20px;">
              <h1 style="color: #0f172a; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Lit <span style="color: #4f46e5;">&</span> Learn</h1>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Dear <strong>${studentName}</strong>,</p>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; color: #1e293b; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${messageBody}</div>
            <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 0;">Best regards,</p>
            <p style="color: #0f172a; font-size: 16px; font-weight: bold; margin-top: 5px;">Dr. Chouit</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="color: #94a3b8; font-size: 13px; margin: 0;">Log in to your student portal to view your coursework and progress.</p>
            </div>
          </div>
        `,
      }),
    })

    const data = await res.json()
    
    return new Response(JSON.stringify(data), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})