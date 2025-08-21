import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI
console.log("Connecting to:", MONGODB_URI);

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Global caching (important for Next.js or serverless)
global.mongoose = global.mongoose || { conn: null, bucket: null, promise: null };

export async function connectToDatabase() {
  if (global.mongoose.conn) {
    console.log("✅ Using existing MongoDB connection");
    return { db: global.mongoose.conn, bucket: global.mongoose.bucket };
  }

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(MONGODB_URI, {}).then((mongooseInstance) => {
      const { connection } = mongooseInstance;

      // Log connection events
      connection.on("connected", () => {
        console.log("✅ MongoDB connected");
      });

      connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
      });

      connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected");
      });

      const bucket = new GridFSBucket(connection.db, {
        bucketName: "uploads",
      });

      return { db: connection, bucket };
    });
  }

  const { db, bucket } = await global.mongoose.promise;
  global.mongoose.conn = db;
  global.mongoose.bucket = bucket;

  return { db, bucket };
}
