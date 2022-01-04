import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as morgan from 'morgan';
import axios from 'axios';
import * as prometheusMiddleware from 'express-prometheus-middleware';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { Cache } from './cache';

const PORT = process.env.PORT || 3333;

class Server {

  // we keep the round robin counters mapped by service name
  private roundRobinCounters = new Map<string, number>();
  // we keep the services mapped by service name
  // theses services are the ones we want to proxy
  // the key is the service name
  // the value is a set of uris
  private services = new Map<string, Set<string>>();

  app = express();

  async init() {
    this.addListeners();
    this.startHealthCheck();

    this.app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
    this.app.on('error', console.error);
  }

  private addListeners() {
    this.app.use(morgan('tiny'));
    this.app.use(prometheusMiddleware());

    // this one is probably a public method to get the service status
    this.app.get('/api/status', (req, res) => {
      res.send('OK');
    });

    // setup proxy for all the services
    // try to use cache for get requests for each one of them using a middleware
    // the cache is a simple in memory cache
    // the cache is not persistent
    // gateway knows where to redirect traffic based on path of the request
    // for example:
    // http://localhost:3333/trip/location/get?driverId=123 will send this to user service
    // because the path has /user in it
    this.app.use('/user', this.tryUseCache(), this.setupProxy('/user', 'user-service'));
    this.app.use('/payment', this.tryUseCache(), this.setupProxy('/payment', 'payment-service'));
    this.app.use('/trip', this.tryUseCache(), this.setupProxy('/trip', 'trip-service'));

    this.app.use(bodyParser.json());

    // internal API
    // used by services to register themselves
    this.app.post('/api/register-service', (req, res) => {
      const { serviceUri, serviceName } = req.body;

      this.addService(serviceName, serviceUri);

      res.json({ success: true });
      console.log(`Service ${serviceName} at ${serviceUri} registered successfully`);
    });
  }

  private tryUseCache() {
    return async function(req: express.Request, res: express.Response, next: () => void) {
      if (req.method === 'GET') {
        const cacheKey = req.originalUrl;
        const data = await Cache.get(cacheKey);
        if (data) {
          if (typeof data === 'string') {
            return res.send(data);
          } else {
            return res.json({
              success: true,
              data
            });
          }

        }
      }

      next();
    }
  }

  private setupProxy(basePath: string, serviceName: string) {
    return async (req: express.Request, res: express.Response, next: () => void) => {
      const servicesLength = this.services.get(serviceName)?.size || 0;
      // We will try to send at least one request to all registered services
      // If they will all fail, trip and send error
      let retries = servicesLength - 1;

      function retry() {
        return proxyMiddleware(req, res, next);
      }

      // create an instance of proxy middleware with custom error handler and retry logic
      const proxyMiddleware = this.setupProxyMiddleware(basePath, serviceName, () => {
        if (retries <= 0) {
          return res.status(500).send('No service is able to process the request');
        }

        console.log('retrying another service');
        retries--;
        retry();
      });

      retry();
    };
  }

  private setupProxyMiddleware(basePath: string, serviceName: string, onError: () => void) {
    return createProxyMiddleware({
      // this is called when a new request comes in
      // this function is used to select the base path of the request url
      // base path is for example: http://localhost:3333
      // here is also the logic of load balancer using round robin
      router: () => {
        // get the current round robin counter for this service
        let counter = this.roundRobinCounters.get(serviceName) || 0;
        // get the number of services of this type
        const servicesLength = this.services.get(serviceName)?.size || 0;

        // check if we can increment the round robin
        if (counter + 1 > servicesLength - 1) {
          // if not reset the counter, so we will redirect to first server in list
          counter = 0;
        } else {
          // we are good to go to increment the counter
          // we have enough servers to handle the load
          counter++;
        }

        // save the new counter
        this.roundRobinCounters.set(serviceName, counter);
        // get the uri of the server we want to proxy to based on the newly incremented counter
        const serviceUrl = [...(this.services.get(serviceName) || [])][counter];
        return serviceUrl;
      },
      logLevel: 'debug',
      // if a service will not respond in 10 seconds, it will throw an error
      // at this point we will deregister the service from load balancing
      // because we consider it as unavailable/down
      proxyTimeout: 10000,
      // we need to rewrite the path of the request
      // for example:
      // we call the gateway like so http://localhost:3333/trip/location/get?driverId=123
      // but we need to proxy to http://localhost:3000/location/get?driverId=123
      // path rewrite will remove the /trip part of the url
      // and the above function router will replace the basepath with the service url
      pathRewrite: {
        [`^${basePath}`]: ''
      },

      // gets called when we have an error of any kind
      onError: (err, req, res, target: any) => {
        // const serviceUrlToRemove = `${target.protocol}//${target.host}`;
        // this.removeService(serviceUrlToRemove);
        onError();
      },

      // used to intercept the response from the service
      // but before the response is send back to the client
      // convert the response to json and save it in cache
      // only save for GET requests
      selfHandleResponse: true, // needed to await the response
      onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        const cacheKey = (req as any).originalUrl;
        if (req.method === 'GET') {
          // by default the response is a buffer
          // we convert it to a string representation of a json
          // because we know that our services are sending back a json payload
          const data = responseBuffer.toString();
          try {
            const json = JSON.parse(data);
            await Cache.set(cacheKey, json.data);
          } catch (error) {
            await Cache.set(cacheKey, data);
          }
        }

        // we change nothing, just return back the original response from the service
        return responseBuffer;
      })
    });
  }

  // this is a mechanism to check that services are alive and well
  // will check status endpoint each 5 seconds for each service
  // if a service is down or for some reason is not responding
  // we will print an error message and remove the service from load balancer
  private startHealthCheck() {
    const runHealthCheck = () => {
      this.services.forEach(async (list) => {
        list.forEach(async (uri) => {

          try {
            // make the status request to the service
            const response = await axios.get(`${uri}/api/status`);

            // check if the response is OK
            // response other that OK is considered an error
            if (response.data !== 'OK') {
              throw new Error('Service is not responding');
            }
          } catch (error) {
            console.log(error.message, uri);
            // remove the service from load balancer on error
            this.removeService(uri);
          }
        });
      });
    }

    setInterval(runHealthCheck, 5000);
  }

  private addService(serviceName: string, serviceUri: string) {
    const serviceList: Set<string> = this.services.get(serviceName) || new Set();
    serviceList.add(serviceUri);

    this.services.set(serviceName, serviceList);
  }

  private removeService(serviceUri: string) {
    for (const [_, serviceList] of this.services) {
      for (const uri of serviceList) {
        if (uri === serviceUri) {
          serviceList.delete(uri);
        }
      }
    }
  }

}

const instance = new Server();

export { instance as Server };
