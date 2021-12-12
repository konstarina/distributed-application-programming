import * as EventEmitter from 'events';
import * as redis from 'redis';

const REDIS_CHANNEL = 'app';

export class Redis {
  events = new EventEmitter();
  client = redis.createClient({ url: `redis://${this.redisHost}` });
  private pub = redis.createClient({ url: `redis://${this.redisHost}` });
  private sub = redis.createClient({ url: `redis://${this.redisHost}` });

  constructor(private redisHost: string) {}

  async init() {
    this.client.on('error', (err) => {
      console.log('REDIS client error', err);
    });
    this.pub.on('error', (err) => {
      console.log('REDIS pub error', err);
    });
    this.sub.on('error', (err) => {
      console.log('REDIS sub error', err);
    });

    const ready = await Promise.all([
      this.client.connect(),
      this.sub.connect(),
      this.pub.connect(),
    ]);

    this.sub.subscribe(REDIS_CHANNEL, (msg, ch) => {
      try {
        const parsedMsg = JSON.parse(msg);
        if (parsedMsg.type) {
          this.events.emit('saga-event', parsedMsg);
        }
      } catch (error) {
        console.warn('[REDIS pubsub ERROR]', error);
      }
    });

    await this.enableNotifications();

    return ready;
  }

  async stop() {
    this.client.quit();
    this.pub.quit();
    this.sub.quit();
    return new Promise((resolve) => setTimeout(resolve, 1000));
  }

  emit(type: string, value: any = {}) {
    const msg = JSON.stringify({ type, value });
    this.pub.publish(REDIS_CHANNEL, msg);
  }

  private async enableNotifications() {
    try {
      const config = await this.client.configGet('notify-keyspace-events');
      if (config['notify-keyspace-events'] !== 'KEl') {
        await this.client.configSet('notify-keyspace-events', 'KEl');
      }
    } catch (error) {
      console.warn(error);
    }
  }
}
