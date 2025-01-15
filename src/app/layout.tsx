import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "@xyflow/react/dist/style.css";
import "./globals.css";

const noto = Noto_Sans({
  weight: "400",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${noto.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
