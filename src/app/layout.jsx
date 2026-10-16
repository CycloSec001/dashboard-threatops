import './globals.css'

export const metadata = {
  title: 'CycloSec ThreatOps - Enterprise Security Operations',
  description: 'Enterprise Threat Intelligence, Detection & SOC Platform',
  icons: {
    icon: '/assets/logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-htb-bg text-htb-text antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
