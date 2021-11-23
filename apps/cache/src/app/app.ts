import * as express from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';

const PORT = process.env.PORT || 4444;
const CACHE_TTL = 5000; // 5 seconds;


export class App {
  app = express();
  cache = new Map<string, any>();
  cacheTTL = new Map<string, number>();

  init() {
    this.app.use(morgan('tiny'));
    this.app.use(bodyParser.json());
    this.app.get('/api/status', (req, res) => {
      res.send('OK');
    });

    this.app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
    this.app.on('error', console.error);

    this.app.get('/get', (req, res) => {
      const key = req.query.key as string;

      const val = this.cache.get(key);
      const expireDate = this.cacheTTL.get(key) || -1;
      if (expireDate < Date.now()) {
        this.cacheTTL.delete(key);
        this.cache.delete(key);
        return res.json({ data: null, expired: true });
      }

      res.json({ data: val, expired: false });
    });

    this.app.post('/set', (req, res) => {
      this.cache.set(req.body.key, req.body.value);
      this.cacheTTL.set(req.body.key, Date.now() + CACHE_TTL);
      res.send('OK');
    });

    this.app.get('/cache-status', (req, res) => {
      res.json({
        keys: [...this.cache.keys()],
        size: this.cache.size
      });
    });
  }
}
