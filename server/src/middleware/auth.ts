import jwt from "jsonwebtoken";
import { db } from "../config/database";
import { RequestHandler } from "express";

export const authenticateSession: RequestHandler = async (req, res, next) => {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice("Bearer ".length);
  try {
    const secret = process.env.JWT_SECRET || "jwtsecret";
    const decoded = jwt.verify(token, secret);
    if (!decoded || !decoded.sub || typeof decoded == "string") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await db.getUserBySub(decoded.sub);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
