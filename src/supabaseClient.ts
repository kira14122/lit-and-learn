import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// We wrap the client in a function so we can pass it the Clerk ID card!
export const getSupabaseClient = (clerkToken?: string) => {
  // Only create the Authorization header IF a token actually exists.
  // If it's a guest user (empty token), pass empty options so Supabase 
  // knows it's a public request and doesn't throw the 'Empty JWT' error.
  const options = clerkToken ? {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  } : {}

  return createClient(supabaseUrl, supabaseAnonKey, options)
}