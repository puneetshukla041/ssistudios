// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import ClientRootLayout from './ClientRootLayout';
import SecurityGuard from '@/components/SecurityGuard'; // 1. Import the guard

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SSI Studios',
  description: 'Automated poster creation system for SSI design team',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // ✅ FIX: Apply suppressHydrationWarning directly to the <html> tag
    <html lang="en" suppressHydrationWarning> 
      <head>
        <link rel="icon" href="/logos/ssilogo.png" />
      </head>
      {/* It's okay to keep the class here, but the warning prop is removed from body */}
      <body className={inter.className}> 
        <SecurityGuard /> {/* 2. Add the guard component here */}
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  );
}