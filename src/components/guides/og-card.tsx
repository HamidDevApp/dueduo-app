import { ImageResponse } from "next/og";
import { MARK_BACK, MARK_FRONT, MARK_VIEWBOX, WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/components/brand/logo";

export const OG_SIZE = { width: 1200, height: 630 };

/** 1200×630 share card for a guide, in the same style as app/opengraph-image.tsx. */
export function guideOgImage(title: string, kicker: string) {
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
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 1000 }}>{title}</div>
        <div style={{ fontSize: 30, color: "#9a4741" }}>{kicker}</div>
      </div>
    ),
    OG_SIZE,
  );
}
