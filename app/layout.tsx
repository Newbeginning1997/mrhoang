import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mr Hoàng English Class",
  description: "Quản lý lớp tiếng Anh cho học sinh và phụ huynh"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
