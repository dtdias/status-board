import type { Metadata, Viewport } from "next";
import { NetworkStatus } from "@/components/pwa/network-status";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Status Board",
  description: "Organize weekly work and generate editable presentations.",
  applicationName: "Status Board",
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Status Board",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1c1c1c",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ServiceWorkerRegistration />
        <NetworkStatus />
        {children}
      </body>
    </html>
  );
}
