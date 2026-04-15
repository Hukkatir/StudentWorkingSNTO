import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, rgba(15,118,110,0.25), transparent 40%), #f7f8f6",
          color: "#0f172a",
          fontSize: 190,
          fontWeight: 700,
          borderRadius: 80,
        }}
      >
        SD
      </div>
    ),
    size,
  );
}
