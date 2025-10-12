import jwt from "jsonwebtoken";
import { db } from "../config/database";
import { RequestHandler } from "express";

export const authenticateSession: RequestHandler = async (req, res, next) => {
   if (!req.session || !req.session.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await db.getUserBySub(req.session.user.sub);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // @ts-ignore
  req.user = user;
  
  next();
};
