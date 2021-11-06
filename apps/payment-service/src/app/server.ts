import axios from 'axios';
import * as express from 'express';
import { Database } from '.';


const PORT = process.env.PORT || 3000;
const GATEWAY_URI = process.env.GATEWAY_URI || 'http://localhost:3333';

class Server {

  app = express();

  async init() {
    this.addListeners();

    this.app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
    this.app.on('error', console.error);

    await this.registerItself();
  }

  private addListeners() {
    this.app.get('/api/status', (req, res) => {
      res.send('OK');
    });

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

  private registerItself() {
    return axios.post(`${GATEWAY_URI}/api/register-service`, {
      serviceName: 'user-service',
      serviceUri: `http://localhost:${PORT}`
    });
  }

  private sendOk(res: express.Response, data?: any) {
    res.json({
      success: true,
      data
    });
  }

  private sendFail(res: express.Response, data?: any) {
    res.status(400).json({
      success: false,
      data
    });
  }
}

const instance = new Server();

export { instance as Server };
