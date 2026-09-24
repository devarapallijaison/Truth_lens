import mongoose from "mongoose";
import env from "./env.js";

export async function connectToDatabase() {
  if (!env.mongoUri || env.mongoUri.includes("<username>") || env.mongoUri.includes("<cluster-url>")) {
    console.warn(
      "MONGODB_URI is not configured with valid credentials. The server will run with memory fallback for demonstration.",
    );
    return;
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.info("Connected to MongoDB.");
  } catch (error) {
    console.error("Failed to connect to MongoDB. Running with memory fallback:", error.message);
  }
}

export function getDatabaseStatus() {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}

