import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 1. The Allowed Origins: Only your live site and local testing environment can talk to this function
const allowedOrigins = ['https://litnlearn.com', 'http://localhost:5173'];

serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://litnlearn.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // Handle the initial security handshake from the browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Catch the prompt sent over from your React frontend
    const { prompt } = await req.json()

    // 3. THE BOUNCER: Prevent massive data dumps to protect your API billing
    if (!prompt || prompt.length > 3000) {
       console.error("🚨 Blocked abnormally large AI prompt attempt.");
       return new Response(JSON.stringify({ error: 'Prompt exceeds maximum allowed length.' }), {
         status: 400,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    // 4. Securely grab your hidden Gemini Key from the Supabase Vault
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
      throw new Error("API key is missing from the vault!")
    }

    // 5. Make the secure request directly to Google from the backend using gemini-2.5-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const data = await response.json()

    // 6. Send the final AI answer back to your student's browser
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})