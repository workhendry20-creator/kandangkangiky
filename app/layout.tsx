import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Kandang Kang Iky | Livestock Progress Tracker & Care Management',
  description:
    'Platform pemantauan perkembangan hewan ternak, manajemen penitipan qurban, dan rekam medis terpadu Kandang Kang Iky.',
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#EBF2E8] text-slate-800 antialiased selection:bg-[#D9E5D6] selection:text-[#5C6F57]">
        {children}
      </body>
    </html>
  )
}
