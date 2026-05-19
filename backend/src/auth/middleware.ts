import type { FastifyRequest, FastifyReply } from "fastify";
import { verify, type JwtPayload } from "./jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "missing token" });
  }
  try {
    req.user = verify(header.slice(7));
  } catch {
    return reply.code(401).send({ error: "invalid token" });
  }
}
