import { MongoMemoryServer } from 'mongodb-memory-server'

const mongod = await MongoMemoryServer.create({
  instance: { port: 27018, dbName: 'linguanest-qa' },
})
const uri = mongod.getUri()
console.log(`QA_MONGO_URI=${uri}`)

process.on('SIGTERM', async () => {
  await mongod.stop()
  process.exit(0)
})

// Keep the process alive indefinitely so the in-memory instance stays up
await new Promise(() => {})
