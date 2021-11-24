import { MongoClient } from 'mongodb';

const uri = 'mongodb://admin:pass@localhost:27017/trip-service?maxPoolSize=20&w=majority&authSource=admin';

class Database {

  client = new MongoClient(uri);

  get db() {
    return this.client.db();
  }

  async init() {
    await this.client.connect();
    console.log('Connected successfully to database');
  }

  async pushLocation(payload: {
    driverId: string;
    lat: number;
    lon: number;
  }) {
    const collection = this.db.collection('location');
    const doc = await collection.insertOne({ ...payload, createdAt: new Date()});

    return collection.findOne({ _id: doc.insertedId });
  }

  async getDriverLocation(driverId: string) {
    const collection = this.db.collection('location');
    return collection.findOne({
      driverId
    }, { sort: { createdAt: -1 } });
  }

}

const dbInstance = new Database();

export { dbInstance as Database };
