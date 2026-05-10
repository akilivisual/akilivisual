import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AkiliVisual',
  description: 'Cinematic runtime',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black">
        {children}
      </body>
    </html>
  )
}
