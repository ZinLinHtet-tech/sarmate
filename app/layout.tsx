import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sarmate · Learn with evidence",
  description: "Source-linked study notes and retrieval practice.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
