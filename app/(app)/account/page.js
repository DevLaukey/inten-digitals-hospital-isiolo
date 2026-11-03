"use client";
import { useState } from "react";
import { useSession } from "@/components/AppShell";
import { Button, Card, ErrorNote, Field, inputClass, PageHeader } from "@/components/ui";
import { changePassword, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { homeFor } from "@/lib/constants";

export default function AccountPage() {
  const session = useSession();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmation) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(password);
      window.location.assign(homeFor(session.role));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Change password"
        subtitle={session.mustChangePassword ? "Choose your own password before you continue." : session.email}
      />
      <Card className="max-w-md p-4 sm:p-6">
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password" required hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Repeat new password" required>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={inputClass}
            />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Change password"}</Button>
        </form>
      </Card>
    </>
  );
}
