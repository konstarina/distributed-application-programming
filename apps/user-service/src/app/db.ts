import { MongoClient } from 'mongodb';

const uri = `mongodb://${process.env.MONGO_URL || 'localhost:27017'}/user-service?maxPoolSize=20&w=majority&replicaSet=rs0`;

class Database {

  client = new MongoClient(uri);

  // get database instance
  get db() {
    return this.client.db();
  }

  // it is called on application startup
  async init() {
    // establish actual connection to the database
    await this.client.connect();
    console.log('Connected successfully to database');
  }

  async addUser(user: {
    name: string;
    phoneNumber: string;
  }) {
    // select collection of name users
    // it will create it if it does not exist
    const collection = this.db.collection('users');
    // insert the new user and get a reference to the inserted document
    const doc = await collection.insertOne(user);

    // return the newly inserted document
    return collection.findOne({ _id: doc.insertedId });
  }


  async findUser({ name, phoneNumber }: { name?: string; phoneNumber?: string}) {
    // select collection of name users
    const collection = this.db.collection('users');
    // create the actual query object
    const query: any = {};
    if (name) {
      query.name = name;
    }
    if (phoneNumber) {
      query.phoneNumber = phoneNumber;
    }
    return collection.findOne(query);
  }

}

const dbInstance = new Database();

export { dbInstance as Database };
