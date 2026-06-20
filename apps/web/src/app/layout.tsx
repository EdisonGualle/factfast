import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "FactFast — Facturación Electrónica Ecuador",
    template: "%s | FactFast",
  },
  description:
    "Sistema SaaS ERP/POS de facturación electrónica para Ecuador. Factura rápido, controla inventario, gestiona ventas.",
  keywords: [
    "facturación electrónica",
    "SRI Ecuador",
    "ERP",
    "POS",
    "inventario",
    "SaaS",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Onest:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
