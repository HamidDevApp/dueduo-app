import "server-only";

/**
 * Minimal Resend client (no SDK needed), like polar.ts.
 * Sends from hello@dueduo.com — the domain is verified in Resend.
 */
export const EMAIL_FROM = "DueDuo <hello@dueduo.com>";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export async function sendEmail(email: OutgoingEmail): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, ...email }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Resend → ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string };
}
