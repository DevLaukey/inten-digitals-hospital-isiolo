// Pure reminder logic, with no I/O, so it can be unit tested on its own.

export const REMINDER_DAYS = [14, 7, 3, 1];

// Renewal dates are calendar days in the hospital's time zone, not the server's.
export function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(now);
}

export function isValidDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function daysUntil(endsAt, today) {
  const toUtc = (key) => new Date(`${key}T00:00:00Z`).getTime();
  return Math.round((toUtc(endsAt) - toUtc(today)) / 86400000);
}

// Which emails are due today and not yet sent. Each recipient is tracked separately,
// so a failed send is retried on the next run without repeating the one that worked.
// If a run is missed, the closest reminder still goes out once instead of being lost.
export function dueReminders({ isPaid, endsAt, sentReminders = [], today }) {
  if (!isPaid || !endsAt) return [];
  const daysLeft = daysUntil(endsAt, today);

  let candidates;
  if (daysLeft < 0) {
    // Only you hear about this: you decide whether to pause.
    candidates = [{ kind: "ended", recipient: "vendor", key: `${endsAt}:ended:vendor` }];
  } else {
    const threshold = [...REMINDER_DAYS].sort((a, b) => a - b).find((days) => days >= daysLeft);
    if (threshold === undefined) return [];
    candidates = ["customer", "vendor"].map((recipient) => ({
      kind: "upcoming",
      recipient,
      key: `${endsAt}:${threshold}:${recipient}`,
    }));
  }

  return candidates
    .filter((reminder) => !sentReminders.includes(reminder.key))
    .map((reminder) => ({ ...reminder, daysLeft }));
}

function whenText(daysLeft) {
  if (daysLeft === 0) return "today";
  return daysLeft === 1 ? "in 1 day" : `in ${daysLeft} days`;
}

export function composeEmail({ reminder, hospitalName, endsAt, customerEmail, vendorUrl }) {
  const pauseHint = vendorUrl ? `Manage it here: ${vendorUrl}` : "Manage it from the /vendor page.";

  if (reminder.kind === "ended") {
    return {
      subject: `${hospitalName}: subscription ended on ${endsAt}`,
      text:
        `The subscription for ${hospitalName} ended on ${endsAt}.\n\n` +
        `The app stays active until you act. If they have paid, record the renewal. ` +
        `If they have not, pause the app.\n\n${pauseHint}`,
    };
  }

  const when = whenText(reminder.daysLeft);
  if (reminder.recipient === "vendor") {
    return {
      subject: `${hospitalName}: subscription ends ${when}`,
      text:
        `The subscription for ${hospitalName} ends on ${endsAt} (${when}).\n` +
        `A reminder was also sent to ${customerEmail}.\n\n` +
        `The app will not pause by itself.\n\n${pauseHint}`,
    };
  }
  return {
    subject: `Your ${hospitalName} billing system subscription ends ${when}`,
    text:
      `Hello,\n\nThe subscription for your ${hospitalName} billing system ends on ${endsAt} (${when}).\n\n` +
      `Please complete your renewal payment before then to avoid any interruption to the service. ` +
      `If you have already paid, please disregard this message.`,
  };
}
