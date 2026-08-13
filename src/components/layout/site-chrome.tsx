'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from './header';
import Footer from './footer';

// Routes that render their own chrome (auth screens and dashboards with sidebars).
const EXCLUDED_PREFIXES = [
  '/login',
  '/register',
  '/admin',
  '/customer',
  '/rider',
  '/checkout',
  '/seed',
];

// Seller dashboard routes (sidebar layout). Public seller pages such as
// /seller/info, /seller/plans and /seller/support keep the global header/footer.
const SELLER_DASHBOARD_PREFIXES = [
  '/seller', // exact match handled below
  '/seller/products',
  '/seller/orders',
  '/seller/inventory',
  '/seller/pos',
  '/seller/customers',
  '/seller/delivery',
  '/seller/wallet',
  '/seller/reviews',
  '/seller/settings',
  '/seller/staff',
  '/seller/suppliers',
  '/seller/purchases',
  '/seller/insights',
];

function shouldHideChrome(pathname: string) {
  if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return true;
  }
  // Exact /seller and its dashboard sub-routes.
  if (pathname === '/seller') return true;
  return SELLER_DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p + '/'));
}

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
    });
  }, []);

  // Re-trigger AOS when navigating to a new public page.
  useEffect(() => {
    AOS.refreshHard();
  }, [pathname]);

  const hide = shouldHideChrome(pathname);

  if (hide) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
