import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-public-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Portrait bench",
  description: "Check a headshot and read its smile score.",
};

const RootLayout = ({ children }: LayoutProps<"/">) => (
  <html
    lang="en"
    className={`${publicSans.variable} ${fraunces.variable} light h-full antialiased`}
    data-theme="light"
  >
    <body className="h-dvh overflow-hidden bg-studio font-sans text-paper">{children}</body>
  </html>
);

export default RootLayout;
