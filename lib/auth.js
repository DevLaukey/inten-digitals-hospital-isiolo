// DEMO authentication: every account shares one known password and the session
// is only a browser flag, so this offers no real protection. Replace it with the
// new project's Supabase Auth (signInWithPassword) before any real use.
import { findStaffByEmail, listStaff } from "./store";

const SESSION_KEY = "hospital-pos:demo:session";
export const DEMO_PASSWORD = "demo1234";

export async function login(email, password) {
  const member = await findStaffByEmail(email);
  if (!member || password !== DEMO_PASSWORD) throw new Error("Incorrect email or password.");
  if (!member.active) throw new Error("This account has been deactivated.");
  localStorage.setItem(SESSION_KEY, member.id);
  return member;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// Re-reads the staff record so role changes and deactivation apply straight away.
export async function getSession() {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  const member = (await listStaff()).find((entry) => entry.id === id);
  return member?.active ? member : null;
}
