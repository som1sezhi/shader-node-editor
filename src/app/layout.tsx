import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "@xyflow/react/dist/style.css";
import "./globals.css";

const noto = Noto_Sans({
  weight: "400",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Shader Node Editor",
  description: "A node-based shader editor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/*<head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      </head>*/}
      <body className={`${noto.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
