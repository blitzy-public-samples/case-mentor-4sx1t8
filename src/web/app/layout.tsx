// Human Tasks:
// 1. Verify that all required Google Fonts are properly configured in project settings
// 2. Ensure color contrast ratios meet WCAG 2.1 AA standards in both light and dark modes
// 3. Test responsive layout behavior across all target breakpoints
// 4. Validate HTML semantics with screen readers

// next/font/google v13.4.0
import { Inter, RobotoMono } from 'next/font/google'

// Import global styles and providers
import './globals.css'
import ThemeProvider from '../providers/ThemeProvider'
import ToastProvider from '../providers/ToastProvider'
import AuthProvider from '../providers/AuthProvider'

// Requirement: Design System Implementation (7.1.1)
// Configure optimized font loading with proper subsets and display settings
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans'
})

const robotoMono = RobotoMono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono'
})

// Requirement: Design System Implementation (7.1.1)
// Generate metadata for the application with SEO and accessibility configurations
export function generateMetadata() {
  return {
    title: 'Case Interview Practice Platform',
    description: 'Master case interviews with AI-powered practice drills and real-time feedback',
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
      userScalable: true,
    },
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
      { media: '(prefers-color-scheme: dark)', color: '#0F172A' }
    ],
    manifest: '/manifest.json',
    openGraph: {
      type: 'website',
      title: 'Case Interview Practice Platform',
      description: 'Master case interviews with AI-powered practice drills and real-time feedback',
      siteName: 'Case Interview Practice Platform',
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    }
  }
}

// Requirement: Accessibility Requirements (7.1.4)
// Root layout component implementing WCAG 2.1 AA compliant structure
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Apply font variables and ensure proper language attribute
    <html 
      lang="en" 
      className={`${inter.variable} ${robotoMono.variable}`}
      // Enable smooth scrolling but respect user preferences
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* Requirement: Accessibility Requirements (7.1.4) */}
      {/* Ensure proper viewport meta and color contrast */}
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>

      <body>
        {/* Requirement: Design System Implementation (7.1.1) */}
        {/* Wrap application with theme provider for consistent styling */}
        <ThemeProvider>
          {/* Requirement: Accessibility Requirements (7.1.4) */}
          {/* Provide toast notifications with ARIA announcements */}
          <ToastProvider>
            {/* Requirement: Authentication Flow (8.1.1) */}
            {/* Manage global authentication state with JWT */}
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}