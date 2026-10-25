import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Heebo } from "next/font/google";
import { ServiceWorkerRegister } from "./service-worker-register";
import { StageBackground } from "./stage-background";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const frankRuhlLibre = Frank_Ruhl_Libre({
  variable: "--font-frank",
  subsets: ["hebrew", "latin"],
  weight: ["900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "מכונת הבדיחות",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  // Full screen on iOS; content stays clear of the status bar via safe-area padding
  appleWebApp: {
    capable: true,
    title: "מכונת הבדיחות",
    statusBarStyle: "black-translucent",
  },
};

// viewport-fit=cover + safe-area padding (ARCHITECTURE.md, section 2.12)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070a2e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${frankRuhlLibre.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-midnight font-sans text-white">
        <StageBackground />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
