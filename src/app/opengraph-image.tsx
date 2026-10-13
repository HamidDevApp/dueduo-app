import { ImageResponse } from "next/og";
import { MARK_BACK, MARK_FRONT, MARK_VIEWBOX, WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/components/brand/logo";

export const alt = "DueDuo — your first pregnancy, planned for two";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share card for WhatsApp, Facebook, TikTok and iMessage links. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #fbf6f1 0%, #f6e4df 55%, #e6efe8 100%)",
          color: "#2d2326",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="60" height="53" viewBox={MARK_VIEWBOX}>
            <path d={MARK_BACK} fill="#8FA48F" />
            <path d={MARK_FRONT} fill="#C0615A" />
          </svg>
          <svg width="208" height="44" viewBox={WORDMARK_VIEWBOX}>
            <path d={WORDMARK_PATH} fill="#2d2326" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Your first pregnancy,</div>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "#9a4741" }}>
            planned for two.
          </div>
        </div>
        <div style={{ fontSize: 30, color: "#6e6260" }}>Week-by-week plan · Co-Pilot for partners · One-time $29</div>
      </div>
    ),
    size,
  );
}
