import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ClerkProvider } from '@clerk/clerk-react'

// 1. We grab the secret key you just saved in your .env.local file
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// 2. We add a safety check just in case the key is missing
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Check your .env.local file.")
}

// 3. We wrap your <App /> inside the <ClerkProvider />
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)