import "./globals.css";

export const metadata = {
  title: "Aibc.cafe",
  description: "Aibc.cafe AI navigation and idea workspace.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
