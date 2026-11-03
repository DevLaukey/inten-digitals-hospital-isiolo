import { NextResponse } from "next/server";
import { HOSPITAL } from "@/config/hospital";
import { isEmailConfigured, sendEmail } from "@/lib/subscription/email";
import { composeEmail, dueReminders, todayKey } from "@/lib/subscription/reminders.mjs";
import { secretMatches } from "@/lib/subscription/secret";
import { readSubscription, updateSubscription } from "@/lib/subscription/store";

export const dynamic = "force-dynamic";

// Called once a day by a scheduler. Safe to call more often: each email is sent once.
export async function GET(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!secretMatches(token, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendorEmail = process.env.VENDOR_EMAIL;
  const customerEmail = process.env.BILLING_CUSTOMER_EMAIL;
  if (!isEmailConfigured() || !vendorEmail || !customerEmail) {
    return NextResponse.json({ error: "Email settings are incomplete." }, { status: 500 });
  }

  const subscription = await readSubscription();
  const due = dueReminders({ ...subscription, today: todayKey() });
  const sentReminders = [...subscription.sentReminders];
  const sent = [];
  const failed = [];

  for (const reminder of due) {
    try {
      const { subject, text } = composeEmail({
        reminder,
        hospitalName: HOSPITAL.name,
        endsAt: subscription.endsAt,
        customerEmail,
        vendorUrl: process.env.APP_URL && `${process.env.APP_URL}/vendor`,
      });
      await sendEmail({
        to: reminder.recipient === "vendor" ? vendorEmail : customerEmail,
        subject,
        text,
      });
      sentReminders.push(reminder.key);
      // Saved after each send so a later failure can't cause a repeat email.
      await updateSubscription({ sentReminders });
      sent.push(reminder.key);
    } catch (err) {
      console.error(`Reminder ${reminder.key} failed`, err);
      failed.push(reminder.key);
    }
  }

  return NextResponse.json({ sent, failed }, { status: failed.length ? 502 : 200 });
}
