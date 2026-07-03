// No import needed — Deno.serve is built in to modern Supabase edge functions

const allowedOrigins = [
  'https://litnlearn.com',
  'https://www.litnlearn.com',
  'http://localhost:5173'
];

// Tried in order: strongest first, lightweight backup second.
// If the first model fails (rate limit, empty output, transient error),
// the second gets a chance before we report failure to the app.
// Backup swapped from llama-3.3-70b-versatile (Groq decommissioned it on
// Aug 16, 2026) to openai/gpt-oss-20b — a current free-tier model that
// returns the same clean output format as the primary and carries its own
// separate daily-token budget. Alternative drop-in: 'qwen/qwen3.6-27b'.
const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];

async function callGroqModel(apiKey: string, model: string, prompt: string) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.3,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const groqMsg = data?.error?.message || JSON.stringify(data) || 'no body';
    // Surface the REAL reason in the function logs — never debug blind again.
    console.error(`🚨 Groq [${model}] ${response.status}: ${groqMsg}`);
    return { ok: false as const, status: response.status, error: `Groq ${response.status}: ${groqMsg}` };
  }

  const text = data?.choices?.[0]?.message?.content?.trim() ?? null;
  if (!text) {
    console.error(`🚨 Groq [${model}] returned an empty response.`);
    return { ok: false as const, status: 502, error: `Groq [${model}] returned an empty response.` };
  }

  console.log(`✅ Groq [${model}] responded (${text.length} chars).`);
  return { ok: true as const, text };
}

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

    // Bouncer — raised to 8000 to support longer worksheet prompts
    if (!prompt || prompt.length > 8000) {
      console.error('🚨 Blocked oversized prompt.');
      return new Response(JSON.stringify({ error: 'Prompt exceeds maximum allowed length.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing from Supabase secrets!');
    }

    // Try each model in order; first success wins.
    let lastError = 'All Groq models failed.';
    let lastStatus = 502;
    for (const model of MODELS) {
      const result = await callGroqModel(apiKey, model, prompt);
      if (result.ok) {
        return new Response(JSON.stringify({ text: result.text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      lastError = result.error;
      lastStatus = result.status;
    }

    // Both models failed — report the last real error upstream.
    return new Response(JSON.stringify({ error: lastError }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: lastStatus >= 400 && lastStatus < 600 ? lastStatus : 502,
    });

  } catch (error: any) {
    console.error('🚨 ask-groq handler error:', error?.message);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});