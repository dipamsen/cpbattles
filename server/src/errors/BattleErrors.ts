import { AppError } from "./AppError";

export class BattleNotFoundError extends AppError {
  constructor() {
    super("Battle not found", 404);
  }
}

export class BattlePermissionError extends AppError {
  constructor() {
    super("You are not allowed to perform this action", 403);
  }
}

export class BattleJoinTokenInvalidError extends AppError {
  constructor() {
    super("Battle not found or join token is invalid", 404);
  }
}

export class BattleAlreadyStartedError extends AppError {
  constructor() {
    super("You can only join battles that have not started yet", 400);
  }
}

export class BattleNotStartedError extends AppError {
  constructor(resource = "This resource") {
    super(`${resource} is only available after the battle starts`, 400);
  }
}

export class BattleNotInProgressError extends AppError {
  constructor(action = "This action") {
    super(`${action} can only be performed during an active battle`, 400);
  }
}

export class BattleCreatorOnlyError extends AppError {
  constructor(action: string) {
    super(`Only the battle creator can ${action}`, 403);
  }
}

export class BattleAlreadyCompletedError extends AppError {
  constructor() {
    super("Cannot cancel a completed battle", 400);
  }
}

export class BattleInvalidStateError extends AppError {
  constructor(status: string) {
    super(`Battle is already ${status}`, 400);
  }
}

export class BattleStartInProgressError extends AppError {
  constructor() {
    super("Battle is starting, please wait", 409);
  }
}