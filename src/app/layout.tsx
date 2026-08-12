import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';

export const metadata: Metadata = {
  title: 'LocalMart - All Local Shops in One Place',
  description: 'Discover nearby local shops, order products, and support your local community. Bangladesh\'s premier location-based marketplace.',
  keywords: ['marketplace', 'local shops', 'bangladesh', 'ecommerce', 'delivery'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
