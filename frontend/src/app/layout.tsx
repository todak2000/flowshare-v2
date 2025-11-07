import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://flowshare-frontend-226906955613.europe-west1.run.app'),
  title: {
    default: 'FlowShare | AI-Powered Hydrocarbon Allocation for Oil & Gas JVs',
    template: '%s | FlowShare'
  },
  description: 'Transform weeks of manual hydrocarbon allocation into minutes with AI-powered automation. API MPMS 11.1 compliant. 95% faster reconciliation. Real-time anomaly detection. Join 500+ JVs managing allocations automatically. Try free for 14 days.',
  keywords: [
    'hydrocarbon allocation',
    'oil and gas',
    'joint venture',
    'JV reconciliation',
    'API MPMS 11.1',
    'SCADA integration',
    'production accounting',
    'AI automation',
    'petroleum allocation',
    'energy software',
    'upstream oil and gas',
    'production data management',
    'FlowShare',
    'allocation software',
    'reconciliation automation'
  ],
  authors: [{ name: 'FlowShare' }],
  creator: 'FlowShare',
  publisher: 'FlowShare',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://flowshare-frontend-226906955613.europe-west1.run.app',
    siteName: 'FlowShare',
    title: 'FlowShare | AI-Powered Hydrocarbon Allocation',
    description: '95% faster reconciliation with AI-powered automation. API MPMS 11.1 compliant. Join 500+ JVs managing allocations automatically. Start your 14-day free trial today.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FlowShare - AI-Powered Hydrocarbon Allocation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowShare | AI-Powered Hydrocarbon Allocation',
    description: '95% faster reconciliation with AI. API MPMS 11.1 compliant. Try free for 14 days.',
    images: ['/og-image.png'],
    creator: '@flowshare',
  },
  icons: {
    icon: '/favicon.ico',
  },
  alternates: {
    canonical: 'https://flowshare-frontend-226906955613.europe-west1.run.app',
  },
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
