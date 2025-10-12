import express from "express";
import {
  createBattle,
  getBattle,
  getBattleParticipants,
  getBattleProblems,
  getBattleStandings,
  getBattleSubmissions,
  getUserBattles,
  joinBattle,
  refreshSubmissions,
} from "../controllers/battleController";
import { authenticateSession } from "../middleware/auth";
import { validateBattleCreation } from "../middleware/validation";

const router = express.Router();

router.post(
  "/create",
  authenticateSession,
  validateBattleCreation,
  createBattle
);
router.post("/battle/join/:joinToken", authenticateSession, joinBattle);
router.get("/battles", authenticateSession, getUserBattles);
router.get("/battle/:id", authenticateSession, getBattle);
router.get(
  "/battle/:id/participants",
  authenticateSession,
  getBattleParticipants
);
router.get("/battle/:id/problems", authenticateSession, getBattleProblems);
router.get("/battle/:id/standings", authenticateSession, getBattleStandings);
router.get(
  "/battle/:id/submissions",
  authenticateSession,
  getBattleSubmissions
);
router.get(
  "/battle/:id/refreshSubmissions",
  authenticateSession,
  refreshSubmissions
);

export default router;
