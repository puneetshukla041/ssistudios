// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import ClientRootLayout from './client-root-layout';
import SecurityGuard from '@/components/security-guard'; 
import SmoothScroll from '@/components/smooth-scroll';
import NextTopLoader from 'nextjs-toploader'; 

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
        {/* INCREASED Z-INDEX & HEIGHT FOR VISIBILITY */}
        <NextTopLoader
          color="#2233F0"
          initialPosition={0.08}
          crawlSpeed={500}
          height={4} 
          crawl={true}
          showSpinner={false}
          easing="ease-in-out"
          speed={800}
          /* Added spread radius to the shadow for the "Bloom" effect */
          shadow="0 0 15px #2233F0, 0 0 50px #2233F0, 0 0 200px 50px rgba(34, 51, 240, 0.5)"
          zIndex={99999} 
        />

        <SmoothScroll>
          <SecurityGuard /> 
          <ClientRootLayout>{children}</ClientRootLayout>
        </SmoothScroll>
      </body>
    </html>
  );
}