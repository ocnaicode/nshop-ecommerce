'use client';

import {
  LayoutDashboard, Users, Store, Package, ShoppingCart, DollarSign,
  Truck, Star, Settings, Shield, Tag, BarChart3, Flag, Bell, Megaphone,
} from 'lucide-react';
import PanelShell from '@/components/dashboard/panel-shell';

const items = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Store, label: 'Sellers', href: '/admin/sellers' },
  { icon: Store, label: 'Shops', href: '/admin/shops' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
  { icon: DollarSign, label: 'Payments', href: '/admin/payments' },
  { icon: Truck, label: 'Delivery', href: '/admin/delivery' },
  { icon: Users, label: 'Riders', href: '/admin/riders' },
  { icon: Tag, label: 'Coupons', href: '/admin/coupons' },
  { icon: Star, label: 'Reviews', href: '/admin/reviews' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Megaphone, label: 'Campaigns', href: '/admin/campaigns' },
  { icon: Flag, label: 'Disputes', href: '/admin/disputes' },
  { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelShell
      variant="dark"
      brandTitle="Admin Panel"
      brandSubtitle="LocalMart Control"
      brandIcon={Shield}
      brandHref="/admin"
      items={items}
      headerClassName="from-gray-900 via-gray-900 to-indigo-950 border-b border-white/10"
    >
      {children}
    </PanelShell>
  );
}
