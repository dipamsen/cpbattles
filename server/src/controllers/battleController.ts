import { AppError } from "../errors/AppError";
import { battleService } from "../services/battleService";
import { RequestHandler } from "express";

export interface BattleCreationDetails {
  name: string;
  startTime: number;
  duration: number;
  minRating: number;
  maxRating: number;
  problemCount: number;
}

export const createBattle: RequestHandler = async (req, res, next) => {
  try {
    const battleId = await battleService.createBattle(
      req.user,
      req.body as BattleCreationDetails
    );
    res.json({ battleId });
  } catch (err) {
    next(err);
  }
};

export const getUserBattles: RequestHandler = async (req, res, next) => {
  const user = req.user;
  try {
    const battles = await battleService.getUserBattles(user.id);
    res.json(battles);
  } catch (err) {
    next(err);
  }
};

export const getBattle: RequestHandler = async (req, res, next) => {
  try {
    const battleId = parseInt(req.params.id, 10);

    if (isNaN(battleId)) {
      throw new AppError("Invalid battle ID", 400);
    }

    const result = await battleService.getBattle(battleId, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getBattleParticipants: RequestHandler = async (req, res, next) => {
  try {
    const battleId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    if (isNaN(battleId)) {
      throw new AppError("Invalid battle ID", 400);
    }

    const participants = await battleService.getBattleParticipants(
      battleId,
      userId
    );
    res.json(participants);
  } catch (err) {
    next(err);
  }
};

export const getBattleProblems: RequestHandler = async (req, res, next) => {
  const battleId = parseInt(req.params.id, 10);
  const userId = req.user.id;
  if (isNaN(battleId)) {
    return next(new AppError("Invalid battle ID", 400));
  }

  try {
    const problems = await battleService.getBattleProblems(battleId, userId);
    res.json(problems);
  } catch (error) {
    next(error);
  }
};

export const getBattleStandings: RequestHandler = async (req, res, next) => {
  const battleId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(battleId)) {
    return next(new AppError("Invalid battle ID", 400));
  }

  try {
    const standings = await battleService.getBattleStandings(battleId, userId);
    res.json(standings);
  } catch (error) {
    next(error);
  }
};

export const getBattleSubmissions: RequestHandler = async (req, res, next) => {
  const battleId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(battleId)) {
    return next(new AppError("Invalid battle ID", 400));
  }

  try {
    const submissions = await battleService.getBattleSubmissions(
      battleId,
      userId
    );
    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

export const joinBattle: RequestHandler = async (req, res, next) => {
  const joinToken = req.params.joinToken;
  const userId = req.user.id;

  if (!joinToken) {
    return next(new AppError("Join token is required", 400));
  }

  try {
    const battleId = await battleService.joinBattle(joinToken, userId);
    res.json({ battleId });
  } catch (err) {
    next(err);
  }
};

export const refreshSubmissions: RequestHandler = async (req, res, next) => {
  const battleId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(battleId)) {
    return next(new AppError("Invalid battle ID", 400));
  }

  try {
    await battleService.refreshSubmissions(battleId, userId);
    res.json({ message: "Submissions refreshed successfully" });
  } catch (error) {
    next(error);
  }
};

export const cancelBattle: RequestHandler = async (req, res, next) => {
  const battleId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(battleId)) {
    return next(new AppError("Invalid battle ID", 400));
  }

  try {
    await battleService.cancelBattle(battleId, userId);
    res.json({ message: "Battle cancelled successfully" });
  } catch (err) {
    next(err);
  }
};

export const startBattle: RequestHandler = async (req, res, next) => {
  const battleId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(battleId)) {
    return next(new AppError("Invalid battle ID", 400));
  }

  try {
    const result = await battleService.startBattle(battleId, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const endBattle: RequestHandler = async (req, res, next) => {
  const battleId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  if (isNaN(battleId)) {
    return next(new AppError("Invalid battle ID", 400));
  }

  try {
    await battleService.endBattle(battleId, userId);
    res.json({ message: "Battle ended successfully" });
  } catch (err) {
    next(err);
  }
};
