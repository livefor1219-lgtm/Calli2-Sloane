import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Calli Pitch - YC Interview Practice',
  description: 'Practice your pitch with Sloane, a brutal Silicon Valley VC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

