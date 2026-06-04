import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/micro-google-drive';

async function clearUsers() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const emailsToDelete = [
    'surajtakkallapelly@gmail.com',
    'collab-suraj@example.com'
  ];

  console.log('Deleting users:', emailsToDelete);
  const res = await mongoose.connection.collection('users').deleteMany({
    email: { $in: emailsToDelete }
  });
  console.log(`Deleted ${res.deletedCount} users.`);

  await mongoose.disconnect();
  console.log('Disconnected.');
}

clearUsers().catch(console.error);
