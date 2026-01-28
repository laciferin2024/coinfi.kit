// Supabase Edge Function: mpc-sign
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import { P2Signature } from "npm:@silencelaboratories/ecdsa-tss"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { walletId, messageHash, p1Message } = await req.json()

    // 1. Fetch the backend share
    const { data: shareData, error: shareError } = await supabaseClient
      .from('mpc_shares')
      .select('share_data')
      .eq('wallet_id', walletId)
      .single()

    if (shareError || !shareData) {
      throw new Error(`Share not found for wallet ${walletId}`)
    }

    const backendShare = shareData.share_data;
    const sessionId = crypto.randomUUID();

    // 2. Participate in Round 2 of signing
    const p2sig = new P2Signature(sessionId, backendShare, messageHash);
    const m2 = await p2sig.processMessage(p1Message);

    return new Response(
      JSON.stringify({ p2Message: m2.msg_to_send }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
