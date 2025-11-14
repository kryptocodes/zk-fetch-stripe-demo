# Stripe Webhook + zkFetch Demo

Generate zero-knowledge proofs for Stripe payments that can be verified on-chain without exposing sensitive data like API keys.

## What's This About?

This demo shows how to:
1. Receive Stripe webhook events
2. Fetch payment data from Stripe's API
3. Generate a cryptographic proof using zkFetch
4. Save the proof as JSON for testing
5. (Future) Verify the proof on-chain in a smart contract/ off-chain using js-sdk library


## Project Structure

```
.
├── server.js                     # Entry point - super clean
├── routes/
│   └── index.js                  # Route definitions
├── controllers/
│   ├── webhookController.js      # Handles Stripe webhooks
│   └── proofController.js        # Generates zkFetch proofs
├── utils/
│   └── proofStorage.js           # Saves proofs as JSON files
└── proofs/                       # Auto-generated proof files (gitignored)
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file:

```env
# Get these from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=rk_test_your_restricted_key

# This gets generated when you run stripe listen
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Get these from Reclaim Protocol Develeoper portal https://dev.reclaimprotocol.org
# Create new application and copy the app_id and app_secret and don't forget the toggle the zkFetch in the app dashboard 
# you can skip add provider section
RECLAIM_APP_ID=your_app_id
RECLAIM_APP_SECRET=your_app_secret


PORT=3000
```

### 4. Download zk Circuits 

```bash 
npm run download:circuits
```

### 4. Start the Server

```bash
npm start
```

You should see:
```
🚀 Server is running
📍 Port: 3000
🔗 Webhook endpoint: http://localhost:3000/webhook

✓ Ready to receive Stripe webhooks
```

### 5. Forward Webhooks (Local Testing)

In a **separate terminal**, run:

```bash
stripe listen --forward-to localhost:3000/webhook
```

This will output something like:
```
> Ready! Your webhook signing secret is whsec_xxx...
```

Copy that secret and update your `.env` file's `STRIPE_WEBHOOK_SECRET`.

### 6. Test It Out

Trigger a test payment:

```bash
stripe trigger payment_intent.succeeded
```

Check the `proofs/` directory - you should see a new JSON file with your proof!


## API Endpoints

### `POST /webhook`
Receives Stripe webhook events.

**Headers Required:**
- `stripe-signature` (automatically added by Stripe)

**Response:**
```json
{
  "received": true,
  "eventType": "payment_intent.succeeded",
  "proof": { ... }
}
```

### `POST /generate-proof`
Generates zkFetch proof for a payment event.

**Request Body:**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": { ... }
  }
}
```

**Response:**
```json
{
  "verified": true,
  "payment": { ... },
  "proof": { ... }
}
```

### `GET /`
Health check endpoint.

## The Regex Pattern Explained

```regex
"id":\s*"(?<id>[^"]+)"[\s\S]*?"amount":\s*(?<amount>\d+)[\s\S]*?"currency":\s*"(?<currency>[^"]+)"[\s\S]*?"status":\s*"(?<status>[^"]+)"
```

This captures:
- `id` - Payment intent ID
- `amount` - Amount in cents
- `currency` - Currency code (usd, eur, etc.)
- `status` - Payment status (succeeded, failed, etc.)


## Customizing the Proof

Want to extract different fields? Edit `controllers/proofController.js`:

```javascript
responseMatches: [
  {
    type: 'regex',
    // Add your custom regex here
    value: '"field1":\\s*"(?<field1>[^"]+)"...'
  }
]
```

## Learn More

- [Reclaim Protocol](https://reclaimprotocol.org)
- [Reclaim Protocol Documentation](https://docs.reclaimprotocol.org/)

## License

ISC
