import type { Metadata } from "next";
import "antd/dist/reset.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "KeyLish Admin",
  description: "B?ng ?i?u khi?n v?n h?nh KeyLish",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
