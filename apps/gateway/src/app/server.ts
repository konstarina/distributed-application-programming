import * as bodyParser from 'body-parser';
import * as express from 'express';
import axios from 'axios';
import { createProxyMiddleware } from 'http-proxy-middleware';


const PORT = process.env.PORT || 3333;

class Server {

  private roundRobinCounters = new Map<string, number>();
  private services = new Map<string, Set<string>>();

  app = express();

  async init() {
    this.app.use(bodyParser.json());

    this.addListeners();
    this.startHealthCheck();

    this.app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
    this.app.on('error', console.error);
  }

  private addListeners() {
    this.app.get('/api/status', (req, res) => {
      res.send('OK');
    });


    this.app.post('/api/register-service', (req, res) => {
      const { serviceUri, serviceName } = req.body;

      this.addService(serviceName, serviceUri);

      res.json({ success: true });
      console.log('Service registered successfully');
    });

    this.app.use('/user', this.setupProxy('/user', 'user-service'));
    this.app.use('/payment', this.setupProxy('/payment', 'payment-service'));
    this.app.use('/trip', this.setupProxy('/trip', 'trip-service'));
  }

  private setupProxy(basePath: string, serviceName: string) {
    return createProxyMiddleware({
      router: () => {
        let counter = this.roundRobinCounters.get(serviceName) || 0;
        const servicesLength = this.services.get(serviceName)?.size || 0;
        if (counter + 1 > servicesLength - 1) {
          counter = 0;
        } else {
          counter++;
        }

        this.roundRobinCounters.set(serviceName, counter);
        const serviceUrl = [...this.services.get(serviceName)][counter];
        return serviceUrl;
      },
      logLevel: 'debug',
      proxyTimeout: 10000,
      pathRewrite: {
        [`^${basePath}`]: ''
      },
      onError: (err, req, res, target: any) => {
        const serviceUrlToRemove = `${target.protocol}//${target.host}`;
        this.removeService(serviceUrlToRemove);
      }
    });
  }
  
  private startHealthCheck() {
    const runHealthCheck = () => {
      this.services.forEach(async (list) => {
        list.forEach(async (uri) => {

          try {
            const response = await axios.get(`${uri}/api/status`);
    
            if (response.data !== 'OK') {
              throw new Error('Service is not responding');
            }
          } catch (error) {
            console.log(error.message, uri);
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
