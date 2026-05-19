import jwt from "jsonwebtoken";
import { env } from "../env.js";

export type JwtPayload = { sub: string; email: string };

export const sign = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });

export const verify = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;
