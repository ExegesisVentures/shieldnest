// apps/web/src/app/layout.tsx
import React from 'react';
import { Inter } from 'next/font/google';
import { WalletProvider } from '@/contexts/WalletContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { Toaster } from 'sonner';
import { initSentry } from '@/lib/sentry';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Initialize Sentry
if (typeof window === 'undefined') {
  // Server-side initialization is handled by sentry.server.config.ts
} else {
  // Client-side initialization is handled by sentry.client.config.ts
}

export const metadata = {
  title: 'ShieldNest - Secure Coreum Portfolio Dashboard',
  description: 'Professional portfolio tracking for Coreum users with exclusive Shield NFT membership.',
  keywords: 'Coreum, portfolio, DeFi, NFT, Shield, crypto, blockchain',
  authors: [{ name: 'ShieldNest Team' }],
  openGraph: {
    title: 'ShieldNest - Secure Coreum Portfolio Dashboard',
    description: 'Professional portfolio tracking for Coreum users with exclusive Shield NFT membership.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShieldNest - Secure Coreum Portfolio Dashboard',
    description: 'Professional portfolio tracking for Coreum users with exclusive Shield NFT membership.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
          <WalletProvider>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
            
            {/* Toast notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                },
              }}
            />
          </WalletProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
