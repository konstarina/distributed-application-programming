import { MongoClient } from 'mongodb';

const uri = 'mongodb://admin:pass@localhost:27017/user-service?maxPoolSize=20&w=majority&authSource=admin';

class Database {

  client = new MongoClient(uri);

  get db() {
    return this.client.db();
  }

  async init() {
    await this.client.connect();
    console.log('Connected successfully to server');
  }

  async addUser(user: {
    name: string;
    phoneNumber: string;
  }) {
    const collection = this.db.collection('users');
    const doc = await collection.insertOne(user);

    return collection.findOne({ _id: doc.insertedId });
  }

  async findUser(criteria: { name?: string; phoneNumber?: string}) {
    const collection = this.db.collection('users');
    return collection.findOne(criteria);
  }

}

const dbInstance = new Database();

export { dbInstance as Database };
