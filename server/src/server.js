import app from "./app.js";
import { connectToDatabase } from "./config/database.js";
import env from "./config/env.js";

async function startServer() {
  try {
    await connectToDatabase();

    app.listen(env.port, () => {
      console.info(`TruthLens API listening on port ${env.port}.`);
    });
  } catch (error) {
    console.error("Unable to start the TruthLens API.", error);
    process.exitCode = 1;
  }
}

startServer();
