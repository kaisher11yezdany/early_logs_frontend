const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // In production, MONGO_URI must be set — no fallback
    if (process.env.NODE_ENV === 'production') {
      if (!uri) {
        throw new Error('MONGO_URI environment variable is not set. Add it in your Railway/Render dashboard.');
      }
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }

    // In development: try real URI first, fall back to in-memory
    if (!uri || uri.includes('localhost')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('🧪 Using in-memory MongoDB (demo mode)');
        process.on('beforeExit', async () => { await mongod.stop(); });
      } catch (memErr) {
        console.warn('⚠️  Could not start in-memory MongoDB:', memErr.message);
        if (!uri) throw new Error('No MongoDB URI available. Set MONGO_URI in .env');
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
