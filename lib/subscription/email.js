import "server-only";

const isDryRun = () =>
  process.env.EMAIL_DRY_RUN === "1" && process.env.NODE_ENV !== "production";

export const isEmailConfigured = () =>
  isDryRun() || Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail({ to, subject, text }) {
  if (isDryRun()) {
    console.log(`[email dry run] to=${to} subject="${subject}"`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
  });
  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}: ${await response.text()}`);
  }
}
