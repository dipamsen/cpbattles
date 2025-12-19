import { User } from "./postgres";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

export {};
