'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Heart, Bell, LogOut } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import ProfileModal from '@/components/profile/ProfileModal';
import InstallPrompt from '@/components/ui/InstallPrompt';

export default function Navbar() {
  const pathname = usePathname();
  const { 
    profile, 
    loading: profileLoading, 
    incomingInvites,
  } = useProfile();
  const [scrolled, setScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (isAuthPage) return null;

  const navLinks = [
    { label: 'Our Story', href: '/' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Shared Goals', href: '/goals' },
  ];

  return (
    <>
      <nav 
        dir="ltr"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-8 py-3 ${scrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : ''}`}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="font-serif font-black text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#E8677D] to-[#D4576A]">
              Mimix & Mimixa
            </span>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-sm font-semibold transition-colors py-1 ${
                  pathname === link.href 
                    ? 'text-[#E8677D]' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#E8677D] rounded-full" 
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {profile && (
              <>
                <button className="relative p-2 rounded-full text-[#E8677D] hover:bg-pink-50 transition-colors">
                  <Heart size={20} fill="currentColor" strokeWidth={0} />
                </button>
                <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
                  <Bell size={20} />
                  {incomingInvites.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E8677D] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {incomingInvites.length}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Install App Button */}
            <InstallPrompt />

            {/* Avatar */}
            {profile ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileModal(true)}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#E8677D] to-[#B5456A] flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </motion.button>
            ) : !profileLoading && (
              <Link href="/login" className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8677D] text-white text-sm font-semibold hover:bg-[#d6596d] transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal 
            isOpen={showProfileModal} 
            onClose={() => setShowProfileModal(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}
