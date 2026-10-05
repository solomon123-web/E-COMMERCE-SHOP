import app from './app';
import { env } from './config/env';

const port = env.port;

console.log(`[Paystack] Secret key configured: ${env.paystackSecretKey ? 'yes' : 'no'}`);

app.listen(port, '0.0.0.0', () => {
  console.log(`Lumora API running on http://0.0.0.0:${port}`);
});
