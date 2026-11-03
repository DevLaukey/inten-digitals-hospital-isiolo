import assert from "node:assert/strict";
import { test } from "node:test";
import {
  composeEmail,
  daysUntil,
  dueReminders,
  isValidDateKey,
  todayKey,
} from "../lib/subscription/reminders.mjs";

const END = "2026-12-31";
const base = { isPaid: true, endsAt: END, sentReminders: [] };
const keys = (state, today) => dueReminders({ ...state, today }).map((r) => r.key);

test("nothing is due before the first reminder window", () => {
  assert.deepEqual(keys(base, "2026-12-16"), []); // 15 days left
});

test("both parties are reminded at each threshold", () => {
  assert.deepEqual(keys(base, "2026-12-17"), [`${END}:14:customer`, `${END}:14:vendor`]);
  assert.deepEqual(keys(base, "2026-12-30"), [`${END}:1:customer`, `${END}:1:vendor`]);
});

test("each reminder goes out only once", () => {
  const sent = [`${END}:14:customer`, `${END}:14:vendor`];
  assert.deepEqual(keys({ ...base, sentReminders: sent }, "2026-12-18"), []);
});

test("a failed send retries only the recipient who missed it", () => {
  const sent = [`${END}:14:customer`];
  assert.deepEqual(keys({ ...base, sentReminders: sent }, "2026-12-17"), [`${END}:14:vendor`]);
});

test("a missed run catches up with the closest reminder, once", () => {
  assert.deepEqual(keys(base, "2026-12-27"), [`${END}:7:customer`, `${END}:7:vendor`]); // 4 days left
});

test("the last day uses the 1-day reminder and does not repeat it", () => {
  const sent = [`${END}:1:customer`, `${END}:1:vendor`];
  assert.deepEqual(keys({ ...base, sentReminders: sent }, END), []);
});

test("after the end date only the vendor is told, once", () => {
  assert.deepEqual(keys(base, "2027-01-01"), [`${END}:ended:vendor`]);
  assert.deepEqual(keys({ ...base, sentReminders: [`${END}:ended:vendor`] }, "2027-01-05"), []);
});

test("a paused or dateless subscription sends nothing", () => {
  assert.deepEqual(keys({ ...base, isPaid: false }, "2026-12-30"), []);
  assert.deepEqual(keys({ ...base, endsAt: null }, "2026-12-30"), []);
});

test("a renewal starts a fresh set of reminders", () => {
  const renewed = { ...base, endsAt: "2027-12-31", sentReminders: [] };
  assert.deepEqual(keys(renewed, "2027-12-30"), ["2027-12-31:1:customer", "2027-12-31:1:vendor"]);
});

test("today follows Nairobi time, not UTC", () => {
  assert.equal(todayKey(new Date("2026-12-31T21:30:00Z")), "2027-01-01");
});

test("day counts and date validation", () => {
  assert.equal(daysUntil("2027-03-01", "2027-02-28"), 1);
  assert.equal(isValidDateKey("2026-02-30"), false);
  assert.equal(isValidDateKey("not-a-date"), false);
  assert.equal(isValidDateKey("2026-02-28"), true);
});

test("the customer email hides the vendor's pause controls", () => {
  const email = composeEmail({
    reminder: { kind: "upcoming", recipient: "customer", daysLeft: 7 },
    hospitalName: "City Hospital",
    endsAt: END,
    customerEmail: "c@hospital.test",
    vendorUrl: "https://app.test/vendor",
  });
  assert.match(email.subject, /in 7 days/);
  assert.doesNotMatch(email.text, /vendor|pause/i);
});
