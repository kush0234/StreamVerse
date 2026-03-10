import './globals.css'

export const metadata = {
  title: 'StreamVerse - Entertainment Platform',
  description: 'Watch movies, series, and listen to music',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Razorpay script will be loaded dynamically when needed */}
      </head>
      <body>{children}</body>
    </html>
  )
}
