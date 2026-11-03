import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { friendlyMessage, staffFromRow } from "@/lib/mappers.mjs";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "cashier", "receptionist", "pharmacist", "lab", "nurse", "doctor"];
const OPTIONS = { auth: { persistSession: false, autoRefreshToken: false } };

const fail = (error, status = 400) => NextResponse.json({ error }, { status });
const tempPassword = () => randomBytes(12).toString("base64url");

function staffRow(input) {
  const row = {
    first_name: String(input?.firstName ?? "").trim(),
    last_name: String(input?.lastName ?? "").trim(),
    email: String(input?.email ?? "").trim().toLowerCase(),
    phone: String(input?.phone ?? "").trim(),
    role: input?.role,
  };
  if (!row.first_name || !row.last_name) throw new Error("First and last name are required.");
  if (!/^\S+@\S+\.\S+$/.test(row.email)) throw new Error("Enter a valid email address.");
  if (!ROLES.includes(row.role)) throw new Error("Choose a role.");
  return row;
}

// Table changes run as the signed-in administrator, so row level security applies and
// the audit log records who made them. The secret key is used only for sign-in accounts.
export async function POST(request) {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !secretKey || !publicKey) return fail("Staff management is not set up on the server.", 500);

  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return fail("Please sign in again.", 401);

  const asUser = createClient(url, publicKey, {
    ...OPTIONS,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: role, error: roleError } = await asUser.rpc("staff_role");
  if (roleError || role !== "admin") return fail("Only an administrator can manage staff.", 403);

  const { auth } = createClient(url, secretKey, OPTIONS);
  const body = await request.json().catch(() => ({}));

  async function update(id, changes) {
    const { data, error } = await asUser.from("staff").update(changes).eq("id", id).select().single();
    if (error) throw new Error(friendlyMessage(error));
    return data;
  }

  async function currentRow(id) {
    const { data, error } = await asUser.from("staff").select().eq("id", id).single();
    if (error) throw new Error(friendlyMessage(error));
    return data;
  }

  try {
    switch (body.action) {
      case "create": {
        const row = staffRow(body.input);
        const password = tempPassword();
        const { data, error } = await auth.admin.createUser({
          email: row.email,
          password,
          email_confirm: true,
        });
        if (error) {
          return fail(
            error.code === "email_exists" ? "A staff member with this email already exists." : error.message
          );
        }
        const inserted = await asUser
          .from("staff")
          .insert({ ...row, auth_user_id: data.user.id, must_change_password: true })
          .select()
          .single();
        if (inserted.error) {
          await auth.admin.deleteUser(data.user.id);
          return fail(friendlyMessage(inserted.error));
        }
        return NextResponse.json({ member: staffFromRow(inserted.data), tempPassword: password });
      }
      case "update": {
        const row = staffRow(body.input);
        const existing = await currentRow(body.id);
        const saved = await update(body.id, row);
        if (row.email !== existing.email) {
          const { error } = await auth.admin.updateUserById(existing.auth_user_id, {
            email: row.email,
            email_confirm: true,
          });
          if (error) {
            await update(body.id, { email: existing.email });
            return fail(error.message);
          }
        }
        return NextResponse.json({ member: staffFromRow(saved) });
      }
      case "setActive":
        return NextResponse.json({ member: staffFromRow(await update(body.id, { active: Boolean(body.active) })) });
      case "resetPassword": {
        const existing = await currentRow(body.id);
        const password = tempPassword();
        const { error } = await auth.admin.updateUserById(existing.auth_user_id, { password });
        if (error) return fail(error.message);
        await update(body.id, { must_change_password: true });
        return NextResponse.json({ tempPassword: password });
      }
      default:
        return fail("Unknown action.");
    }
  } catch (err) {
    return fail(err.message);
  }
}
