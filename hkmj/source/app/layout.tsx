import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '港雀館｜香港麻雀',
  description: '一人對三位電腦的香港麻雀遊戲，設有提示、教學、番數計算與排行榜。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-HK">
      <body>{children}</body>
    </html>
  );
}
