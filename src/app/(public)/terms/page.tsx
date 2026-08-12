export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50"><div className="max-w-3xl mx-auto px-4 py-12 prose">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
      <p className="text-gray-600 mb-4">By accessing and using LocalMart, you accept and agree to be bound by these Terms of Service.</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">2. User Accounts</h2>
      <p className="text-gray-600 mb-4">You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration.</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">3. Orders and Payments</h2>
      <p className="text-gray-600 mb-4">All orders are subject to availability. Prices are in BDT (৳). We reserve the right to refuse or cancel any order.</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">4. Seller Obligations</h2>
      <p className="text-gray-600 mb-4">Sellers must provide accurate product information, fulfill orders promptly, and comply with all applicable laws.</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">5. Returns and Refunds</h2>
      <p className="text-gray-600 mb-4">Return requests must be made within 7 days of delivery. Refunds are processed within 5-7 business days.</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">6. Limitation of Liability</h2>
      <p className="text-gray-600 mb-4">LocalMart is a marketplace platform. We are not liable for product quality issues, which are the responsibility of individual sellers.</p>
    </div></div>
  );
}
