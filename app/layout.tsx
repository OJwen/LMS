import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import Navbar from '@/components/layout/Navbar'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-dm-sans' })
const dmSerifDisplay = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-dm-serif' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  title: 'Aligned Academy',
  description: 'Learning Management System for Aligned',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable} font-sans bg-[#F8F9FB] text-text-secondary antialiased min-h-screen`}>
        <Navbar />
        <main className="pt-16">
          {children}
        </main>
        <Toaster position="bottom-right" richColors theme="light" />
      </body>
    </html>
  )
}
