import { NextResponse } from "next/server";
import { isEmailConfigured } from "@/lib/subscription/email";
import { daysUntil, isValidDateKey, todayKey } from "@/lib/subscription/reminders.mjs";
import { secretMatches } from "@/lib/subscription/secret";
import { readSubscription, updateSubscription } from "@/lib/subscription/store";

export const dynamic = "force-dynamic";

function describe(subscription) {
  return {
    isPaid: subscription.isPaid,
    endsAt: subscription.endsAt,
    daysLeft: subscription.endsAt ? daysUntil(subscription.endsAt, todayKey()) : null,
    customerEmail: process.env.BILLING_CUSTOMER_EMAIL || null,
    remindersReady: Boolean(
      isEmailConfigured() &&
        process.env.VENDOR_EMAIL &&
        process.env.BILLING_CUSTOMER_EMAIL &&
        process.env.CRON_SECRET
    ),
  };
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!secretMatches(body.secret, process.env.VENDOR_SECRET)) {
    return NextResponse.json({ error: "Incorrect vendor secret." }, { status: 401 });
  }

  try {
    switch (body.action) {
      case "status":
        return NextResponse.json(describe(await readSubscription()));
      case "pause":
        return NextResponse.json(describe(await updateSubscription({ isPaid: false })));
      case "resume":
        return NextResponse.json(describe(await updateSubscription({ isPaid: true })));
      case "renew":
        if (!isValidDateKey(body.endsAt) || body.endsAt < todayKey()) {
          return NextResponse.json({ error: "Choose an end date that is not in the past." }, { status: 400 });
        }
        return NextResponse.json(
          describe(await updateSubscription({ isPaid: true, endsAt: body.endsAt, sentReminders: [] }))
        );
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    console.error("Vendor subscription action failed", err);
    return NextResponse.json({ error: "The change could not be saved." }, { status: 500 });
  }
}
