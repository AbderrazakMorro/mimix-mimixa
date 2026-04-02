import React from 'react';
import { Shield, Lock, Eye, Database, Server, RefreshCcw } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Mimix & Mimixa',
  description: 'Learn how Mimix & Mimixa protects your privacy and secures your personal data.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-transparent pt-24 pb-12 px-4 sm:px-6 lg:px-8" dir="ltr">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-[#E8677D]/20 mb-6 shadow-sm">
            <Shield className="w-10 h-10 text-[#E8677D]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-playfair mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
            Your privacy is our top priority. We believe in complete transparency about how we collect, use, and protect your data while you enjoy Mimix & Mimixa.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl border border-[#E8677D]/10 font-inter text-gray-700 leading-relaxed space-y-12">
          
          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#E8677D]/10 rounded-lg">
                <Database className="w-6 h-6 text-[#E8677D]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
            </div>
            <p>
              When you use Mimix & Mimixa, we collect minimal information required to provide our seamless multiplayer experience:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 marker:text-[#E8677D]">
              <li><strong>Profile Information:</strong> Your chosen display name, avatar preferences, and connection status.</li>
              <li><strong>Gameplay Data:</strong> Your answers to questions during active game sessions, which are temporarily stored and synchronized.</li>
              <li><strong>Technical Data:</strong> Essential device information necessary for creating WebSocket connections and ensuring real-time syncing.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#E8677D]/10 rounded-lg">
                <Lock className="w-6 h-6 text-[#E8677D]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">2. End-To-End Encryption (E2EE)</h2>
            </div>
            <p>
              Your private chat messages and intimate game answers are strictly protected:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 marker:text-[#E8677D]">
              <li>All chat communications are encrypted using advanced cryptographic protocols between your device and your partner's device.</li>
              <li>We perform <strong>no permanent logging</strong> of your chat history on our central servers.</li>
              <li>Once you finish your game session, synchronized temporary gameplay data is securely purged.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#E8677D]/10 rounded-lg">
                <Eye className="w-6 h-6 text-[#E8677D]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">3. How We Use Your Data</h2>
            </div>
            <p>
              Mimix & Mimixa strictly uses your data only for functional application purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 marker:text-[#E8677D]">
              <li>To pair you with your partner via secure invitation links.</li>
              <li>To facilitate seamless, real-time game interactions and chat.</li>
              <li>To display connection statuses and online presence locally to your trusted partner.</li>
            </ul>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mt-4">
              <p className="text-sm font-medium text-rose-800">
                <strong>Important:</strong> We do NOT sell, rent, or share your personal data, chat history, or game responses with any third parties or advertisers.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#E8677D]/10 rounded-lg">
                <Server className="w-6 h-6 text-[#E8677D]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">4. Third-Party Services</h2>
            </div>
            <p>
              We utilize select third-party services exclusively for necessary infrastructure:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600 marker:text-[#E8677D]">
              <li><strong>Pusher:</strong> Used strictly for facilitating real-time WebSocket connections. Messages transmitted via Pusher are encrypted.</li>
              <li><strong>Vercel / Next.js:</strong> Serves the core application infrastructure in a secure, edge-optimized environment.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#E8677D]/10 rounded-lg">
                <RefreshCcw className="w-6 h-6 text-[#E8677D]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">5. Updates & Contact</h2>
            </div>
            <p>
              We may update this privacy policy periodically to reflect new features or enhanced security protocols. Continuing to use Mimix & Mimixa signifies your trust and agreement with these terms.
            </p>
            <p className="mt-4">
              If you have any questions, concerns, or requests to permanently delete any lingering account traces, please contact the developer via the official repository.
            </p>
          </section>

          <hr className="border-gray-200" />
          
          <div className="text-center text-sm text-gray-500">
            Last updated: April 2026 • Mimix & Mimixa App
          </div>
        </div>
      </div>
    </div>
  );
}
