import type { Metadata } from "next";
import { Instrument_Sans, Inter, Poppins } from "next/font/google";
import Image from "next/image";
import VisitorTracker from "@/components/VisitorTracker";
import WhatsAppButton from "@/components/WhatsAppButton";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap"
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Taxiseguro | Pide tu Taxi Seguro al Instante",
  description: "Pide tu taxi fácil y seguro desde nuestra app. Viajes rápidos, choferes profesionales verificados y tarifas transparentes en México.",
  icons: {
    icon: '/icon.png?v=2',
    apple: '/icon.png?v=2',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${instrumentSans.variable} ${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-body bg-white text-text-main antialiased overflow-x-hidden">
        <VisitorTracker />
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
