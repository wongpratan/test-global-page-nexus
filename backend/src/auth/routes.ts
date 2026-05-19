import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/client.js";
import { sign } from "./jwt.js";

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const parsed = credSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid input" });
    const { email, password } = parsed.data;

    const existing = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    if (existing.length) return reply.code(409).send({ error: "email taken" });

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db
      .insert(schema.users)
      .values({ email, passwordHash })
      .returning();
    const token = sign({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  });

  app.post("/auth/login", async (req, reply) => {
    const parsed = credSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid input" });
    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    if (!user) return reply.code(401).send({ error: "bad credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return reply.code(401).send({ error: "bad credentials" });

    const token = sign({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  });
}
