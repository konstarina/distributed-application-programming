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

      const user = await Database.getDriverLocation(driverId);
      return this.sendOk(res, user);
    });

    this.app.post('/location/push', (req, res) => {
      const { driverId, lat, lon } = req.body;
      if (!driverId || !lat || !lon) {
        return this.sendFail(res, {
          message: 'Please enter driverId, lat and lon'
        });
      }

      const user = Database.pushLocation(req.body);
      return this.sendOk(res, user);
    });
  }
}

const instance = new Server('user-service', PORT);

export { instance as Server };
