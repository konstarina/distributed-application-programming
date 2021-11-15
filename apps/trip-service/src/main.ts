
import { Database, Server } from './app';


async function init() {
  await Database.init();
  await Server.init();
}


init();