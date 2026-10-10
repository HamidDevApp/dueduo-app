import { fulfillOrder, revokeForRefund } from "@/lib/billing";
import { verifyPolarWebhook, type PolarOrder } from "@/lib/polar";

// Polar needs the raw body to verify the signature — no caching, Node runtime.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook secret not set", { status: 500 });

  const body = await req.text();
  if (!verifyPolarWebhook(body, req.headers, secret)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const event = JSON.parse(body) as { type: string; data: PolarOrder };

  try {
    switch (event.type) {
      case "order.paid":
        await fulfillOrder(event.data);
        break;

      case "order.refunded":
        await revokeForRefund(event.data);
        break;
    }
  } catch (err) {
    console.error("[polar webhook] handling failed", event.type, err);
    return new Response("Handler error", { status: 500 }); // Polar will retry
  }

  return Response.json({ received: true });
}
