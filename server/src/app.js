import cors from "cors";
import express from "express";
import env from "./config/env.js";
import { getDatabaseStatus } from "./config/database.js";
import claimsRouter from "./routes/claims.js";

import { getClaims } from "./services/claimService.js";

const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    database: getDatabaseStatus(),
  });
});

app.get("/api/review/claims", async (_request, response, next) => {
  try {
    const claims = await getClaims({ status: "UNVERIFIED" });
    return response.status(200).json({ claims });
  } catch (error) {
    return next(error);
  }
});

app.use("/api/claims", claimsRouter);


app.use((_request, response) => {
  response.status(404).json({ error: "Route not found." });
});

app.use((error, _request, response, _next) => {
  if (error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Request body must contain valid JSON." });
  }

  console.error(error);
  response.status(500).json({ error: "Internal server error." });
});

export default app;
