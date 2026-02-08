import './globals.css'

export const metadata = {
  title: 'Document Generator',
  description: 'Create professional documents with ease',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


