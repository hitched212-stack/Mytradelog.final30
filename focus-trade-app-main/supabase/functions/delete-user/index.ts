import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's JWT to verify identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the user with their JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing account deletion for user: ${user.id}`);

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Delete user's profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      // Continue anyway - profile might not exist
    } else {
      console.log('Profile deleted successfully');
    }

    // 2. Remove user from all accounts they're a member of
    const { error: accountUsersError } = await adminClient
      .from('account_users')
      .delete()
      .eq('user_id', user.id);

    if (accountUsersError) {
      console.error('Error deleting account_users:', accountUsersError);
      // Continue anyway
    } else {
      console.log('Account memberships deleted successfully');
    }

    // 3. Delete accounts where user is the sole owner
    // First get accounts where user is owner
    const { data: ownedAccounts, error: ownedError } = await adminClient
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('role', 'owner');

    if (!ownedError && ownedAccounts) {
      for (const { account_id } of ownedAccounts) {
        // Check if there are other owners
        const { data: otherOwners, error: otherError } = await adminClient
          .from('account_users')
          .select('id')
          .eq('account_id', account_id)
          .eq('role', 'owner')
          .neq('user_id', user.id);

        if (!otherError && (!otherOwners || otherOwners.length === 0)) {
          // No other owners, delete the account
          const { error: deleteAccountError } = await adminClient
            .from('accounts')
            .delete()
            .eq('id', account_id);

          if (deleteAccountError) {
            console.error(`Error deleting account ${account_id}:`, deleteAccountError);
          } else {
            console.log(`Account ${account_id} deleted successfully`);
          }
        }
      }
    }

    // 4. Delete the auth user using admin API
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} deleted successfully`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
