import { requireActiveSubscription } from "@/lib/subscription/store";

export const dynamic = "force-dynamic";

export default async function LoginLayout({ children }) {
  await requireActiveSubscription();
  return children;
}
