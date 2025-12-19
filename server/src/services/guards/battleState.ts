import {
  BattleAlreadyCompletedError,
  BattleAlreadyStartedError,
  BattleInvalidStateError,
  BattleNotInProgressError,
  BattleNotStartedError,
} from "../../errors/BattleErrors";
import { Battle } from "../../utils/postgres";

/**
 * Battle must be pending
 */
export function assertPending(battle: Battle) {
  if (battle.status !== "pending") {
    throw new BattleAlreadyStartedError();
  }
}

/**
 * Battle must NOT be pending
 */
export function assertStarted(battle: Battle, resourceName = "Resource") {
  if (battle.status === "pending") {
    throw new BattleNotStartedError(resourceName);
  }
}

/**
 * Battle must be in progress
 */
export function assertInProgress(battle: Battle) {
  if (battle.status !== "in_progress") {
    throw new BattleNotInProgressError();
  }
}

/**
 * Battle must NOT be completed
 */
export function assertNotCompleted(battle: Battle) {
  if (battle.status === "completed") {
    throw new BattleAlreadyCompletedError();
  }
}

/**
 * Explicit state matcher
 */
export function assertState(battle: Battle, expected: string) {
  if (battle.status !== expected) {
    throw new BattleInvalidStateError(battle.status);
  }
}
