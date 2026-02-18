// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import ClientRootLayout from './ClientRootLayout';
import SecurityGuard from '@/components/SecurityGuard'; 
import SmoothScroll from '@/components/SmoothScroll'; // ✅ Import SmoothScroll

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SSI Studios',
  description: 'Automated poster creation system for SSI design team',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logos/ssilogo.png" />
      </head>
      <body className={inter.className}>
        <SmoothScroll> {/* ✅ Wrapped everything inside SmoothScroll */}
          <SecurityGuard /> 
          <ClientRootLayout>{children}</ClientRootLayout>
        </SmoothScroll>
      </body>
    </html>
  );
}