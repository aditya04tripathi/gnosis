import type { Mongoose } from "mongoose";
import mongoose from "mongoose";

console.log("MONGODB_URI:", process.env.MONGODB_URI);

const MONGODB_URI: string =
  process.env.MONGODB_URI || "mongodb://localhost:27017/startup-validator";

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// Global cache for mongoose connection
const globalForMongoose = globalThis as unknown as {
  mongooseCache: MongooseCache | undefined;
};

const cached: MongooseCache = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalForMongoose.mongooseCache) {
  globalForMongoose.mongooseCache = cached;
}

async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
