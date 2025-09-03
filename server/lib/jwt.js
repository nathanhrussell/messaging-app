import jwt from "jsonwebtoken";
import config from "../config/index.js";

const ACCESS_TTL = "15m";
const REFRESH_TTL = "7d";

export function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: ACCESS_TTL });
}
export function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: REFRESH_TTL });
}
export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}
export function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}
