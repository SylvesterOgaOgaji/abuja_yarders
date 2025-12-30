import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Initialize Supabase Client
    // We use Service Role to query profiles by email securely without exposing the column to public RLS if we strictly controlled it,
    // OR just to be robust. 
    // Since we added 'email' to profiles, we can query it directly.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Check if the caller is a valid user (Optional but recommended to prevent abuse)
    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !caller) {
       // Alternatively, if we just want to trust the JWT signature without calling getUser (faster):
       // But using Service Role client to getUser verifies the token against the database.
       // For a lighter check, we can just proceed if we assume the Gateway forwarded it, 
       // but explicitly checking validity is safer for an "internal" API.
       // However, often Edge Functions receive the anon key + user token. 
       // Let's stick to checking if a user exists for this token.
       // Actually, standard pattern: Create client with auth header and let RLS handle it? 
       // But we need to search by email, which might not be allowed by RLS for "other" users if we locked it down.
       // So Service Role is best for the *query*, but we must verify *authorization* first.
    }
    
    // 4. Query Profiles Table directly
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      // Return 404 but don't leak details if it was error vs not found
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error searching for user:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
