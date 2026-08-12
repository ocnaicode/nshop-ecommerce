export const translations = {
  en: {
    common: { home: 'Home', search: 'Search', login: 'Login', register: 'Register', logout: 'Logout', cart: 'Cart', orders: 'Orders', profile: 'Profile', settings: 'Settings', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', submit: 'Submit', loading: 'Loading...', noResults: 'No results found', error: 'An error occurred', success: 'Success' },
    home: { title: 'All Local Shops in One Place', subtitle: 'Discover nearby shops, order products, support local', browseShops: 'Browse Shops', shopProducts: 'Shop Products', categories: 'Categories', nearbyShops: 'Nearby Shops', popularProducts: 'Popular Products' },
    auth: { phone: 'Phone Number', password: 'Password', forgotPassword: 'Forgot password?', createAccount: 'Create Account', welcomeBack: 'Welcome Back' },
    cart: { empty: 'Your cart is empty', subtotal: 'Subtotal', total: 'Total', checkout: 'Proceed to Checkout', continueShopping: 'Continue Shopping' },
    order: { placed: 'Order Placed', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', onTheWay: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled' },
  },
  bn: {
    common: { home: 'হোম', search: 'অনুসন্ধান', login: 'লগইন', register: 'রেজিস্টার', logout: 'লগআউট', cart: 'কার্ট', orders: 'অর্ডার', profile: 'প্রোফাইল', settings: 'সেটিংস', save: 'সংরক্ষণ', cancel: 'বাতিল', delete: 'মুছুন', edit: 'সম্পাদনা', add: 'যোগ', submit: 'জমা', loading: 'লোড হচ্ছে...', noResults: 'কোন ফলাফল পাওয়া যায়নি', error: 'একটি ত্রুটি ঘটেছে', success: 'সফল' },
    home: { title: 'সব স্থানীয় দোকান এক জায়গায়', subtitle: 'কাছের দোকান আবিষ্কার করুন, পণ্য অর্ডার করুন', browseShops: 'দোকান দেখুন', shopProducts: 'পণ্য কিনুন', categories: 'ক্যাটাগরি', nearbyShops: 'কাছের দোকান', popularProducts: 'জনপ্রিয় পণ্য' },
    auth: { phone: 'ফোন নম্বর', password: 'পাসওয়ার্ড', forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?', createAccount: 'অ্যাকাউন্ট তৈরি করুন', welcomeBack: 'স্বাগতম' },
    cart: { empty: 'আপনার কার্ট খালি', subtotal: 'সাবটোটাল', total: 'মোট', checkout: 'চেকআউট', continueShopping: 'কেনাকাটা চালিয়ে যান' },
    order: { placed: 'অর্ডার দেওয়া হয়েছে', accepted: 'গৃহীত', preparing: 'প্রস্তুত হচ্ছে', ready: 'প্রস্তুত', onTheWay: 'পথে', delivered: 'ডেলিভারি হয়েছে', cancelled: 'বাতিল' },
  },
};

export type Language = keyof typeof translations;
export function t(key: string, lang: Language = 'en'): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  for (const k of keys) { value = value?.[k]; }
  return value || key;
}
export function getLanguage(): Language { return (typeof window !== 'undefined' && localStorage.getItem('lang') as Language) || 'en'; }
export function setLanguage(lang: Language) { if (typeof window !== 'undefined') localStorage.setItem('lang', lang); }
