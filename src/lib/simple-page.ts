import { SITE } from "@/lib/site-config";

/** Small branded HTML page for email-link endpoints (confirm, unsubscribe). */
export function simplePage(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title} · ${SITE.name}</title></head>
<body style="margin:0;background:#FBF6F1;font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#2E2523;">
<main style="max-width:480px;margin:64px auto;padding:0 16px;">
<p style="font:500 24px/1 Georgia,serif;color:#9A4741;margin:0 0 24px;">${SITE.name}</p>
<h1 style="font:500 26px/1.25 Georgia,serif;margin:0 0 12px;">${title}</h1>
${body}
</main></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export const pageButton = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;margin-top:12px;padding:12px 24px;border-radius:999px;background:#9A4741;color:#fff;font-weight:600;text-decoration:none;">${label}</a>`;
