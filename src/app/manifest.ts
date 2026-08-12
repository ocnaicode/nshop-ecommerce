import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LocalMart - All Local Shops in One Place',
    short_name: 'LocalMart',
    description: 'Discover nearby local shops, order products, and support your local community.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
    categories: ['shopping', 'food', 'lifestyle'],
    lang: 'en',
    dir: 'ltr',
  };
}
