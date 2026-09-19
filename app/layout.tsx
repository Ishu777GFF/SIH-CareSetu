import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareSetu — Your story. Better care.",
  description: "CareSetu patient case-taking and clinician coordination preview for SIH26047.",
  other: {
    "codex-preview": "development",
  },
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
      <body className="antialiased"><script dangerouslySetInnerHTML={{__html: `try{document.documentElement.dataset.theme=localStorage.getItem("medi-theme")||"system"}catch(e){}`}} />{children}</body>
    </html>
  );
}
