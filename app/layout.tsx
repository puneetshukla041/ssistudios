import './globals.css'
import ClientRootLayout from './ClientRootLayout'

export const metadata = {
  title: 'SSI Studios Dashboard',
  description: 'Automated poster creation system for SSI design team',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="relative text-white">
        <ClientRootLayout>{children}</ClientRootLayout>
      </body>
    </html>
  )
}
