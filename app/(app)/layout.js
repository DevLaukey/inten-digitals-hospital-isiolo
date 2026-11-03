import AppShell from "@/components/AppShell";
import { requireActiveSubscription } from "@/lib/subscription/store";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }) {
  await requireActiveSubscription();
  return <AppShell>{children}</AppShell>;
}
