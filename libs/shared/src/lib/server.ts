import axios from 'axios';
import * as express from 'express';
import { Concurrency } from './concurrency';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';


const GATEWAY_URI = process.env.GATEWAY_URI || 'http://localhost:3333';
const SELF_NAME = process.env.SELF_NAME || 'localhost';

export class BaseServer {
  private concurrencyManager = new Concurrency(5);
  app = express();

  constructor(
    private serviceName: string,
    private port: number|string
  ) {}

  async init() {

    this.app.use(morgan('tiny'));
    this.app.use(bodyParser.json());
    this.app.get('/api/status', (req, res) => {
      res.send('OK');
    });

    this.app.use((req, res, next) => {
      if (this.concurrencyManager.limitReached()) {
        return res.status(429).send('Too many requests');
      }

      this.concurrencyManager.increment();

      let alreadyEnded = false;
      const handleEnd = () => {
        if (!alreadyEnded) {
          alreadyEnded = true;
          this.concurrencyManager.decrement();
        }
        res.removeListener('finish', handleEnd);
        res.removeListener('close', handleEnd);
      };
      res.once('finish', handleEnd);
      res.once('close', handleEnd);
      next();
    });

    this.addListeners();

    this.app.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`);
    });
    this.app.on('error', console.error);

    // this.app.use((req, res, next) => {
    //   this.concurrencyManager.decrement();
    //   next();
    // });

    await this.registerItself();
  }

  addListeners() {
    throw new Error('Not implemented');
  }

  private registerItself() {
    return axios.post(`${GATEWAY_URI}/api/register-service`, {
      serviceName: this.serviceName,
      serviceUri: `http://${SELF_NAME}:${this.port}`
    });
  }

  sendOk(res: express.Response, data?: any) {
    res.json({
      success: true,
      data
    });
  }

  sendFail(res: express.Response, data?: any) {
    res.status(400).json({
      success: false,
      data
    });
  }
}

