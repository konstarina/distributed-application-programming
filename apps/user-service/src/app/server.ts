import { Database } from '.';
import { BaseServer } from '@lab-pad/shared';


const PORT = process.env.PORT || 3000;

class Server extends BaseServer {

  addListeners() {
    this.app.get('/api/user', async (req, res) => {
      const { name, phoneNumber } = req.query as any;
      if (!name && !phoneNumber) {
        return this.sendFail(res, {
          message: 'Please enter a name and phone number'
        });
      }

      const user = await Database.findUser({ name, phoneNumber });
      return this.sendOk(res, user);
    });

    this.app.post('/api/user', async (req, res) => {
      const { name, phoneNumber } = req.body;
      if (!name || !phoneNumber) {
        return this.sendFail(res, {
          message: 'Please enter a name and phone number'
        });
      }

      const user = await Database.addUser(req.body);
      return this.sendOk(res, user);
    });
  }
}

const instance = new Server('user-service', PORT);

export { instance as Server };
