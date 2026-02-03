
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from './components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Míluz AI',
  description: 'Tu socio digital para escalar negocios.',
  manifest: '/manifest.json',
  themeColor: '#4A00E0',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Míluz',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}

