import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletProvider';
import { WalletModalProvider } from '@/contexts/WalletModalContext';
import Layout from '@/components/LayoutMVP';
import HMRErrorSuppressor from '@/components/HMRErrorSuppressor';
import ErrorBoundary from '@/components/ErrorBoundary';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <WalletProvider>
            <WalletModalProvider>
              <QueryClientProvider client={queryClient}>
                <HMRErrorSuppressor />
                <Layout>
                  <Component {...pageProps} />
                </Layout>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#374151',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '1rem',
                      backdropFilter: 'blur(10px)',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </QueryClientProvider>
            </WalletModalProvider>
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
