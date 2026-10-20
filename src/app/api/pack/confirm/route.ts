import { confirm } from "@/lib/pack";
import { PACK_PDF_PATH } from "@/lib/pack-emails";
import { SITE } from "@/lib/site-config";
import { pageButton, simplePage } from "@/lib/simple-page";

// Confirm link from the double opt-in email: confirms and sends the pack.
export const dynamic = "force-dynamic";

const invalid = () =>
  simplePage(
    "This link doesn't work",
    `<p>It may have expired. Sign up again on any of our guides, or email ${SITE.supportEmail}.</p>`,
    400,
  );

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return invalid();
  try {
    if (!(await confirm(token))) return invalid();
  } catch (err) {
    console.error("[pack confirm] failed", err);
    return simplePage("Something went wrong", `<p>Please try the link again in a minute, or email ${SITE.supportEmail}.</p>`, 500);
  }
  return simplePage(
    "You're confirmed!",
    `<p>Your free planning pack is on its way to your inbox. You can also download it right now:</p>${pageButton(PACK_PDF_PATH, "Download the pack (PDF)")}`,
  );
}
