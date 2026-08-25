import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Connect mongoose
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  try {
    await mongoose.connection.dropDatabase();
  } catch (e) {
    // ignore
  }
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});
