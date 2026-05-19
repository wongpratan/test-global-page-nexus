import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { db, schema } from "../db/client.js";
import { requireAuth } from "../auth/middleware.js";
import { runChat } from "./service.js";

const sendSchema = z.object({
  chatId: z.string().uuid().optional(),
  message: z.string().min(1),
});

export async function chatRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req, reply) => {
    if (req.url.startsWith("/chat")) await requireAuth(req, reply);
  });

  app.get("/chats", async (req) => {
    const userId = req.user!.sub;
    return db
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.userId, userId))
      .orderBy(asc(schema.chats.createdAt));
  });

  app.get<{ Params: { id: string } }>("/chats/:id/messages", async (req, reply) => {
    const userId = req.user!.sub;
    const [chat] = await db
      .select()
      .from(schema.chats)
      .where(and(eq(schema.chats.id, req.params.id), eq(schema.chats.userId, userId)));
    if (!chat) return reply.code(404).send({ error: "not found" });
    return db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.chatId, chat.id))
      .orderBy(asc(schema.messages.createdAt));
  });

  app.post("/chat", async (req, reply) => {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid input" });
    const { message } = parsed.data;
    const userId = req.user!.sub;

    let chatId = parsed.data.chatId;
    if (chatId) {
      const [chat] = await db
        .select()
        .from(schema.chats)
        .where(and(eq(schema.chats.id, chatId), eq(schema.chats.userId, userId)));
      if (!chat) return reply.code(404).send({ error: "chat not found" });
    } else {
      const [chat] = await db
        .insert(schema.chats)
        .values({ userId, title: message.slice(0, 60) })
        .returning();
      chatId = chat.id;
    }

    const prior = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.chatId, chatId))
      .orderBy(asc(schema.messages.createdAt));

    const history: ChatCompletionMessageParam[] = prior.map((m) => {
      if (m.role === "tool") {
        return {
          role: "tool",
          tool_call_id: m.toolCallId ?? "",
          content: m.content,
        };
      }
      if (m.role === "assistant" && m.toolCalls) {
        return {
          role: "assistant",
          content: m.content || null,
          tool_calls: m.toolCalls as any,
        };
      }
      return { role: m.role as "user" | "assistant" | "system", content: m.content };
    });

    history.push({ role: "user", content: message });
    await db.insert(schema.messages).values({ chatId, role: "user", content: message });

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Chat-Id": chatId,
    });

    const send = (data: unknown) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      for await (const ev of runChat(history)) {
        send(ev);
        if (ev.type === "done") {
          const finalMessages = ev.messages.slice(history.length);
          for (const m of finalMessages) {
            if (m.role === "assistant") {
              await db.insert(schema.messages).values({
                chatId,
                role: "assistant",
                content: typeof m.content === "string" ? m.content : "",
                toolCalls: (m as any).tool_calls ?? null,
              });
            } else if (m.role === "tool") {
              await db.insert(schema.messages).values({
                chatId,
                role: "tool",
                content: typeof m.content === "string" ? m.content : "",
                toolCallId: (m as any).tool_call_id,
              });
            }
          }
        }
      }
    } catch (err) {
      send({ type: "error", message: String(err) });
    }
    reply.raw.end();
  });
}
