import { Inter } from "next/font/google";
import { HOSPITAL } from "@/config/hospital";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: `${HOSPITAL.name} | ${HOSPITAL.tagline}`,
  description: `Patient billing and point of sale for ${HOSPITAL.name}.`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>{children}</body>
    </html>
  );
}
