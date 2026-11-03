// Creates the first administrator. Later accounts are added on the Staff page.
// npm run create-admin -- admin@example.com "First" "Last"
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [email, firstName, lastName] = process.argv.slice(2);
if (!email || !firstName || !lastName) {
  console.error('Usage: npm run create-admin -- admin@example.com "First" "Last"');
  process.exit(1);
}
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const password = randomBytes(12).toString("base64url");
const address = email.trim().toLowerCase();

const { data, error } = await db.auth.admin.createUser({ email: address, password, email_confirm: true });
if (error) {
  console.error(`Could not create the sign-in: ${error.message}`);
  process.exit(1);
}
const { error: rowError } = await db.from("staff").insert({
  auth_user_id: data.user.id,
  first_name: firstName,
  last_name: lastName,
  email: address,
  role: "admin",
  must_change_password: true,
});
if (rowError) {
  await db.auth.admin.deleteUser(data.user.id);
  console.error(`Could not create the staff record: ${rowError.message}`);
  process.exit(1);
}
console.log(`Administrator created: ${address}`);
console.log(`Temporary password (shown once): ${password}`);
