import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';

  // CI provides a real, long-lived MongoDB service container (see .github/workflows) instead
  // of each of the 16 test files spinning up its own MongoMemoryServer instance - that was
  // repeatedly flaky under the shared runner's resource constraints (slow/failed startups,
  // unexpected process exits). Local development has no such container, so it falls back to
  // MongoMemoryServer there. A random per-file database name keeps the 16 files, all sharing
  // one real mongod now, from colliding with each other's data.
  const baseUri = process.env.MONGODB_TEST_URI;
  if (baseUri) {
    const dbName = `linguanest-test-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
    await mongoose.connect(`${baseUri}/${dbName}`);
  } else {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
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
