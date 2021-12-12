import axios from 'axios';
import * as express from 'express';
import { Concurrency } from './concurrency';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as prometheusMiddleware from 'express-prometheus-middleware';


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
    this.app.use(prometheusMiddleware());
    // this is called by gateway to check if the service is alive
    // is considered to be internal API
    this.app.get('/api/status', (req, res) => {
      res.send('OK');
    });

    // middleware to limit concurrency
    this.app.use((req, res, next) => {
      // check if limit of concurrency is reached
      if (this.concurrencyManager.limitReached()) {
        return res.status(429).send('Too many requests');
      }

      // We accept this request and increment the task counter
      this.concurrencyManager.increment();

      // simple logic to decrement the task counter only once
      let alreadyEnded = false;
      // callacack that is called when the request is finished or closed
      const handleEnd = () => {
        if (!alreadyEnded) {
          alreadyEnded = true;
          // only decrement once
          this.concurrencyManager.decrement();
        }
        // remove listener to prevent memory leaks
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

  // this is designed to be overridden
  addListeners() {
    throw new Error('Not implemented');
  }

  // service discovery component
  // it will call an internal API from gateway service
  private registerItself() {
    // axios = http requests library
    return axios.post(`${GATEWAY_URI}/api/register-service`, {
      serviceName: this.serviceName,
      serviceUri: `http://${SELF_NAME}:${this.port}`
    });
  }

  // helper methods to send back success response
  // best to have a common implementation for all services
  sendOk(res: express.Response, data?: any) {
    res.json({
      success: true,
      data
    });
  }

  // helper methods to send back fail response
  sendFail(res: express.Response, data?: any) {
    res.status(400).json({
      success: false,
      data
    });
  }
}

