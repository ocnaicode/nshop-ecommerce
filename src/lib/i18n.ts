// =============================================================================
// Multi-language support (English / বাংলা)
// =============================================================================
// Server-safe translations + helpers. Client components should use the
// `useLanguage()` hook from `@/lib/use-language`.

export const translations = {
  en: {
    common: {
      home: 'Home', search: 'Search', login: 'Login', register: 'Register', logout: 'Logout',
      cart: 'Cart', orders: 'Orders', profile: 'Profile', settings: 'Settings',
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', submit: 'Submit',
      loading: 'Loading...', noResults: 'No results found', error: 'An error occurred', success: 'Success',
      language: 'Language', browse: 'Browse', viewAll: 'View All', free: 'Free', back: 'Back',
    },
    nav: {
      shops: 'Shops', products: 'Products', categories: 'Categories', offers: 'Offers',
      myOrders: 'My Orders', wishlist: 'Wishlist', dashboard: 'Dashboard',
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
    checkout: {
      title: 'Checkout', deliveryAddress: 'Delivery Address', deliveryMethod: 'Delivery Method',
      paymentMethod: 'Payment Method', orderNotes: 'Order Notes (Optional)', orderSummary: 'Order Summary',
      deliveryFee: 'Delivery Fee', codFee: 'COD Fee', placeOrder: 'Place Order', placingOrder: 'Placing Order...',
      useLoyaltyPoints: 'Use loyalty points', loyaltyBalance: 'Available points',
      paidByPoints: 'Loyalty discount',
    },
    order: {
      placed: 'Order Placed', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready',
      onTheWay: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled',
    },
    footer: {
      tagline: 'All local shops in one place — discover, order, and support your community.',
      forCustomers: 'For Customers', forSellers: 'For Sellers', company: 'Company',
      followUs: 'Follow Us', rightsReserved: 'All rights reserved.',
    },
  },
  bn: {
    common: {
      home: 'হোম', search: 'অনুসন্ধান', login: 'লগইন', register: 'রেজিস্টার', logout: 'লগআউট',
      cart: 'কার্ট', orders: 'অর্ডার', profile: 'প্রোফাইল', settings: 'সেটিংস',
      save: 'সংরক্ষণ', cancel: 'বাতিল', delete: 'মুছুন', edit: 'সম্পাদনা', add: 'যোগ', submit: 'জমা',
      loading: 'লোড হচ্ছে...', noResults: 'কোন ফলাফল পাওয়া যায়নি', error: 'একটি ত্রুটি ঘটেছে', success: 'সফল',
      language: 'ভাষা', browse: 'ব্রাউজ করুন', viewAll: 'সব দেখুন', free: 'ফ্রি', back: 'ফিরে যান',
    },
    nav: {
      shops: 'দোকান', products: 'পণ্য', categories: 'ক্যাটাগরি', offers: 'অফার',
      myOrders: 'আমার অর্ডার', wishlist: 'উইশলিস্ট', dashboard: 'ড্যাশবোর্ড',
    },
    home: {
      title: 'সব স্থানীয় দোকান এক জায়গায়',
      subtitle: 'কাছের দোকান আবিষ্কার করুন, পণ্য অর্ডার করুন, স্থানীয়দের সমর্থন করুন',
      browseShops: 'দোকান দেখুন', shopProducts: 'পণ্য কিনুন', categories: 'ক্যাটাগরি',
      nearbyShops: 'কাছের দোকান', popularProducts: 'জনপ্রিয় পণ্য',
    },
    auth: {
      phone: 'ফোন নম্বর', password: 'পাসওয়ার্ড', forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
      createAccount: 'অ্যাকাউন্ট তৈরি করুন', welcomeBack: 'স্বাগতম',
    },
    cart: {
      empty: 'আপনার কার্ট খালি', subtotal: 'সাবটোটাল', total: 'মোট',
      checkout: 'চেকআউটে যান', continueShopping: 'কেনাকাটা চালিয়ে যান',
    },
    checkout: {
      title: 'চেকআউট', deliveryAddress: 'ডেলিভারি ঠিকানা', deliveryMethod: 'ডেলিভারি পদ্ধতি',
      paymentMethod: 'পেমেন্ট পদ্ধতি', orderNotes: 'অর্ডার নোট (ঐচ্ছিক)', orderSummary: 'অর্ডার সারাংশ',
      deliveryFee: 'ডেলিভারি ফি', codFee: 'ক্যাশ অন ডেলিভারি ফি', placeOrder: 'অর্ডার করুন',
      placingOrder: 'অর্ডার হচ্ছে...', useLoyaltyPoints: 'লয়্যালটি পয়েন্ট ব্যবহার করুন',
      loyaltyBalance: 'উপলব্ধ পয়েন্ট', paidByPoints: 'লয়্যালটি ছাড়',
    },
    order: {
      placed: 'অর্ডার দেওয়া হয়েছে', accepted: 'গৃহীত', preparing: 'প্রস্তুত হচ্ছে', ready: 'প্রস্তুত',
      onTheWay: 'পথে', delivered: 'ডেলিভারি হয়েছে', cancelled: 'বাতিল',
    },
    footer: {
      tagline: 'সব স্থানীয় দোকান এক জায়গায় — আবিষ্কার করুন, অর্ডার করুন, আপনার সম্প্রদায়কে সমর্থন করুন।',
      forCustomers: 'ক্রেতাদের জন্য', forSellers: 'বিক্রেতাদের জন্য', company: 'কোম্পানি',
      followUs: 'আমাদের অনুসরণ করুন', rightsReserved: 'সর্বস্বত্ব সংরক্ষিত।',
    },
  },
} as const;

export type Language = keyof typeof translations;

export function translate(key: string, lang: Language = 'en'): string {
  const keys = key.split('.');
  // Nested translation lookup — the dictionary shape is intentionally loose here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return typeof value === 'string' ? value : key;
}

export const t = translate;

export const LANGUAGE_COOKIE = 'lang';
export const SUPPORTED_LANGUAGES: Language[] = ['en', 'bn'];

export function normalizeLanguage(value: string | null | undefined): Language {
  return value === 'bn' ? 'bn' : 'en';
}
