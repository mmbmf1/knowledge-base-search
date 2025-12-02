import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ISP Support Chat Tool',
  description: 'Semantic search for ISP troubleshooting scenarios',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
