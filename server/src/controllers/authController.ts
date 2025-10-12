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

    const code_verifier = randomPKCECodeVerifier();
    const code_challenge = await calculatePKCECodeChallenge(code_verifier);
    const state = randomState();

    req.session.code_verifier = code_verifier;
    req.session.state = state;

    res.redirect(
      buildAuthorizationUrl(config, {
        redirect_uri: `${baseUrl}/auth/callback`,
        scope: "openid profile",
        code_challenge,
        code_challenge_method: "S256",
        state,
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

    const tokens = await authorizationCodeGrant(config, new URL(callbackUrl), {
      pkceCodeVerifier: req.session.code_verifier,
      expectedState: req.session.state,
    });
    
    req.session.access_token = tokens.access_token;
    req.session.id_token = tokens.id_token;

    // TODO FIX: validate id_token
    function decodeIdToken(idToken: string) {
      try {
        const parts = idToken.split('.');
        if (parts.length < 2) return null;
        let b = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (b.length % 4) b += '=';
        return JSON.parse(Buffer.from(b, 'base64').toString('utf8'));
      } catch {
        return null;
      }
    }
    
    const idTokenPayload: CodeforcesUser = decodeIdToken(tokens.id_token || "");
    const user = {
      sub: idTokenPayload.sub,
      handle: idTokenPayload.handle,
      avatar: idTokenPayload.avatar,
      rating: idTokenPayload.rating
    }

    req.session.user = user;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const upsertedUsers = await db.query(queries.UPSERT_USER, [user.sub, user.handle, user.avatar, user.rating], client);
      await client.query("COMMIT");
      req.session.user.id = upsertedUsers[0].id;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    delete req.session.code_verifier;
    delete req.session.state;

    res.redirect(FRONTEND_URL);
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

export const logout: RequestHandler = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Session destruction error:", err);
      res.status(500).json({ error: "Could not log out. Please try again." });
      return;
    }
    res.clearCookie("connect.sid", { path: "/" });
    res.json({ message: "Logged out successfully." });
  });
}