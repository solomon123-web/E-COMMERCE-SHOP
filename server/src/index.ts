import app from './app';
import { env } from './config/env';

const port = env.port;

console.log(`[Paystack] Secret key configured: ${env.paystackSecretKey ? 'yes' : 'no'}`);

app.listen(port, () => {
  console.log(`Lumora API running on http://localhost:${port}`);
});
