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
        userAgent: req.headers['user-agent'] // also save client user agent 
      });
      return this.sendOk(res, user);
    });

    this.app.post('/api/payment/confirm', async (req, res) => {
      const { intentId, paymentStatus } = req.body;
      if (!intentId || !paymentStatus) {
        return this.sendFail(res, {
          message: 'Please provide intentId and paymentStatus'
        });
      }

      const status = await Database.updateIntentStatus(intentId, paymentStatus);
      return this.sendOk(res, status);
    });

    this.app.get('/api/payment/intent', async (req, res) => {
      const intentId = req.query.intentId as string;
      if (!intentId) {
        return this.sendFail(res, {
          message: 'Please provide intentId'
        });
      }

      const intent = await Database.findPaymentIntent(intentId);
      return this.sendOk(res, intent);
    });
  }
}

const instance = new Server('payment-service', PORT);

export { instance as Server };
