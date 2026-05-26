import type { FastifyRequest, FastifyReply } from "fastify";
import { cookies } from 'next/headers';
import { verify, type JwtPayload } from "./jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  let authToken = req.headers.authorization;

  if (!authToken)
    authToken = req.cookies.auth_token;
  if (!authToken)
    return reply.code(401).send({ error: "missing token" });
  if (authToken.startsWith("Bearer "))
    authToken = authToken.slice(7);
  try {
    req.user = verify(authToken);
  } catch {
    return reply.code(401).send({ error: "invalid token" });
  }
}
