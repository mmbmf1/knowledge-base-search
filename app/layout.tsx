import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Support Chat Tool',
  description: 'Semantic search for troubleshooting scenarios and knowledge base',
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
