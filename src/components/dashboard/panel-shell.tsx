'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import Sidebar, { type SidebarItem } from '@/components/dashboard/sidebar';
import { cn } from '@/lib/utils';

interface PanelShellProps {
  children: React.ReactNode;
  variant: 'light' | 'dark';
  brandTitle: string;
  brandSubtitle?: string;
  brandIcon: LucideIcon;
  brandHref?: string;
  items: SidebarItem[];
  headerClassName?: string;
  /** When true, skip sidebar (public seller pages). */
  skip?: boolean;
}

export default function PanelShell({
  children,
  variant,
  brandTitle,
  brandSubtitle,
  brandIcon,
  brandHref,
  items,
  headerClassName,
  skip,
}: PanelShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);

  if (skip) return <>{children}</>;

  const dark = variant === 'dark';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className={cn('min-h-screen flex', dark ? 'bg-gray-950 text-gray-200' : 'bg-gray-100')}>
      <Sidebar
        variant={variant}
        brandTitle={brandTitle}
        brandSubtitle={brandSubtitle}
        brandIcon={brandIcon}
        brandHref={brandHref}
        items={items}
        open={open}
        onClose={() => setOpen(false)}
        onLogout={handleLogout}
        headerClassName={headerClassName}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={cn(
            'lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center gap-3 border-b',
            dark ? 'bg-gray-900/90 border-white/10' : 'bg-white border-gray-200 shadow-sm'
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn('p-2 rounded-lg', dark ? 'hover:bg-white/5' : 'hover:bg-gray-100')}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className={cn('font-semibold text-sm', dark ? 'text-white' : 'text-gray-900')}>
            {brandTitle}
          </span>
          {user?.name && (
            <span className={cn('ml-auto text-xs truncate', dark ? 'text-gray-400' : 'text-gray-500')}>
              {user.name}
            </span>
          )}
        </header>
        <div className="flex-1 min-w-0" key={pathname}>
          {children}
        </div>
      </div>
    </div>
  );
}
