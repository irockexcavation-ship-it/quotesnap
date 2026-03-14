import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuoteSnap",
  description: "Simple field quoting for contractors",
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
            height: "6px",
            background: "#f97316",
          }}
        />
        {children}
      </body>
    </html>
  );
}