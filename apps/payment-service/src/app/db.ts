import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb://admin:pass@${process.env.MONGO_URL || 'localhost'}:27017/payment-service?maxPoolSize=20&w=majority&authSource=admin`;

class Database {

  client = new MongoClient(uri);

  get db() {
    return this.client.db();
  }

  async init() {
    await this.client.connect();
    console.log('Connected successfully to database');
  }

  // client will send the payment intent and the amount
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

  // update payment status
  async updateIntentStatus(intentId: string, status: string) {
    const collection = this.db.collection('intents');
    // find and update one payment intent
    // find by _id and use $set operator to update the status
    await collection.updateOne({ _id: new ObjectId(intentId) }, { $set: { status } });

    return this.findPaymentIntent(intentId);
  }

  async findPaymentIntent(intentId: string) {
    const collection = this.db.collection('intents');
    return collection.findOne({ _id: new ObjectId(intentId) });
  }

}

const dbInstance = new Database();

export { dbInstance as Database };
