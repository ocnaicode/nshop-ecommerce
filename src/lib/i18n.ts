// =============================================================================
// i18n - Multi-language support (English + Bengali)
// Lightweight dictionary-based translation with interpolation support.
// =============================================================================

export const translations = {
  en: {
    common: {
      home: 'Home', search: 'Search', login: 'Login', register: 'Register', logout: 'Logout',
      cart: 'Cart', orders: 'Orders', profile: 'Profile', settings: 'Settings', save: 'Save',
      cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', submit: 'Submit',
      loading: 'Loading...', noResults: 'No results found', error: 'An error occurred',
      success: 'Success', payments: 'Payments', loyalty: 'Loyalty', referrals: 'Referrals',
      points: 'Points', balance: 'Balance', copy: 'Copy', share: 'Share', language: 'Language',
      darkMode: 'Dark mode', lightMode: 'Light mode', skipToContent: 'Skip to main content',
    },
    home: {
      title: 'All Local Shops in One Place',
      subtitle: 'Discover nearby shops, order products, support local',
      browseShops: 'Browse Shops', shopProducts: 'Shop Products', categories: 'Categories',
      nearbyShops: 'Nearby Shops', popularProducts: 'Popular Products',
    },
    auth: {
      phone: 'Phone Number', password: 'Password', forgotPassword: 'Forgot password?',
      createAccount: 'Create Account', welcomeBack: 'Welcome Back',
    },
    cart: {
      empty: 'Your cart is empty', subtotal: 'Subtotal', total: 'Total',
      checkout: 'Proceed to Checkout', continueShopping: 'Continue Shopping',
    },
    order: {
      placed: 'Order Placed', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready',
      onTheWay: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled',
    },
    payment: {
      title: 'Payment Method', cod: 'Cash on Delivery', codDesc: 'Pay when you receive',
      bkash: 'bKash', bkashDesc: 'Pay with bKash', nagad: 'Nagad', nagadDesc: 'Pay with Nagad',
      sslcommerz: 'Card / Internet Banking', sslcommerzDesc: 'Visa, Mastercard, bKash via SSLCommerz',
      payNow: 'Pay Now', processing: 'Processing...', pending: 'Pending', paid: 'Paid',
      failed: 'Failed', refunded: 'Refunded', cancelled: 'Cancelled',
    },
    loyalty: {
      title: 'Loyalty Program', availablePoints: 'Available Points',
      lifetimeEarned: 'Lifetime Earned', redeemed: 'Points Redeemed',
      history: 'Transaction History', howItWorks: 'How it works',
    },
    referral: {
      title: 'Refer & Earn', yourCode: 'Your Referral Code',
      copyLink: 'Copy Share Link', totalReferrals: 'Total Referrals',
      completed: 'Completed', pending: 'Pending', history: 'Referral History',
    },
    analytics: {
      title: 'Platform Analytics', revenue: 'Total Revenue', orders: 'Total Orders',
      users: 'Active Users', sellers: 'Active Sellers', avgOrderValue: 'Avg Order Value',
      ordersToday: 'Orders Today', revenueToday: 'Revenue Today', newUsers: 'New Users (Month)',
      timeseries: 'Revenue & Orders', topProducts: 'Top Products', categories: 'Orders by Category',
      paymentMethods: 'Payment Methods', days: 'Days', export: 'Export CSV',
    },
  },
  bn: {
    common: {
      home: 'হোম', search: 'অনুসন্ধান', login: 'লগইন', register: 'রেজিস্টার', logout: 'লগআউট',
      cart: 'কার্ট', orders: 'অর্ডার', profile: 'প্রোফাইল', settings: 'সেটিংস', save: 'সংরক্ষণ',
      cancel: 'বাতিল', delete: 'মুছুন', edit: 'সম্পাদনা', add: 'যোগ', submit: 'জমা',
      loading: 'লোড হচ্ছে...', noResults: 'কোন ফলাফল পাওয়া যায়নি', error: 'একটি ত্রুটি ঘটেছে',
      success: 'সফল', payments: 'পেমেন্ট', loyalty: 'লয়ালটি', referrals: 'রেফারেল',
      points: 'পয়েন্ট', balance: 'ব্যালেন্স', copy: 'কপি', share: 'শেয়ার', language: 'ভাষা',
      darkMode: 'ডার্ক মোড', lightMode: 'লাইট মোড', skipToContent: 'প্রধান কন্টেন্টে যান',
    },
    home: {
      title: 'সব স্থানীয় দোকান এক জায়গায়',
      subtitle: 'কাছের দোকান আবিষ্কার করুন, পণ্য অর্ডার করুন',
      browseShops: 'দোকান দেখুন', shopProducts: 'পণ্য কিনুন', categories: 'ক্যাটাগরি',
      nearbyShops: 'কাছের দোকান', popularProducts: 'জনপ্রিয় পণ্য',
    },
    auth: {
      phone: 'ফোন নম্বর', password: 'পাসওয়ার্ড', forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
      createAccount: 'অ্যাকাউন্ট তৈরি করুন', welcomeBack: 'স্বাগতম',
    },
    cart: {
      empty: 'আপনার কার্ট খালি', subtotal: 'সাবটোটাল', total: 'মোট',
      checkout: 'চেকআউট', continueShopping: 'কেনাকাটা চালিয়ে যান',
    },
    order: {
      placed: 'অর্ডার দেওয়া হয়েছে', accepted: 'গৃহীত', preparing: 'প্রস্তুত হচ্ছে', ready: 'প্রস্তুত',
      onTheWay: 'পথে', delivered: 'ডেলিভারি হয়েছে', cancelled: 'বাতিল',
    },
    payment: {
      title: 'পেমেন্ট পদ্ধতি', cod: 'ক্যাশ অন ডেলিভারি', codDesc: 'পণ্য পাওয়ার সময় পেমেন্ট',
      bkash: 'বিকাশ', bkashDesc: 'বিকাশ দিয়ে পেমেন্ট করুন', nagad: 'নগদ', nagadDesc: 'নগদ দিয়ে পেমেন্ট করুন',
      sslcommerz: 'কার্ড / ইন্টারনেট ব্যাংকিং', sslcommerzDesc: 'SSLCommerz এর মাধ্যমে পেমেন্ট',
      payNow: 'এখনই পেমেন্ট করুন', processing: 'প্রসেস হচ্ছে...', pending: 'বাকি',
      paid: 'পরিশোধিত', failed: 'ব্যর্থ', refunded: 'ফেরত', cancelled: 'বাতিল',
    },
    loyalty: {
      title: 'লয়ালটি প্রোগ্রাম', availablePoints: 'পাওয়া পয়েন্ট',
      lifetimeEarned: 'সর্বমোট অর্জিত', redeemed: 'ব্যবহৃত পয়েন্ট',
      history: 'লেনদেন ইতিহাস', howItWorks: 'কিভাবে কাজ করে',
    },
    referral: {
      title: 'রেফার করুন ও উপার্জন করুন', yourCode: 'আপনার রেফারেল কোড',
      copyLink: 'শেয়ার লিংক কপি করুন', totalReferrals: 'মোট রেফারেল',
      completed: 'সম্পন্ন', pending: 'বাকি', history: 'রেফারেল ইতিহাস',
    },
    analytics: {
      title: 'প্ল্যাটফর্ম অ্যানালিটিক্স', revenue: 'মোট আয়', orders: 'মোট অর্ডার',
      users: 'সক্রিয় ব্যবহারকারী', sellers: 'সক্রিয় বিক্রেতা', avgOrderValue: 'গড় অর্ডার মূল্য',
      ordersToday: 'আজকের অর্ডার', revenueToday: 'আজকের আয়', newUsers: 'নতুন ব্যবহারকারী (মাস)',
      timeseries: 'আয় ও অর্ডার', topProducts: 'সেরা পণ্য', categories: 'ক্যাটাগরি অনুযায়ী অর্ডার',
      paymentMethods: 'পেমেন্ট পদ্ধতি', days: 'দিন', export: 'CSV এক্সপোর্ট',
    },
  },
};

export type Language = keyof typeof translations;
export type TranslationKey = string;

/** Translates a dotted key with optional interpolation: t('greeting', 'en', {name}) */
export function t(key: string, lang: Language = 'en', vars?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  for (const k of keys) {
    if (value === undefined || value === null) return key;
    value = value[k];
  }
  if (value === undefined || value === null) return key;
  let result = String(value);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return result;
}

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('lang');
  return stored === 'bn' ? 'bn' : 'en';
}

export function setLanguage(lang: Language) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }
}

/** React hook-friendly helper for components that need reactive language state */
export function getBrowserLanguage(): Language {
  return getLanguage();
}
