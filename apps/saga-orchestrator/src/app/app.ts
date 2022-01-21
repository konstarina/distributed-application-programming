import { Redis } from '@lab-pad/shared'

const REDIS_HOST = process.env.REDIS_HOST || 'localhost:6379';

export class App {
  redis = new Redis(REDIS_HOST);

  async init() {
    await this.redis.init();
    console.log('Redis ready');


    this.redis.events.on('saga-event', (payload: any) => {
      console.log('saga event', payload);
      this.handleSagaEvent(payload.type, payload.value);
    });
  }

  private handleSagaEvent(event: string, payload: any) {
    switch (event) {
      case 'USER_CREATED':
        this.redis.emit('SEND_EMAIL', payload); // not implemented right now. An email service will send an email
        break;

      case 'PAYMENT_CONFIRMED':
        this.redis.emit('END_RIDE', payload);
        break;
    
      default:
        break;
    }
  }
}