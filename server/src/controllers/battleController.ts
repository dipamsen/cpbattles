import { battleService } from "../services/battleService";
import { RequestHandler } from "express";

export const createBattle: RequestHandler = async (req, res) => {
  try {
    // @ts-ignore
    const battleId = await battleService.createBattle(req.user, req.body);
    res.json({ battleId });
  } catch (error) {
    res.status(400).json({
      error:
        "message" in (error as any) ? (error as any).message : "Unknown error",
    });
  }
};

export const getUserBattles: RequestHandler = async (req, res) => {
  // @ts-ignore
  const user = req.user;
  try {
    const battles = await battleService.getUserBattles(user.id);
    res.json(battles);
  } catch (error) {
    res.status(500).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};

export const getBattle: RequestHandler = async (req, res) => {
  const battleId = parseInt(req.params.id, 10);

  if (isNaN(battleId)) {
    res.status(400).json({ error: "Invalid battle ID" });
    return;
  }

  try {
    const result = await battleService.getBattle(
      battleId,
      // @ts-ignore
      req.user.id
    );
    res.json(result);
  } catch (error) {
    const statusCode = (error as any).message.includes("not found")
      ? 404
      : (error as any).message.includes("not allowed")
      ? 403
      : 500;

    res.status(statusCode).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};

export const getBattleParticipants: RequestHandler = async (req, res) => {
  const battleId = parseInt(req.params.id, 10);
  // @ts-ignore
  const userId = req.user.id;
  if (isNaN(battleId)) {
    res.status(400).json({ error: "Invalid battle ID" });
    return;
  }

  try {
    const participants = await battleService.getBattleParticipants(
      battleId,
      userId
    );
    res.json(participants);
  } catch (error) {
    res.status(500).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};

export const getBattleProblems: RequestHandler = async (req, res) => {
  const battleId = parseInt(req.params.id, 10);
  // @ts-ignore
  const userId = req.user.id;
  if (isNaN(battleId)) {
    res.status(400).json({ error: "Invalid battle ID" });
    return;
  }

  try {
    const problems = await battleService.getBattleProblems(battleId, userId);
    res.json(problems);
  } catch (error) {
    res.status(500).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};

export const getBattleStandings: RequestHandler = async (req, res) => {
  const battleId = parseInt(req.params.id, 10);
  // @ts-ignore
  const userId = req.user.id;

  if (isNaN(battleId)) {
    res.status(400).json({ error: "Invalid battle ID" });
    return;
  }

  try {
    const standings = await battleService.getBattleStandings(battleId, userId);
    res.json(standings);
  } catch (error) {
    res.status(500).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};

export const getBattleSubmissions: RequestHandler = async (req, res) => {
  const battleId = parseInt(req.params.id, 10);
  // @ts-ignore
  const userId = req.user.id;

  if (isNaN(battleId)) {
    res.status(400).json({ error: "Invalid battle ID" });
    return;
  }

  try {
    const submissions = await battleService.getBattleSubmissions(
      battleId,
      userId
    );
    res.json(submissions);
  } catch (error) {
    res.status(500).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};

export const joinBattle: RequestHandler = async (req, res) => {
  const joinToken = req.params.joinToken;
  // @ts-ignore
  const userId = req.user.id;

  if (!joinToken) {
    res.status(400).json({ error: "Join token is required" });
    return;
  }

  try {
    const battleId = await battleService.joinBattle(joinToken, userId);
    res.json({ battleId });
  } catch (error) {
    res.status(400).json({
      error:
        "message" in (error as any) ? (error as any).message : "Unknown error",
    });
  }
};

export const refreshSubmissions: RequestHandler = async (req, res) => {
  const battleId = parseInt(req.params.id, 10);
  // @ts-ignore
  const userId = req.user.id;

  if (isNaN(battleId)) {
    res.status(400).json({ error: "Invalid battle ID" });
    return;
  }

  try {
    await battleService.refreshSubmissions(battleId, userId);
    res.json({ message: "Submissions refreshed successfully" });
  } catch (error) {
    res.status(500).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};

export const cancelBattle: RequestHandler = async (req, res) => {
  const battleId = parseInt(req.params.id, 10);
  // @ts-ignore
  const userId = req.user.id;

  if (isNaN(battleId)) {
    res.status(400).json({ error: "Invalid battle ID" });
    return;
  }

  try {
    await battleService.cancelBattle(battleId, userId);
    res.json({ message: "Battle cancelled successfully" });
  } catch (error) {
    const statusCode = (error as any).message.includes("not found")
      ? 404
      : (error as any).message.includes("Only the battle creator")
      ? 403
      : (error as any).message.includes("Cannot cancel")
      ? 400
      : 500;

    res.status(statusCode).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};

export const startBattle: RequestHandler = async (req, res) => {
  const battleId = parseInt(req.params.id, 10);
  // @ts-ignore
  const userId = req.user.id;

  if (isNaN(battleId)) {
    res.status(400).json({ error: "Invalid battle ID" });
    return;
  }

  try {
    const result = await battleService.startBattle(battleId, userId);
    res.json(result);
  } catch (error) {
    const statusCode = (error as any).message.includes("not found")
      ? 404
      : (error as any).message.includes("Only the battle creator")
      ? 403
      : (error as any).message.includes("already")
      ? 400
      : 500;

    res.status(statusCode).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};

export const endBattle: RequestHandler = async (req, res) => {
  const battleId = parseInt(req.params.id, 10);
  // @ts-ignore
  const userId = req.user.id;

  if (isNaN(battleId)) {
    res.status(400).json({ error: "Invalid battle ID" });
    return;
  }

  try {
    await battleService.endBattle(battleId, userId);
    res.json({ message: "Battle ended successfully" });
  } catch (error) {
    const statusCode = (error as any).message.includes("not found")
      ? 404
      : (error as any).message.includes("Only the battle creator")
      ? 403
      : (error as any).message.includes("Cannot end")
      ? 400
      : 500;

    res.status(statusCode).json({
      error:
        "message" in (error as any)
          ? (error as any).message
          : "Something went wrong.",
    });
  }
};