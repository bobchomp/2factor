import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <LoginForm />
    </main>
  );
}
