"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg =
  | { role: "user" | "assistant"; content: string }
  | { role: "tool"; name: string; content: string };

export default function ChatWindow() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const chatIdRef = useRef<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setBusy(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, chatId: chatIdRef.current }),
    });

    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (!res.ok || !res.body) {
      setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: `error: ${res.status}` }]);
      setBusy(false);
      return;
    }

    const cid = res.headers.get("X-Chat-Id");
    if (cid) chatIdRef.current = cid;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.replace(/^data: /, "").trim();
        if (!line) continue;
        let ev: any;
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }
        if (ev.type === "text") {
          setMessages((m) => {
            const last = m[m.length - 1];
            if (last?.role !== "assistant") return m;
            return [...m.slice(0, -1), { ...last, content: last.content + ev.delta }];
          });
        } else if (ev.type === "tool_call") {
          setMessages((m) => [...m, { role: "tool", name: ev.name, content: `→ ${ev.args}` }, { role: "assistant", content: "" }]);
        } else if (ev.type === "tool_result") {
          setMessages((m) => [...m, { role: "tool", name: ev.name, content: ev.result }]);
        } else if (ev.type === "error") {
          setMessages((m) => [...m, { role: "assistant", content: `error: ${ev.message}` }]);
        }
      }
    }
    setBusy(false);
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 16, borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between" }}>
        <strong>AI Chat</strong>
        <button onClick={logout} style={{ background: "transparent", color: "#aaa", border: "1px solid #333", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}>
          Logout
        </button>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={bubble(m.role)}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>
              {m.role === "tool" ? `tool: ${(m as any).name}` : m.role}
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: 16, borderTop: "1px solid #222", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything..."
          disabled={busy}
          style={{ flex: 1, padding: 10, background: "#1a1a1f", border: "1px solid #333", color: "#eee", borderRadius: 6 }}
        />
        <button onClick={send} disabled={busy} style={{ padding: "10px 20px", background: "#3b82f6", border: "none", color: "#fff", borderRadius: 6, cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}

function bubble(role: string): React.CSSProperties {
  const base: React.CSSProperties = { padding: 12, borderRadius: 8, maxWidth: "80%" };
  if (role === "user") return { ...base, background: "#1e3a8a", alignSelf: "flex-end" };
  if (role === "tool") return { ...base, background: "#222", alignSelf: "flex-start", fontFamily: "monospace", fontSize: 12, opacity: 0.8 };
  return { ...base, background: "#1a1a1f", alignSelf: "flex-start" };
}
