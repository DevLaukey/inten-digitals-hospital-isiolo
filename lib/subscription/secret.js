import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

const MIN_SECRET_LENGTH = 32;

const digest = (value) => createHash("sha256").update(value).digest();

// Fails closed: a missing or short configured secret rejects everyone.
export function secretMatches(provided, expected) {
  if (typeof provided !== "string" || !expected || expected.length < MIN_SECRET_LENGTH) return false;
  return timingSafeEqual(digest(provided), digest(expected));
}
