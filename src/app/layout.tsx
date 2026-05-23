import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kids Edu',
  description: 'Simple educational platform MVP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
