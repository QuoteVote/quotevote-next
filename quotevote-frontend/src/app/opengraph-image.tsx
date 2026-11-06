import { ImageResponse } from "next/og";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/metadata";

export const alt = DEFAULT_OG_IMAGE.alt;
export const size = { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height };
export const contentType = "image/png";

export default function OpengraphImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 96px",
        background: "#0B0E11",
        color: "#F0F6FC",
      }}
    >
      <div style={{ display: "flex", fontSize: 112, fontWeight: 700, letterSpacing: -2 }}>
        Quote<span style={{ color: "#52b274" }}>.</span>Vote
      </div>
      <div style={{ display: "flex", marginTop: 32, fontSize: 44, color: "#C9D1D9" }}>
        Share ideas. Vote on what matters.
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 56,
          width: 160,
          height: 10,
          borderRadius: 5,
          background: "#52b274",
        }}
      />
    </div>,
    size
  );
}
