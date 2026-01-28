import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { utils, Wallet } from "https://esm.sh/ethers@6.7.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, address, publicKey, backendShare, signature, message } = await req.json()

    // 1. Verify all required fields
    if (!userId || !address || !publicKey || !backendShare || !signature || !message) {
      throw new Error('Missing required fields')
    }

    // 2. Recover signer address from signature
    const messageHash = utils.hashMessage(message)
    const recoveredAddress = utils.recoverAddress(messageHash, signature)

    // 3. Verify recovered address matches claimed address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      throw new Error(`Signature verification failed: recovered ${recoveredAddress}, claimed ${address}`)
    }

    console.log(`✓ Ownership verified for ${address}`)

    // 4. Insert into database using service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create wallet record
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('mpc_wallets')
      .insert({
        address,
        public_key: publicKey,
        user_id: userId,
        ownership_proof: signature
      })
      .select()
      .single()

    if (walletError) throw walletError

    // Store backend share
    const { error: shareError } = await supabaseAdmin
      .from('mpc_shares')
      .insert({
        wallet_id: walletData.id,
        share_data: JSON.parse(backendShare)
      })

    if (shareError) throw shareError

    return new Response(
      JSON.stringify({
        success: true,
        walletId: walletData.id,
        message: 'Wallet ownership verified and registered'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Verification error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
