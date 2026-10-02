import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Status Board",
  description: "Organize weekly work and generate editable presentations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
