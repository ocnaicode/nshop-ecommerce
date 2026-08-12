import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const faqs = [
  { q: 'How do I place an order?', a: 'Browse products, add to cart, proceed to checkout, select delivery address and payment method, then confirm your order.' },
  { q: 'What payment methods are available?', a: 'We support Cash on Delivery (COD). bKash and Nagad integration is coming soon.' },
  { q: 'How does delivery work?', a: 'Choose from Seller Delivery, Platform Delivery, or Self Pickup at checkout. Delivery fees vary by distance.' },
  { q: 'Can I return a product?', a: 'Yes, you can request a return within 7 days of delivery. Contact the seller or our support team.' },
  { q: 'How do I become a seller?', a: 'Register as a seller, complete verification, choose a subscription plan, create your shop, and start selling!' },
  { q: 'What are loyalty points?', a: 'Earn points on every purchase. 100৳ spent = 1 point. Redeem points for discounts on future orders.' },
  { q: 'How do I track my order?', a: 'Go to My Account > Orders to see real-time status updates and delivery tracking.' },
  { q: 'Is my data secure?', a: 'Yes, we use encryption, secure cookies, and never share your personal data with third parties.' },
];
export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50"><div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
      <div className="space-y-4">{faqs.map((faq, i) => (
        <Card key={i}><CardHeader><CardTitle className="text-lg">{faq.q}</CardTitle></CardHeader><CardContent><p className="text-gray-600">{faq.a}</p></CardContent></Card>
      ))}</div>
    </div></div>
  );
}
