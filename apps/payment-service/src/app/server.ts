import { Database } from '.';
import { BaseServer } from '@lab-pad/shared';

const PORT = process.env.PORT || 3000;

class Server extends BaseServer {

  addListeners() {
    this.app.post('/api/payment/register-intent', async (req, res) => {
      const { fingerprint, amount, currency, userId } = req.body as any;
      if (!fingerprint || !amount || !currency || !userId) {
        return this.sendFail(res, {
          message: 'Please submit fingerprint, amount, userId and currency'
        });
      }

      const user = await Database.registerPaymentIntent({
        fingerprint,
        amount,
        currency,
        userId,
        userAgent: req.headers['user-agent']
      });
      return this.sendOk(res, user);
    });

    this.app.post('/api/payment/confirm', (req, res) => {
      const { intentId, paymentStatus } = req.body;
      if (!intentId || !paymentStatus) {
        return this.sendFail(res, {
          message: 'Please provide intentId and paymentStatus'
        });
      }

      const user = Database.updateIntentStatus(intentId, paymentStatus);
      return this.sendOk(res, user);
    });

    this.app.get('/api/payment/intent', (req, res) => {
      const { intentId } = req.body;
      if (!intentId) {
        return this.sendFail(res, {
          message: 'Please provide intentId'
        });
      }

      const user = Database.findPaymentIntent(intentId);
      return this.sendOk(res, user);
    });
  }
}

const instance = new Server('payment-service', PORT);

export { instance as Server };
