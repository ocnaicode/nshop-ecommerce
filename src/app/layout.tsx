import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';
import SiteChrome from '@/components/layout/site-chrome';
import PushNotificationRegister from '@/components/providers/push-notification-register';
import { normalizeLanguage, translate } from '@/lib/i18n';
import { SEO_CONFIG, APP_CONFIG } from '@/config/constants';

const appUrl = APP_CONFIG.url.replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: SEO_CONFIG.title,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: SEO_CONFIG.description,
  keywords: [...SEO_CONFIG.keywords],
  applicationName: APP_CONFIG.name,
  category: 'shopping',
  alternates: {
    canonical: '/',
    languages: {
      en: `${appUrl}/`,
      bn: `${appUrl}/?lang=bn`,
    },
  },
  openGraph: {
    type: 'website',
    url: appUrl,
    siteName: APP_CONFIG.name,
    title: SEO_CONFIG.title,
    description: SEO_CONFIG.description,
    images: [{ url: SEO_CONFIG.openGraphImage, width: 1200, height: 630, alt: APP_CONFIG.name }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONFIG.title,
    description: SEO_CONFIG.description,
    images: [SEO_CONFIG.openGraphImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(cookieStore.get('lang')?.value);
  const htmlLang = lang === 'bn' ? 'bn' : 'en';
  const dir = htmlLang === 'bn' ? 'ltr' : 'ltr';

  return (
    <html lang={htmlLang} dir={dir} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: APP_CONFIG.name,
              url: appUrl,
              description: translate('home.subtitle', lang),
              logo: `${appUrl}/icon-192.png`,
              sameAs: [
                'https://facebook.com/localmart',
                'https://x.com/localmart',
                'https://instagram.com/localmart',
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <SiteChrome>{children}</SiteChrome>
          <PushNotificationRegister />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
