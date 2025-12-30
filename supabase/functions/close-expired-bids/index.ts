import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify Authorization (Must be Service Role)
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || authHeader.replace('Bearer ', '') !== serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Initialize Supabase Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey ?? ''
    );

    console.log('Checking for expired bids...');

    // Find all active bids that have expired
    const { data: expiredBids, error: fetchError } = await supabase
      .from('bids')
      .select(`
        id,
        item_name,
        ends_at,
        user_id,
        group_id,
        bid_offers (
          id,
          offer_amount,
          user_id,
          created_at
        )
      `)
      .eq('status', 'active')
      .lt('ends_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired bids:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredBids?.length || 0} expired bids`);

    for (const bid of expiredBids || []) {
      console.log(`Processing bid: ${bid.id}`);

      // Sort offers by amount descending to find winner
      const sortedOffers = bid.bid_offers.sort((a, b) => b.offer_amount - a.offer_amount);
      const winningOffer = sortedOffers[0];

      if (winningOffer) {
        // Calculate payment deadline (7 days from now)
        const paymentDeadline = new Date();
        paymentDeadline.setDate(paymentDeadline.getDate() + 7);

        // Update bid with winner
        const { error: updateError } = await supabase
          .from('bids')
          .update({
            status: 'closed',
            winner_id: winningOffer.user_id,
            payment_deadline: paymentDeadline.toISOString(),
            verification_url: `https://verifyme.com/verify?bid=${bid.id}&user=${winningOffer.user_id}`
          })
          .eq('id', bid.id);

        if (updateError) {
          console.error(`Error updating bid ${bid.id}:`, updateError);
          continue;
        }

        // Create notification for winner
        const { error: notificationError } = await supabase
          .from('bid_notifications')
          .insert({
            bid_id: bid.id,
            user_id: winningOffer.user_id,
            message: `🎉 Congratulations! You won the bid for "${bid.item_name}"! Please complete payment by ${paymentDeadline.toLocaleDateString()} and verify your identity.`
          });

        if (notificationError) {
          console.error(`Error creating notification for bid ${bid.id}:`, notificationError);
        }

        console.log(`Bid ${bid.id} closed. Winner: ${winningOffer.user_id}`);
      } else {
        // No bids, just close it
        const { error: updateError } = await supabase
          .from('bids')
          .update({ status: 'closed' })
          .eq('id', bid.id);

        if (updateError) {
          console.error(`Error closing bid ${bid.id}:`, updateError);
        }

        console.log(`Bid ${bid.id} closed with no offers`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: expiredBids?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: unknown) {
    console.error('Error in close-expired-bids:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});