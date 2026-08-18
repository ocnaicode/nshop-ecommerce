'use client';

import {
  LayoutDashboard, Package, Heart, MapPin, User, MessageSquare,
} from 'lucide-react';
import PanelShell from '@/components/dashboard/panel-shell';

const items = [
  { icon: LayoutDashboard, label: 'Overview', href: '/customer' },
  { icon: Package, label: 'Orders', href: '/customer/orders' },
  { icon: Heart, label: 'Wishlist', href: '/customer/wishlist' },
  { icon: MapPin, label: 'Addresses', href: '/customer/addresses' },
  { icon: MessageSquare, label: 'Messages', href: '/customer/messages' },
  { icon: User, label: 'Profile', href: '/customer/profile' },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelShell
      variant="light"
      brandTitle="My Account"
      brandSubtitle="LocalMart"
      brandIcon={User}
      brandHref="/customer"
      items={items}
    >
      {children}
    </PanelShell>
  );
}
