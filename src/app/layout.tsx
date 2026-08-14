import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import SiteChrome from '@/components/layout/site-chrome';

export const metadata: Metadata = {
  title: 'LocalMart - All Local Shops in One Place',
  description: 'Discover nearby local shops, order products, and support your local community. Bangladesh\'s premier location-based marketplace.',
  keywords: ['marketplace', 'local shops', 'bangladesh', 'ecommerce', 'delivery'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* Accessibility: skip-to-content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <SiteChrome>{children}</SiteChrome>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
