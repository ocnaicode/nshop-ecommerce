import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://localmart.com';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/seller/', '/rider/', '/checkout', '/customer/'] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
