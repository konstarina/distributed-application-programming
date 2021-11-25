import { Database } from '.';
import { BaseServer } from '@lab-pad/shared';


const PORT = process.env.PORT || 3000;

class Server extends BaseServer {

  addListeners() {
    this.app.get('/location/get', async (req, res) => {
      const { driverId } = req.query as any;
      if (!driverId) {
        return this.sendFail(res, {
          message: 'Please enter driverId'
        });
      }

      const location = await Database.getDriverLocation(driverId);
      return this.sendOk(res, location);
    });

    this.app.post('/location/push', async (req, res) => {
      const { driverId, lat, lon } = req.body;
      if (!driverId || !lat || !lon) {
        return this.sendFail(res, {
          message: 'Please enter driverId, lat and lon'
        });
      }

      const location = await Database.pushLocation(req.body);
      return this.sendOk(res, location);
    });
  }
}

const instance = new Server('trip-service', PORT);

export { instance as Server };
