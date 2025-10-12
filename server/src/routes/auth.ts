import express from "express";
import {
  getMe,
  handleCallback,
  loginWithCodeforces,
  logout,
} from "../controllers/authController";
import { authenticateSession } from "../middleware/auth";

const router = express.Router();

router.get("/me", authenticateSession, getMe);
router.get("/login", loginWithCodeforces);
router.get("/callback", handleCallback);
router.post("/logout", authenticateSession, logout);

export default router;
