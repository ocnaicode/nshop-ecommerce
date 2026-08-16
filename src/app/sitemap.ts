import { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import { Product } from '@/models/Product';
import { Shop } from '@/models/Shop';
import { Category } from '@/models/Shop';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://localmart.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/shops`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/offers`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  try {
    await dbConnect();
    const [shops, products, categories] = await Promise.all([
      Shop.find({ isOpen: true }).select('slug updatedAt').lean(),
      Product.find({ status: { $in: ['active', 'published'] } }).select('slug updatedAt').lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
    ]);

    const shopPages: MetadataRoute.Sitemap = shops.map(s => ({
      url: `${BASE_URL}/shop/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    const productPages: MetadataRoute.Sitemap = products.map(p => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const categoryPages: MetadataRoute.Sitemap = categories.map(c => ({
      url: `${BASE_URL}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...shopPages, ...productPages, ...categoryPages];
  } catch {
    return staticPages;
  }
}
