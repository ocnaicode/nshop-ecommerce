import Link from 'next/link';
import { Store, MapPin, Phone, Mail } from 'lucide-react';
import LanguageSwitcher from '@/components/layout/language-switcher';

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.9 2h3.68l-8.04 9.19L24 22h-7.41l-5.8-7.58L4.15 22H.47l8.6-9.83L0 2h7.59l5.24 6.93L18.9 2Zm-1.29 17.9h2.04L6.49 3.94H4.3l13.31 15.96Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    </svg>
  );
}

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'For Customers',
    links: [
      { label: 'Browse Shops', href: '/shops' },
      { label: 'All Products', href: '/products' },
      { label: 'Categories', href: '/categories' },
      { label: 'Today\'s Offers', href: '/offers' },
      { label: 'My Orders', href: '/customer/orders' },
    ],
  },
  {
    title: 'For Sellers',
    links: [
      { label: 'Become a Seller', href: '/seller/register' },
      { label: 'Seller Center', href: '/seller/info' },
      { label: 'Pricing Plans', href: '/seller/plans' },
      { label: 'Seller Support', href: '/seller/support' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

const SOCIALS = [
  { label: 'Facebook', href: '#', icon: FacebookIcon },
  { label: 'X (Twitter)', href: '#', icon: XIcon },
  { label: 'Instagram', href: '#', icon: InstagramIcon },
  { label: 'YouTube', href: '#', icon: YoutubeIcon },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-16" data-aos="fade-up">
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-green-600 to-emerald-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand + contact */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">LocalMart</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              All local shops in one place. Discover nearby stores, order fresh products, and support
              your local community across Bangladesh.
            </p>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-green-500 shrink-0" />
                <a href="tel:+8801700000000" className="hover:text-white transition-colors">+880 1700-000000</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-green-500 shrink-0" />
                <a href="mailto:support@localmart.com" className="hover:text-white transition-colors">support@localmart.com</a>
              </li>
            </ul>
            <div className="flex items-center gap-2 pt-1">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-green-600 hover:text-white flex items-center justify-center transition-colors"
                >
                  <s.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">{col.title}</h3>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p>&copy; {new Date().getFullYear()} LocalMart. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <p className="text-gray-500">Made with 💚 for local businesses in Bangladesh</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
