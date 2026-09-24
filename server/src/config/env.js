import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(configDirectory, "../../.env") });

const port = Number.parseInt(process.env.PORT ?? "5000", 10);

if (Number.isNaN(port) || port <= 0) {
  throw new Error("PORT must be a positive integer.");
}

const env = {
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port,
};

export default env;
