require('dotenv').config();
const express = require('express');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Use routes
app.use(routes);

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Server is running');
  console.log(`Port: ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log('\nReady to receive Stripe webhooks\n');
});
