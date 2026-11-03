"use client";
import { useState } from "react";
import { Button, Card, ErrorNote, Field, inputClass } from "@/components/ui";

function endDateText({ endsAt, daysLeft }) {
  if (!endsAt) return "No end date set, so no reminders will be sent.";
  if (daysLeft < 0) return `Ended ${endsAt} (${Math.abs(daysLeft)} days ago)`;
  return `${endsAt} (${daysLeft} days left)`;
}

// Your control panel. It is not linked from the app, and the secret is only kept
// in memory on this page, so it has to be entered again after a reload.
export default function VendorPage() {
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState(null);
  const [endsAt, setEndsAt] = useState("");
  const [confirmingPause, setConfirmingPause] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (action, extra) => {
    setBusy(true);
    setError("");
    setConfirmingPause(false);
    try {
      const response = await fetch("/api/vendor/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, action, ...extra }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setStatus(result);
    } catch (err) {
      setError(err.message || "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight">Subscription control</h1>

      {!status ? (
        <Card className="p-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              send("status");
            }}
            className="space-y-4"
          >
            <Field label="Vendor secret">
              <input
                type="password"
                required
                autoComplete="off"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className={inputClass}
              />
            </Field>
            <ErrorNote>{error}</ErrorNote>
            <Button type="submit" disabled={busy} className="w-full">Continue</Button>
          </form>
        </Card>
      ) : (
        <>
          <Card className="space-y-3 p-6 text-sm">
            <p>
              <span className="text-slate-600">App status: </span>
              <strong>{status.isPaid ? "Active" : "Paused"}</strong>
            </p>
            <p><span className="text-slate-600">Subscription ends: </span>{endDateText(status)}</p>
            <p><span className="text-slate-600">Customer email: </span>{status.customerEmail || "Not set"}</p>
            {!status.remindersReady && (
              <ErrorNote>Reminders are off: email settings or CRON_SECRET are missing.</ErrorNote>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="mb-3 font-semibold">Record a renewal</h2>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send("renew", { endsAt });
              }}
              className="space-y-3"
            >
              <Field label="New end date" hint="Also reactivates the app and restarts reminders for this date.">
                <input
                  type="date"
                  required
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Button type="submit" disabled={busy}>Save renewal</Button>
            </form>
          </Card>

          <Card className="p-6">
            {status.isPaid ? (
              <>
                <h2 className="font-semibold">Pause the app</h2>
                <p className="mb-3 mt-1 text-sm text-slate-600">
                  All hospital staff lose access until you resume it. Their data is not deleted.
                </p>
                {confirmingPause ? (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="danger" disabled={busy} onClick={() => send("pause")}>
                      Yes, pause for all staff
                    </Button>
                    <Button variant="secondary" onClick={() => setConfirmingPause(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button variant="danger" onClick={() => setConfirmingPause(true)}>Pause app</Button>
                )}
              </>
            ) : (
              <Button disabled={busy} onClick={() => send("resume")}>Resume app</Button>
            )}
          </Card>
          <ErrorNote>{error}</ErrorNote>
        </>
      )}
    </main>
  );
}
