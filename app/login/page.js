"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/AppShell";
import { Button, Card, ErrorNote, Field, inputClass } from "@/components/ui";
import { getSession, login } from "@/lib/auth";
import { homeFor } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSession()
      .then((member) => {
        if (member) router.replace(homeFor(member.role));
      })
      .catch(() => {
        // Offline: the form still shows, and signing in will explain the problem.
      });
  }, [router]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const member = await login(email, password);
      router.replace(homeFor(member.role));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="p-6">
          <h1 className="text-xl font-bold">Staff sign in</h1>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Field label="Email">
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
            <ErrorNote>{error}</ErrorNote>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-slate-500">
          Forgotten your password? Ask your administrator to reset it.
        </p>
      </div>
    </main>
  );
}
