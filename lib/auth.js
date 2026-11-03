import { supabase } from "@/config/supabase";
import { friendlyMessage, staffFromRow } from "./mappers.mjs";

export const MIN_PASSWORD_LENGTH = 10;

async function staffRecord(authUserId) {
  const { data, error } = await supabase()
    .from("staff")
    .select()
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw new Error(friendlyMessage(error));
  return data && staffFromRow(data);
}

export async function login(email, password) {
  const { data, error } = await supabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    if (error.name === "AuthRetryableFetchError") {
      throw new Error("Can't reach the server. Check your connection and try again.");
    }
    throw new Error("Incorrect email or password.");
  }
  const member = await staffRecord(data.user.id);
  if (!member?.active) {
    await logout();
    throw new Error(member ? "This account has been deactivated." : "This account is not set up as staff.");
  }
  return member;
}

export async function logout() {
  await supabase().auth.signOut({ scope: "local" });
}

// Re-reads the staff record so role changes and deactivation apply straight away.
// Returns null when signed out. Throws when offline, so a network blip doesn't sign anyone out.
export async function getSession() {
  const { data, error } = await supabase().auth.getSession();
  if (error?.name === "AuthRetryableFetchError") throw new Error("Can't reach the server.");
  if (error || !data.session) return null;
  const member = await staffRecord(data.session.user.id);
  if (member?.active) return member;
  await logout();
  return null;
}

export async function changePassword(password) {
  const { error } = await supabase().auth.updateUser({ password });
  if (error) {
    throw new Error(
      error.code === "same_password" ? "Choose a password different from the current one." : error.message
    );
  }
  const { error: flagError } = await supabase().rpc("mark_password_changed");
  if (flagError) throw new Error(friendlyMessage(flagError));
}
