// Meta webhook for Instagram comments: https://dueduo.com/api/instagram/webhook
// Only receives events once the app has Advanced Access (App Review + Business Verification).
import { handleWebhookEvent, handleWebhookVerify } from "../../../../lib/instagram/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  return handleWebhookVerify(request);
}

export async function POST(request: Request) {
  return handleWebhookEvent(request);
}
