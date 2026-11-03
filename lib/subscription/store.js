import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

// Server-side source of truth for whether this deployment is paid up.
// Uses the `subscription` table (docs/subscription.sql) when SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are set. Otherwise it uses a local file for development.
// It deliberately ignores NEXT_PUBLIC_SUPABASE_URL so it can never reach an old project.

const DEFAULT_STATE = { isPaid: true, endsAt: null, sentReminders: [] };
const LOCAL_FILE = path.join(process.cwd(), ".data", "subscription.json");

function database() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    // A cached answer here would make a pause or resume appear not to work.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

export async function readSubscription() {
  const db = database();
  if (db) {
    const { data, error } = await db.from("subscription").select().eq("id", 1).maybeSingle();
    if (error) throw new Error(`Could not read subscription: ${error.message}`);
    if (!data) return { ...DEFAULT_STATE };
    return { isPaid: data.is_paid, endsAt: data.ends_at, sentReminders: data.sent_reminders ?? [] };
  }
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(await fs.readFile(LOCAL_FILE, "utf8")) };
  } catch (err) {
    if (err.code === "ENOENT") return { ...DEFAULT_STATE };
    throw err;
  }
}

export async function updateSubscription(changes) {
  const next = { ...(await readSubscription()), ...changes };
  const db = database();
  if (db) {
    const { error } = await db.from("subscription").upsert({
      id: 1,
      is_paid: next.isPaid,
      ends_at: next.endsAt,
      sent_reminders: next.sentReminders,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`Could not save subscription: ${error.message}`);
    return next;
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(next, null, 2));
  return next;
}

// Only an explicit is_paid = false pauses the app. If the status can't be read, the
// app stays open: a database outage must not lock a hospital out of its billing.
export async function isAppActive() {
  try {
    return (await readSubscription()).isPaid !== false;
  } catch (err) {
    console.error("Subscription check failed; leaving the app active.", err);
    return true;
  }
}

export async function requireActiveSubscription() {
  if (!(await isAppActive())) redirect("/suspended");
}
