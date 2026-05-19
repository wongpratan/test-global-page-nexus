"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 360, margin: "80px auto", padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>{mode === "login" ? "Login" : "Register"}</h1>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />
        <button type="submit" disabled={busy} style={btnStyle}>
          {busy ? "..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
      {err && <p style={{ color: "#f66", marginTop: 12 }}>{err}</p>}
      <button
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        style={{ ...btnStyle, marginTop: 16, background: "transparent", border: "1px solid #444" }}
      >
        {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
      </button>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 10,
  background: "#1a1a1f",
  border: "1px solid #333",
  color: "#eee",
  borderRadius: 6,
};
const btnStyle: React.CSSProperties = {
  padding: 10,
  background: "#3b82f6",
  border: "none",
  color: "#fff",
  borderRadius: 6,
  cursor: "pointer",
};
