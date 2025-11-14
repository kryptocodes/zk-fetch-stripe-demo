const { ReclaimClient } = require('@reclaimprotocol/zk-fetch');
const { saveProof } = require('../utils/proofStorage');

// Set up the zkFetch client with Reclaim credentials
const reclaimClient = new ReclaimClient(
  process.env.RECLAIM_APP_ID,
  process.env.RECLAIM_APP_SECRET
);

// This is where we generate the zk proof for Stripe payments
// The proof can later be verified on-chain/off-chain without exposing sensitive data
exports.generateProof = async (req, res) => {
  try {
    const event = req.body;
    console.log('Generate proof called with event:', event.type);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      console.log('Payment verified:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status
      });

      const stripeApiUrl = `https://api.stripe.com/v1/payment_intents/${paymentIntent.id}`;
      console.log('Generating zkFetch proof...');

      const zkProof = await reclaimClient.zkFetch(
        stripeApiUrl,
        {
          method: 'GET',
        },
        {
          // Use regex to extract just the fields we need from Stripe's response
          // This keeps the proof size small and only reveals what's necessary
          responseMatches: [
            {
              type: 'regex',
              value: '"id":\\s*"(?<id>[^"]+)"[\\s\\S]*?"amount":\\s*(?<amount>\\d+)[\\s\\S]*?"currency":\\s*"(?<currency>[^"]+)"[\\s\\S]*?"status":\\s*"(?<status>[^"]+)"'
            }
          ],
          // Redact the matched data so it's not exposed in plain text (optional)
          // responseRedactions: [
          //   {
          //     regex: '"id":\\s*"(?<id>[^"]+)"[\\s\\S]*?"amount":\\s*(?<amount>\\d+)[\\s\\S]*?"currency":\\s*"(?<currency>[^"]+)"[\\s\\S]*?"status":\\s*"(?<status>[^"]+)"'
          //   }
          // ],
          // The API key is hidden in the proof - this is the magic of zkFetch
          headers: {
            'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
          }
        }
      );

      if (!zkProof) {
        console.error('Failed to generate proof');
        return res.status(400).json({ error: 'Failed to generate proof' });
      }

      // Package everything together
      const combinedProof = {
        verified: true,
        payment: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        },
        timestamp: new Date().toISOString(),
        proof: zkProof // This contains all the zkFetch proof data
      };

      // Save to file so we can inspect it during testing
      await saveProof(combinedProof, paymentIntent.id);

      return res.json(combinedProof);
    }

    // Just log other event types, we're not generating proofs for them yet
    console.log('Event type not handled for proof generation:', event.type);
    return res.json({
      verified: false,
      message: `Event type ${event.type} not handled for proof generation`
    });

  } catch (error) {
    console.error('Error generating proof:', error.message);
    return res.status(500).json({
      error: 'Failed to generate proof',
      details: error.message
    });
  }
};
