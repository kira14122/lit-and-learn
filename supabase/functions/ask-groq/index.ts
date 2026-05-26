// No import needed — Deno.serve is built in to modern Supabase edge functions

const allowedOrigins = ['https://litnlearn.com', 'http://localhost:5173'];

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://litnlearn.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle the browser security handshake
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    // Bouncer — block oversized prompts
    if (!prompt || prompt.length > 3000) {
      console.error('🚨 Blocked oversized prompt.');
      return new Response(JSON.stringify({ error: 'Prompt exceeds maximum allowed length.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Grab the Groq API key from Supabase secrets
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing from Supabase secrets!');
    }

    // Call Groq — Llama 3.3 70B, 14,400 free requests/day
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? null;

    if (!text) {
      throw new Error('Groq returned an empty response.');
    }

    return new Response(JSON.stringify({ text }), {
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