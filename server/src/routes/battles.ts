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
import { authenticateToken } from "../middleware/auth";
import { validateBattleCreation } from "../middleware/validation";

const router = express.Router();

router.post("/create", authenticateToken, validateBattleCreation, createBattle);
router.post("/battle/join/:joinToken", authenticateToken, joinBattle);
router.get("/battles", authenticateToken, getUserBattles);
router.get("/battle/:id", authenticateToken, getBattle);
router.get(
  "/battle/:id/participants",
  authenticateToken,
  getBattleParticipants
);
router.get("/battle/:id/problems", authenticateToken, getBattleProblems);
router.get("/battle/:id/standings", authenticateToken, getBattleStandings);
router.get("/battle/:id/submissions", authenticateToken, getBattleSubmissions);
router.get(
  "/battle/:id/refreshSubmissions",
  authenticateToken,
  refreshSubmissions
);

export default router;
