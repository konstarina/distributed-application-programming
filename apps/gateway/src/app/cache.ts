import axiosFactory from 'axios';
import * as http from 'http';
import * as https from 'https';

const CACHE_URI = process.env.CACHE_URI || 'http://localhost:4444';

const axios = axiosFactory.create({
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
});

class Cache {
  async get(key: string) {
    const res = await axios.get(`${CACHE_URI}/get`, {
      params: { key }
    });

    return res.data.data;
  }

  async set(key: string, value: any) {
    await axios.post(`${CACHE_URI}/set`, { key, value });
  }
}

const instance = new Cache();
export { instance as Cache };
