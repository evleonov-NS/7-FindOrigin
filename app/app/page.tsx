import { Fraunces, Manrope } from "next/font/google";
import Script from "next/script";
import MiniAppClient from "./MiniAppClient";

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mini-display",
});

const sans = Manrope({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-mini-sans",
});

export default function MiniAppPage() {
  return (
    <div className={`${display.variable} ${sans.variable}`}>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <MiniAppClient />
    </div>
  );
}
