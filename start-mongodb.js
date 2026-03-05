import { MongoMemoryServer } from 'mongodb-memory-server';

async function startMongoDB() {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  console.log('MongoDB Memory Server started');
  console.log('Connection URI:', mongoUri);
  console.log('\nUpdate your .env file with:');
  console.log(`MONGODB_URI=${mongoUri}`);
  console.log('\nKeep this terminal open while developing!');

  // Keep the server running
  process.on('SIGINT', async () => {
    await mongoServer.stop();
    process.exit(0);
  });
}

startMongoDB().catch(err => {
  console.error('Failed to start MongoDB Memory Server:', err);
  process.exit(1);
});
