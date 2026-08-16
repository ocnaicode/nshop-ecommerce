'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Store, Search, ShoppingCart, User, Menu, X, MapPin, ChevronDown, LogOut, Package, Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LanguageSwitcher from '@/components/layout/language-switcher';
import { useLanguage } from '@/lib/use-language';

const NAV_LINKS = [
  { key: 'nav.shops', href: '/shops' },
  { key: 'nav.products', href: '/products' },
  { key: 'nav.categories', href: '/categories' },
  { key: 'nav.offers', href: '/offers' },
];

function dashboardHref(role?: string) {
  if (role === 'seller') return '/seller';
  if (role === 'admin' || role === 'super_admin') return '/admin';
  return '/customer';
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    setMobileOpen(false);
  }

  async function handleLogout() {
    await logout();
    setUserMenuOpen(false);
    router.push('/');
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-sm" data-aos="fade-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">LocalMart</span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder={`${t('common.search')}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-24 h-11 rounded-full bg-muted/50 focus:bg-white"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {t('common.search')}
              </button>
            </div>
          </form>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(link.href) ? 'text-primary bg-primary/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <Link href="/" className="hidden lg:flex items-center gap-1.5 px-2 py-2 text-sm text-gray-600 hover:text-primary">
              <MapPin className="w-4 h-4" />
              <span className="max-w-[120px] truncate">{t('common.browse')}</span>
            </Link>

            <LanguageSwitcher />

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </Link>

            {loading ? (
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 text-white flex items-center justify-center text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-xl z-20 py-1.5 overflow-hidden">
                      <div className="px-4 py-2.5 border-b">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                      </div>
                      <Link
                        href={dashboardHref(user.role)}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" /> {t('nav.dashboard')}
                      </Link>
                      <Link
                        href="/customer/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Package className="w-4 h-4" /> {t('nav.myOrders')}
                      </Link>
                      <Link
                        href="/customer/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Heart className="w-4 h-4" /> {t('nav.wishlist')}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> {t('common.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login">
                <Button size="sm" className="rounded-full px-5">{t('common.login')}</Button>
              </Link>
            )}

            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-white px-4 py-4 space-y-3">
          <form onSubmit={submitSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={`${t('common.search')}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </form>
          <nav className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2.5 rounded-lg text-sm font-medium',
                  isActive(link.href) ? 'text-primary bg-primary/10' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
