'use client';

import { usePathname } from 'next/navigation';
import {
  Store, Package, ShoppingCart, Users, DollarSign, Settings,
  BarChart3, List, Truck, CreditCard, Star,
} from 'lucide-react';
import PanelShell from '@/components/dashboard/panel-shell';

const PUBLIC_PREFIXES = ['/seller/info', '/seller/plans', '/seller/support', '/seller/register'];

const items = [
  { icon: BarChart3, label: 'Dashboard', href: '/seller' },
  { icon: Package, label: 'Products', href: '/seller/products' },
  { icon: ShoppingCart, label: 'Orders', href: '/seller/orders' },
  { icon: List, label: 'Inventory', href: '/seller/inventory' },
  { icon: CreditCard, label: 'POS', href: '/seller/pos' },
  { icon: Users, label: 'Customers', href: '/seller/customers' },
  { icon: Truck, label: 'Delivery', href: '/seller/delivery' },
  { icon: DollarSign, label: 'Wallet', href: '/seller/wallet' },
  { icon: Star, label: 'Reviews', href: '/seller/reviews' },
  { icon: Settings, label: 'Settings', href: '/seller/settings' },
];

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <PanelShell
      variant="light"
      brandTitle="Seller Panel"
      brandSubtitle="LocalMart"
      brandIcon={Store}
      brandHref="/seller"
      items={items}
      skip={isPublic}
    >
      {children}
    </PanelShell>
  );
}
