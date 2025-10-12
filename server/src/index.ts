import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { agenda } from "./config/agenda";
import authRoutes from "./routes/auth";
import battleRoutes from "./routes/battles";
import session from "express-session";

dotenv.config();

const app = express();

declare module "express-session" {
  interface SessionData {
    code_verifier: string;
    state: string;
    access_token: string;
    id_token: string;
    user: any;
  }
}

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use("/auth", authRoutes);
app.use("/api", battleRoutes);

agenda.on("ready", () => {
  agenda.start();
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
