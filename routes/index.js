const express = require('express');
const webhookController = require('../controllers/webhookController');
const proofController = require('../controllers/proofController');

const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'Server is running',
    endpoints: {
      webhook: '/webhook',
      generateProof: '/generate-proof'
    }
  });
});

/**
 * Stripe webhook endpoint
 * Receives webhook events from Stripe
 * Requires raw body for signature verification
 */
router.post('/webhook', express.raw({ type: 'application/json' }), webhookController.handleWebhook);

/**
 * Proof generation endpoint
 * Generates zkFetch proof for payment verification
 */
router.post('/generate-proof', express.json(), proofController.generateProof);

module.exports = router;
