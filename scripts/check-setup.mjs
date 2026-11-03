// Go-live checklist: npm run check-setup. Reads settings and data only; changes nothing.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

let problems = 0;
const report = (ok, label, fix) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && fix ? `\n      ${fix}` : ""}`);
  if (!ok) problems += 1;
};

const env = process.env;
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const publicKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

report(Boolean(env.NEXT_PUBLIC_SUPABASE_URL && publicKey), "Public database settings", "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
report(Boolean(url && key), "Server database settings", "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
report(url === env.NEXT_PUBLIC_SUPABASE_URL, "Public and server settings use the same project", "SUPABASE_URL must equal NEXT_PUBLIC_SUPABASE_URL.");
for (const name of ["VENDOR_SECRET", "CRON_SECRET"]) {
  report((env[name] ?? "").length >= 32, `${name} is at least 32 characters`, "Generate one with: openssl rand -hex 32");
}
for (const name of ["VENDOR_EMAIL", "BILLING_CUSTOMER_EMAIL", "RESEND_API_KEY", "EMAIL_FROM", "APP_URL", "SUPPORT_CONTACT"]) {
  report(Boolean(env[name]), `${name} is set`, "Reminders or the paused page need this. See .env.example.");
}

const hospital = readFileSync(new URL("../config/hospital.js", import.meta.url), "utf8");
report(!/City Hospital|00000|700 000 000|hospital\.test/.test(hospital), "Real hospital details on receipts", "Edit config/hospital.js.");

if (url && key) {
  const db = createClient(url, key, { auth: { persistSession: false } });
  for (const table of ["subscription", "staff", "patients", "catalogue", "item_costs", "bills", "bill_lines", "audit_log"]) {
    const { error } = await db.from(table).select("*", { head: true, count: "exact" });
    report(!error, `Table ${table} exists`, "Run docs/schema.sql, then each file in docs/migrations, in the Supabase SQL Editor.");
  }
  const { data: subscription } = await db.from("subscription").select().eq("id", 1).maybeSingle();
  report(Boolean(subscription?.ends_at), "Subscription end date is set", "Record a renewal at /vendor.");

  const { count: admins } = await db.from("staff").select("*", { head: true, count: "exact" }).eq("role", "admin").eq("active", true);
  report(admins > 0, "An active administrator exists", "Run: npm run create-admin");
  const { count: items } = await db.from("catalogue").select("*", { head: true, count: "exact" });
  report(items > 0, "Catalogue has services and drugs", "Add them on the Services & drugs page.");

  const settings = await (await fetch(`${url}/auth/v1/settings`, { headers: { apikey: publicKey ?? key } })).json();
  report(settings.disable_signup === true, "Public sign-ups are off", 'In Supabase: Authentication > Sign In / Providers > turn off "Allow new users to sign up".');
}

console.log(problems ? `\n${problems} item(s) to fix.` : "\nAll checks passed.");
process.exit(problems ? 1 : 0);
