import { redirect } from "next/navigation";
import { HOSPITAL } from "@/config/hospital";
import { isAppActive } from "@/lib/subscription/store";

export const dynamic = "force-dynamic";
export const metadata = { title: `Service paused | ${HOSPITAL.name}` };

export default async function SuspendedPage() {
  if (await isAppActive()) redirect("/login");
  const contact = process.env.SUPPORT_CONTACT;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
        <h1 className="text-xl font-bold">Service paused</h1>
        <p className="mt-2 text-sm text-slate-600">
          The {HOSPITAL.name} billing system is paused because the subscription needs attention.
          Your records are safe and access returns as soon as the subscription is renewed.
        </p>
        <p className="mt-4 text-sm font-medium">
          {contact ? `To renew, contact ${contact}.` : "To renew, contact your system provider."}
        </p>
      </div>
    </main>
  );
}
