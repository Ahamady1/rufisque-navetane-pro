import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (email !== 'admin@rufisquenavetane.sn') {
      return new Response(
        JSON.stringify({ error: 'Compte démo non autorisé.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Look up the demo admin user
    const { data: users, error: userError } = await adminClient.auth.admin.listUsers();
    if (userError) {
      return new Response(
        JSON.stringify({ error: 'Erreur serveur.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const demoUser = users.users.find((u) => u.email === 'admin@rufisquenavetane.sn');
    if (!demoUser) {
      return new Response(
        JSON.stringify({ error: 'Compte démo introuvable.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a one-time link for the demo user
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: 'admin@rufisquenavetane.sn',
    });

    if (linkError || !linkData) {
      return new Response(
        JSON.stringify({ error: 'Impossible de générer le lien de connexion.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The properties are action_link, email_otp, hashed_token, redirect_to
    const token = (linkData.properties as Record<string, string>).hashed_token;
    const verificationUrl = (linkData.properties as Record<string, string>).action_link;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token introuvable.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the OTP to verify and get a session
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink',
    });

    if (verifyError || !verifyData.session) {
      // Fallback: try direct token-based verify via the action_link
      return new Response(
        JSON.stringify({ error: 'Connexion échouée. Réessayez.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: verifyData.session.access_token,
        refresh_token: verifyData.session.refresh_token,
        expires_in: verifyData.session.expires_in,
        user: { id: verifyData.user?.id, email: verifyData.user?.email },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Erreur serveur.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
