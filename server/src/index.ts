import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { agenda } from "./config/agenda";
import authRoutes from "./routes/auth";
import battleRoutes from "./routes/battles";

dotenv.config();

const app = express();


app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.enable('trust proxy'); 
app.use("/auth", authRoutes);
app.use("/api", battleRoutes);

process.on("unhandledRejection", (reason, promise) => {
  // Suppress MongoDB/Agenda connection errors - they're expected if MongoDB isn't available
  const reasonStr = reason instanceof Error ? reason.message : String(reason);
  if (reasonStr.includes("MongoServerSelectionError") || 
      reasonStr.includes("SSL") ||
      reasonStr.includes("tlsv1") ||
      reasonStr.includes("Cannot read properties of undefined")) {
    return;
  }
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function graceful() {
  agenda.stop().then(() => {
    process.exit(0);
  });
}

process.on("SIGTERM", graceful);
process.on("SIGINT", graceful);
