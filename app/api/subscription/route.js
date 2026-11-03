import { NextResponse } from "next/server";
import { isAppActive } from "@/lib/subscription/store";

export const dynamic = "force-dynamic";

// Lets open tabs notice a pause. It reveals nothing beyond active or not.
export async function GET() {
  return NextResponse.json({ active: await isAppActive() });
}
