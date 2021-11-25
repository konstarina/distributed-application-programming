import { MongoClient } from 'mongodb';

const uri = `mongodb://admin:pass@${process.env.MONGO_URL || 'localhost'}:27017/trip-service?maxPoolSize=20&w=majority&authSource=admin`;

class Database {

  client = new MongoClient(uri);

  get db() {
    return this.client.db();
  }

  async init() {
    await this.client.connect();
    console.log('Connected successfully to database');
  }

  // drivers will send their latest location once in 5 seconds for example
  // we will store it in the database and we can use it to calculate the distance and the path
  async pushLocation(payload: {
    driverId: string;
    lat: number;
    lon: number;
  }) {
    const collection = this.db.collection('location');
    const doc = await collection.insertOne({ ...payload, createdAt: new Date()});

    return collection.findOne({ _id: doc.insertedId });
  }

  // get the latest known location of a driver
  async getDriverLocation(driverId: string) {
    const collection = this.db.collection('location');
    return collection.findOne({
      driverId
    }, { sort: { createdAt: -1 } }); // sort order is descending
  }

}

const dbInstance = new Database();

export { dbInstance as Database };
