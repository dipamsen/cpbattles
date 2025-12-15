import jwt from "jsonwebtoken";
import { RequestHandler } from "express";
import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  randomPKCECodeVerifier,
  randomState,
} from "openid-client";
import { FRONTEND_URL, getConfig } from "../config/openid";
import { db, pool } from "../config/database";
import { queries } from "../utils/postgres";

const REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://cpbattles-backend-bvhua3hscfavdqfa.centralindia-01.azurewebsites.net/auth/callback"
    : "http://localhost:8080/auth/callback";

export interface CodeforcesUser {
  sub: string;
  aud: string;
  iss: string;
  rating: number;
  handle: string;
  avatar: string;
  exp: number;
  iat: number;
}

export const loginWithCodeforces: RequestHandler = async (req, res) => {
  try {
    const config = await getConfig();
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Use PKCE but avoid server-side session storage by encoding the
    // code_verifier inside the `state` parameter (base64url JSON).
    const code_verifier = randomPKCECodeVerifier();
    const code_challenge = await calculatePKCECodeChallenge(code_verifier);
    const innerState = randomState();

    const payload = { s: innerState, v: code_verifier };
    const stateParam = Buffer.from(JSON.stringify(payload))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    res.redirect(
      buildAuthorizationUrl(config, {
        redirect_uri: `${baseUrl}/auth/callback`,
        scope: "openid profile",
        code_challenge,
        code_challenge_method: "S256",
        state: stateParam,
      }).href
    );
  } catch (err) {
    console.log("Login error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
};

export const handleCallback: RequestHandler = async (req, res) => {
  try {
    const config = await getConfig();
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const callbackUrl = `${baseUrl}/auth/callback?${new URLSearchParams(
      req.query as Record<string, string>
    ).toString()}`;

    // Extract code_verifier from the state param we generated earlier.
    const rawState = String(req.query.state || "");
    let code_verifier = "";
    try {
      const b = rawState.replace(/-/g, "+").replace(/_/g, "/");
      const json = Buffer.from(b, "base64").toString("utf8");
      const parsed = JSON.parse(json);
      code_verifier = parsed.v;
    } catch (e) {
      console.log("Failed to decode state payload:", e);
    }

    const tokens = await authorizationCodeGrant(config, new URL(callbackUrl), {
      pkceCodeVerifier: code_verifier,
      expectedState: rawState,
    });

    // TODO: validate id_token properly using oidc client helpers
    function decodeIdToken(idToken: string) {
      try {
        const parts = idToken.split(".");
        if (parts.length < 2) return null;
        let b = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (b.length % 4) b += "=";
        return JSON.parse(Buffer.from(b, "base64").toString("utf8"));
      } catch {
        return null;
      }
    }

    const idTokenPayload: CodeforcesUser = decodeIdToken(tokens.id_token || "");
    const user = {
      sub: idTokenPayload.sub,
      handle: idTokenPayload.handle,
      avatar: idTokenPayload.avatar,
      rating: idTokenPayload.rating,
    };


    const client = await pool.connect();
    let finalUser: { sub: string; handle: string; avatar: string; rating: number; id: number } | null = null;
    try {
      await client.query("BEGIN");
      const upsertedUsers = await db.query(queries.UPSERT_USER, [user.sub, user.handle, user.avatar, user.rating], client);
      await client.query("COMMIT");
      finalUser = { ...user, id: upsertedUsers[0].id };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    if (!finalUser) {
      throw new Error("Failed to create or retrieve user");
    }

    // Sign a JWT and redirect the user to the frontend with the token in the hash.
    const jwtSecret = process.env.JWT_SECRET || "jwtsecret";
    const token = jwt.sign(
      {
        sub: finalUser.sub,
        id: finalUser.id,
        handle: finalUser.handle,
        avatar: finalUser.avatar,
        rating: finalUser.rating,
      },
      jwtSecret,
      { expiresIn: "28d" }
    );

    // Redirect to frontend; put token in fragment so it's not sent to backend.
    const redirectUrl = `${FRONTEND_URL.replace(/\/$/, "")}/auth/callback#token=${token}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.log("Callback error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
};

export const getMe: RequestHandler = async (req, res) => {
  res.json({
    // @ts-ignore
    id: req.user.id,
    // @ts-ignore
    handle: req.user.handle,
  });
};