const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const http = require('http');

// Main webhook handler - this is where Stripe sends events
// We verify the signature to make sure it's actually from Stripe
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    // First, verify this webhook actually came from Stripe
    // If the signature doesn't match, this will throw an error
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('Webhook verified:', event.type);

    // Send the event to our proof generation service
    const proof = await forwardToProofGeneration(event);
    console.log('Received proof from generation service');

    res.json({
      received: true,
      eventType: event.type,
      proof
    });

  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Helper function to call our /generate-proof endpoint
// We use http.request here to avoid fetch compatibility issues with older Node versions
async function forwardToProofGeneration(event) {
  return new Promise((resolve, reject) => {
    const eventData = JSON.stringify(event);
    const PORT = process.env.PORT || 3000;

    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/generate-proof',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(eventData)
      }
    };

    const proofReq = http.request(options, (proofRes) => {
      let data = '';

      // Collect the response data
      proofRes.on('data', (chunk) => {
        data += chunk;
      });

      // Parse and return the proof when done
      proofRes.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse proof response'));
        }
      });
    });

    proofReq.on('error', (error) => {
      reject(error);
    });

    proofReq.write(eventData);
    proofReq.end();
  });
}
