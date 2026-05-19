import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE } from "@/lib/backend";
import ChatWindow from "@/components/ChatWindow";

export default async function Home() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) redirect("/login");
  return <ChatWindow />;
}
