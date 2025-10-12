import dotenv from "dotenv";
import { Configuration, discovery } from "openid-client";

dotenv.config();

if (!process.env.CORS_ORIGIN) {
  throw new Error("CORS_ORIGIN not set.");
}

export const FRONTEND_URL = process.env.CORS_ORIGIN;

let cachedConfig: Configuration | null = null;
export async function getConfig() {
  if (
    !process.env.CODEFORCES_CLIENT_ID ||
    !process.env.CODEFORCES_CLIENT_SECRET
  ) {
    throw new Error(
      "CODEFORCES_CLIENT_ID or CODEFORCES_CLIENT_SECRET not set."
    );
  }
  if (cachedConfig) return cachedConfig;
  const issuerBase = new URL("https://codeforces.com");
  cachedConfig = await discovery(
    issuerBase,
    process.env.CODEFORCES_CLIENT_ID,
    process.env.CODEFORCES_CLIENT_SECRET
  );
  console.log("Discovered issuer:", cachedConfig.serverMetadata().issuer);
  return cachedConfig;
}
