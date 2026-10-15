// The comment-to-DM poller: https://dueduo.com/api/instagram/poll
// Called every 2 minutes by cron-job.org with "Authorization: Bearer <IG_POLL_KEY>".
// (Vercel Cron can only call it once a day on the Hobby plan, so it is not used for this.)
import { handlePoll } from "../../../../lib/instagram/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  return handlePoll(request);
}
