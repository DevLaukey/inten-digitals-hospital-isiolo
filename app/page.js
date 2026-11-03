import { redirect } from "next/navigation";

// No public landing page: the login screen is the way in.
export default function Home() {
  redirect("/login");
}
