import * as express from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';

const PORT = process.env.PORT || 4444;
const CACHE_TTL = 5000; // 5 seconds;


export class App {
  // http server
  app = express();
  cache = new Map<string, any>();

  // ttl = time to live
  // key = cache key
  // value = time when it will expire
  cacheTTL = new Map<string, number>();

  init() {
    this.app.use(morgan('tiny')); // http logging library
    this.app.use(bodyParser.json()); // parse json in post/put requests
    // register a health check endpoint
    this.app.get('/api/status', (req, res) => {
      res.send('OK');
    });

    // start and bind server to a port
    this.app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
    // add an error handler
    this.app.on('error', console.error);

    // add a route to get a value from cache
    this.app.get('/get', (req, res) => {
      // query param example: key=myKey
      // http://localhost:4444/get?key=myKey
      const key = req.query.key as string;

      const val = this.cache.get(key);
      const expireDate = this.cacheTTL.get(key) || -1;
      // check if the value is already expired
      if (expireDate < Date.now()) {
        // when it expires, remove it from cache
        // and also remove it from the ttl map
        this.cacheTTL.delete(key);
        this.cache.delete(key);
        // return empty response because it is expired
        return res.json({ data: null, expired: true });
      }

      // return the value
      // it is not expired
      res.json({ data: val, expired: false });
    });

    // add a route to set a value in cache
    this.app.post('/set', (req, res) => {
      // extract key and value from body and set it in cache
      this.cache.set(req.body.key, req.body.value);
      // also set new cache expiration time
      this.cacheTTL.set(req.body.key, Date.now() + CACHE_TTL);
      res.send('OK');
    });

    // add a route to check cache current values
    this.app.get('/cache-status', (req, res) => {
      res.json({
        keys: [...this.cache.keys()],
        size: this.cache.size
      });
    });
  }
}
