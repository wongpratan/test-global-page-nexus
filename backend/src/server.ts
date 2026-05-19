import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { authRoutes } from "./auth/routes.js";
import { chatRoutes } from "./chat/routes.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.FRONTEND_ORIGIN,
  credentials: true,
});

app.get("/health", async () => ({ ok: true }));

await app.register(authRoutes);
await app.register(chatRoutes);

app
  .listen({ port: env.PORT, host: "0.0.0.0" })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
