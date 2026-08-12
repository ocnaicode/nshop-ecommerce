export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50"><div className="max-w-3xl mx-auto px-4 py-12 prose">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">Information We Collect</h2>
      <p className="text-gray-600 mb-4">We collect information you provide (name, phone, address) and automatically collected data (location, device info, usage patterns).</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Your Information</h2>
      <p className="text-gray-600 mb-4">To process orders, provide location-based services, improve our platform, send notifications, and prevent fraud.</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">Data Sharing</h2>
      <p className="text-gray-600 mb-4">We share necessary information with sellers (for orders), delivery partners, and payment processors. We never sell your data.</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">Data Security</h2>
      <p className="text-gray-600 mb-4">We use encryption, secure servers, and industry-standard security practices to protect your data.</p>
      <h2 className="text-xl font-semibold mt-6 mb-3">Your Rights</h2>
      <p className="text-gray-600 mb-4">You can access, update, or delete your personal data at any time through your account settings.</p>
    </div></div>
  );
}
