'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarProps {
  variant: 'light' | 'dark';
  brandTitle: string;
  brandSubtitle?: string;
  brandIcon: LucideIcon;
  brandHref?: string;
  items: SidebarItem[];
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  /** Optional custom header gradient (e.g. dark theme). */
  headerClassName?: string;
}

export default function Sidebar({
  variant,
  brandTitle,
  brandSubtitle,
  brandIcon: BrandIcon,
  brandHref = '/',
  items,
  open,
  onClose,
  onLogout,
  headerClassName,
}: SidebarProps) {
  const dark = variant === 'dark';
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/admin' || href === '/seller' || href === '/customer') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col shadow-xl transform transition-transform lg:translate-x-0 lg:static',
          open ? 'translate-x-0' : '-translate-x-full',
          dark ? 'bg-gray-950 text-gray-300' : 'bg-white text-gray-700'
        )}
      >
        {/* Gradient header */}
        <div
          className={cn(
            'p-5 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white',
            headerClassName
          )}
        >
          <div className="flex items-center justify-between">
            <Link href={brandHref} className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <BrandIcon className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight">
                <p className="font-bold">{brandTitle}</p>
                {brandSubtitle && <p className="text-[11px] text-white/70">{brandSubtitle}</p>}
              </div>
            </Link>
            <button onClick={onClose} className="lg:hidden text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-green-600 text-white shadow-sm'
                  : dark
                    ? 'text-gray-400 hover:bg-white/5 hover:text-white'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className={cn('p-3 border-t', dark ? 'border-white/10' : 'border-gray-100')}>
          <button
            onClick={onLogout}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors',
              dark
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-red-600 hover:bg-red-50'
            )}
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
