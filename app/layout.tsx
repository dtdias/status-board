import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Status Board",
  description: "Weekly status board for presentation-ready reporting.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
