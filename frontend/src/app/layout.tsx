import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lekion Map",
  description: "Directory of Lezgin businesses and professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
