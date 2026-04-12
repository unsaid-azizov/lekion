import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lekion — лезгинское сообщество",
  description: "Каталог лезгинских специалистов и бизнесов по всему миру",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
