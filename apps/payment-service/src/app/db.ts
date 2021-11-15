import { MongoClient } from 'mongodb';

const uri = 'mongodb://admin:pass@localhost:27017/payment-service?maxPoolSize=20&w=majority&authSource=admin';

class Database {

  client = new MongoClient(uri);

  get db() {
    return this.client.db();
  }

  async init() {
    await this.client.connect();
    console.log('Connected successfully to database');
  }

  async registerPaymentIntent(intent: {
    fingerprint: string,
    amount: string,
    currency: string,
    userId: string,
    userAgent: string
  }) {
    const collection = this.db.collection('intents');
    const doc = await collection.insertOne({
      ...intent,
      status: 'pending'
    });

    return collection.findOne({ _id: doc.insertedId });
  }

  async updateIntentStatus(intentId: string, status: string) {
    const collection = this.db.collection('intents');
    collection.updateOne({ _id: intentId }, { $set: { status } });

    return this.findPaymentIntent(intentId);
  }

  async findPaymentIntent(intentId: string) {
    const collection = this.db.collection('intents');
    return collection.findOne({ _id: intentId });
  }

}

const dbInstance = new Database();

export { dbInstance as Database };
