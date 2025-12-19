import { db } from "../../config/database";
import {
  BattleNotFoundError,
  BattlePermissionError,
  BattleCreatorOnlyError,
} from "../../errors/BattleErrors";

/**
 * Fetch battle or throw if it doesn't exist
 */
export async function getBattleOrThrow(battleId: number) {
  const battle = await db.getBattleById(battleId);
  if (!battle) {
    throw new BattleNotFoundError();
  }
  return battle;
}

/**
 * User must be creator OR participant
 */
export async function getBattleWithAccess(battleId: number, userId: number) {
  const battle = await getBattleOrThrow(battleId);

  if (battle.created_by === userId) {
    return battle;
  }

  const participants = await db.getBattleParticipants(battleId);
  const isParticipant = participants.some((p) => p.id === userId);

  if (!isParticipant) {
    throw new BattlePermissionError();
  }

  return battle;
}

/**
 * User must be the creator
 */
export async function getBattleAsCreator(battleId: number, userId: number) {
  const battle = await getBattleOrThrow(battleId);

  if (battle.created_by !== userId) {
    throw new BattleCreatorOnlyError("perform this action");
  }

  return battle;
}
