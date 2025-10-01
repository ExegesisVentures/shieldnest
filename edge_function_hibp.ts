// =====================================================
// SUPABASE EDGE FUNCTION: Password Security Check
// File: supabase/functions/check-password/index.ts
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

interface PasswordCheckRequest {
  password: string
}

interface HibpResponse {
  success: boolean
  pwned: boolean
  count?: number
  message?: string
  error?: string
}

// SHA-1 hash function using Web Crypto API
async function sha1Hash(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

// Check password against HaveIBeenPwned using k-anonymity
async function checkPasswordPwned(password: string): Promise<HibpResponse> {
  try {
    // Input validation
    if (!password || password.length === 0) {
      return {
        success: false,
        pwned: false,
        error: 'Password cannot be empty'
      }
    }

    // Generate SHA-1 hash
    const passwordSha1 = await sha1Hash(password)
    const prefix = passwordSha1.slice(0, 5)
    const suffix = passwordSha1.slice(5)

    // Query HaveIBeenPwned API with k-anonymity
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true',
        'User-Agent': 'ShieldNest-Security-Check'
      }
    })

    if (!response.ok) {
      throw new Error(`HIBP API returned ${response.status}`)
    }

    const responseText = await response.text()
    const lines = responseText.split(/\r?\n/)

    // Look for our password's suffix in the response
    for (const line of lines) {
      if (!line.trim()) continue
      
      const [remoteSuffix, countStr] = line.split(':')
      if (remoteSuffix.toUpperCase() === suffix) {
        const count = parseInt(countStr) || 0
        return {
          success: true,
          pwned: true,
          count,
          message: `This password has been found in ${count.toLocaleString()} data breaches. Please choose a different password.`
        }
      }
    }

    // Password not found in breaches
    return {
      success: true,
      pwned: false,
      count: 0,
      message: 'Password appears to be secure'
    }

  } catch (error) {
    console.error('HaveIBeenPwned check failed:', error)
    return {
      success: false,
      pwned: false,
      error: 'Password security check temporarily unavailable'
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { password }: PasswordCheckRequest = await req.json()

    // Validate input
    if (!password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Password is required'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check password against HaveIBeenPwned
    const result = await checkPasswordPwned(password)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* 
DEPLOYMENT INSTRUCTIONS:

1. Create the function directory:
   mkdir -p supabase/functions/check-password

2. Save this file as:
   supabase/functions/check-password/index.ts

3. Create cors helper:
   supabase/functions/_shared/cors.ts

4. Deploy:
   supabase functions deploy check-password

5. Usage in your app:
   const response = await supabase.functions.invoke('check-password', {
     body: { password: 'user_password_here' }
   })

EXAMPLE RESPONSE:
{
  "success": true,
  "pwned": true,
  "count": 12345,
  "message": "This password has been found in 12,345 data breaches..."
}
*/
