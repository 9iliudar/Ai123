import "./globals.css";

export const metadata = {
  title: "Ai123 | 你的专属 AI 导航页",
  description: "按分类整理常用 AI 工具与网站，支持搜索、拖拽排序和本地快捷添加。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
