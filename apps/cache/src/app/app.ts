import * as express from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';

const PORT = process.env.PORT || 4444;


export class App {
  app = express();
  cache = new Map<string, any>();

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
      const val = this.cache.get(req.query.key as string);
      res.json({ data: val });
    });

    this.app.post('/set', (req, res) => {
      this.cache.set(req.body.key, req.body.value);
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
