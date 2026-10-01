import { ImageResponse } from "next/og";

export const alt = "First Pregnancy Planner — know exactly what happens next";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share card for Facebook, WhatsApp, TikTok and iMessage links. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #faf6f2 0%, #f7e6e2 60%, #e6efe8 100%)",
          color: "#2b2320",
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: "#c0615a", letterSpacing: 2 }}>FIRST PREGNANCY PLANNER</div>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1, marginTop: 24, maxWidth: 1000 }}>
          Pregnant for the first time? Here&apos;s exactly what happens next.
        </div>
        <div style={{ fontSize: 32, marginTop: 32, color: "#7a6d66" }}>
          Week-by-week plan · Partner Co-Pilot · One-time $29
        </div>
      </div>
    ),
    size,
  );
}
