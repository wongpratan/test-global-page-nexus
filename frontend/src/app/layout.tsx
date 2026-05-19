import type { ReactNode } from "react";

export const metadata = { title: "AI Chat" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#0b0b0d", color: "#eee" }}>
        {children}
      </body>
    </html>
  );
}
