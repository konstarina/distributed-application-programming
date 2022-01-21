import { Database } from '.';
import { BaseServer } from '@lab-pad/shared';


const PORT = process.env.PORT || 3000;

class Server extends BaseServer {

  addListeners() {
    // public api
    // designed to be called by clients
    this.app.get('/api/user', async (req, res) => {
      // get query params name and phoneNumber
      const { name, phoneNumber } = req.query as any;
      // simple data validation
      if (!name && !phoneNumber) {
        return this.sendFail(res, {
          message: 'Please enter a name and phone number'
        });
      }

      const user = await Database.findUser({ name, phoneNumber });
      return this.sendOk(res, user);
    });

    // public api
    // designed to be called by clients
    this.app.post('/api/user', async (req, res) => {
      const { name, phoneNumber } = req.body;
      if (!name || !phoneNumber) {
        return this.sendFail(res, {
          message: 'Please enter a name and phone number'
        });
      }

      const user = await Database.addUser(req.body);
      this.redis.emit('USER_CREATED', { user });
      return this.sendOk(res, user);
    });
  }
}

const instance = new Server('user-service', PORT);

export { instance as Server };
