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

    this.app.get('/api/user', async (req, res) => {
      const { name, phoneNumber } = req.query as any;
      if (!name && !phoneNumber) {
        return this.sendFail(res, {
          message: 'Please enter a name and phone number'
        });
      }

      const user = await Database.findUser({ name, phoneNumber });
      return this.sendOk(res, user);
    });

    this.app.post('/api/user', (req, res) => {
      const { name, phoneNumber } = req.body;
      if (!name || !phoneNumber) {
        return this.sendFail(res, {
          message: 'Please enter a name and phone number'
        });
      }

      const user = Database.addUser(req.body);
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
