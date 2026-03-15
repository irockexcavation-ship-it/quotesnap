import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuoteSnap",
  description: "Fast field quotes for contractors",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            width: "100%",
            background: "#1c1917",
            color: "#ffffff",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderBottom: "4px solid #f97316",
            boxSizing: "border-box",
          }}
        >
          <img
            src="/icon.png"
            alt="QuoteSnap"
            style={{
              width: "28px",
              height: "28px",
              display: "block",
            }}
          />
          <div
            style={{
              fontWeight: 800,
              fontSize: "18px",
              letterSpacing: "0.02em",
            }}
          >
            QuoteSnap
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}