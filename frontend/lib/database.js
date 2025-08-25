// database.js
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("Please define MONGODB_URI");
console.log()
global._mongoose = global._mongoose || { conn: null, promise: null, bucket: null };

export async function connectToDatabase() {
  if (global._mongoose.conn) {
    console.log("✅ Using existing MongoDB connection");
    return { db: global._mongoose.conn.connection.db, bucket: global._mongoose.bucket };
  }

  if (!global._mongoose.promise) {
    global._mongoose.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,   // fail fast instead of buffering
      autoIndex: true,         // optional, helps in dev
    }).then(mongooseInstance => {
      console.log("✅ MongoDB connected");

      const bucket = new GridFSBucket(mongooseInstance.connection.db, {
        bucketName: "uploads",
      });

      global._mongoose.bucket = bucket;
      return mongooseInstance;
    }).catch(err => {
      console.error("❌ MongoDB connection error:", err);
      throw err;
    });
  }

  global._mongoose.conn = await global._mongoose.promise;
  return { db: global._mongoose.conn.connection.db, bucket: global._mongoose.bucket };
}
