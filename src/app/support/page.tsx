import React from 'react';
import { HelpCircle, MessageCircle, Mail, Globe, LifeBuoy, ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Support | Mimix & Mimixa',
  description: 'How can we help? Contact Mimix & Mimixa support for assistance with your account or gameplay.',
};

export default function SupportPage() {
  const supportOptions = [
    {
      title: 'Common Questions',
      description: 'Find answers about account setup, partner pairing, and game rules.',
      icon: HelpCircle,
      action: 'Browse FAQ',
      href: '#faq',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Technical Issues',
      description: 'Report bugs, connection drops, or encryption issues.',
      icon: LifeBuoy,
      action: 'Report Bug',
      href: 'https://github.com/AbderrazakMorro/mimix-mimixa/issues',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Community Discord',
      description: 'Join our community to share feedback and connect with other users.',
      icon: MessageCircle,
      action: 'Join Chat',
      href: '#',
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Email Us',
      description: 'For privacy inquiries or direct assistance, reach out via email.',
      icon: Mail,
      action: 'Send Email',
      href: 'mailto:support@mimixa.app',
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-12 px-4 sm:px-6 lg:px-8" dir="ltr">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[#E8677D] font-bold text-sm mb-8 hover:translate-x-[-4px] transition-transform">
          <ArrowLeft size={16} />
          <span>Back Home</span>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 font-playfair mb-4">
            How can we help?
          </h1>
          <p className="text-lg text-gray-600 font-inter max-w-2xl mx-auto">
            Our team is here to ensure your private universe remains magical. Select an option below to get assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {supportOptions.map((opt) => (
            <a
              key={opt.title}
              href={opt.href}
              target={opt.href.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-[#E8677D]/10 hover:shadow-md hover:scale-[1.02] transition-all flex flex-col items-start text-left group"
            >
              <div className={`p-3 rounded-2xl mb-4 ${opt.color}`}>
                <opt.icon size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{opt.title}</h2>
              <p className="text-gray-600 text-sm mb-6 flex-grow">{opt.description}</p>
              <span className="text-xs font-black uppercase tracking-widest text-[#E8677D] group-hover:underline">
                {opt.action} &rarr;
              </span>
            </a>
          ))}
        </div>

        <div className="bg-gradient-to-br from-[#E8677D] to-[#F08090] rounded-[2.5rem] p-8 md:p-12 text-center text-white shadow-xl shadow-[#E8677D]/20">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Developed with Love</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Mimix & Mimixa is an open-source project dedicated to bringing couples closer together through secure, private interactions.
          </p>
          <a 
            href="https://github.com/AbderrazakMorro/mimix-mimixa" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#E8677D] font-bold rounded-full hover:shadow-2xl hover:scale-105 transition-all"
          >
            <Globe size={18} />
            Visit Project on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
