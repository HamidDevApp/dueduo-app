import { ImageResponse } from "next/og";

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
          background: "linear-gradient(135deg, #faf6f2 0%, #f7e6e2 55%, #e6efe8 100%)",
          color: "#2b2320",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#a44d47",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex" }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, border: "4px solid #fff" }} />
              <div style={{ width: 28, height: 28, borderRadius: 999, border: "4px solid rgba(255,255,255,0.75)", marginLeft: -12 }} />
            </div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, display: "flex" }}>
            Due<span style={{ color: "#a44d47" }}>Duo</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Your first pregnancy,</div>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "#a44d47" }}>
            planned for two.
          </div>
        </div>
        <div style={{ fontSize: 30, color: "#7a6d66" }}>Week-by-week plan · Co-Pilot for partners · One-time $29</div>
      </div>
    ),
    size,
  );
}
