import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GEO Pilot Demo",
  description: "面向中国市场的生成式搜索优化内容生成系统 Demo"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
