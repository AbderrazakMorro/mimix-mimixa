'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, User, Home, Sparkles, LogOut, Gamepad2, X, Check, MessageSquare } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import ProfileModal from '@/components/profile/ProfileModal';

export default function Navbar() {
  const pathname = usePathname();
  const { 
    profile, 
    loading: profileLoading, 
    incomingInvites,
    pendingGameInvite,
    acceptGameInvite,
    declineGameInvite
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

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-2 sm:px-4 md:px-6 py-3 sm:py-4 ${scrolled ? 'mt-0' : 'mt-1 sm:mt-2'}`}>
        <div className={`max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-lg border-white' : 'glass-strong border-white/40'}`}>
          {/* Brand */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-pink-100 overflow-hidden shrink-0"
            >
              <img src="/assets/logo.png" alt="Mimix Logo" className="w-full h-full object-contain p-1" />
            </motion.div>
            <span className="font-serif font-black text-base sm:text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-romantic-pink to-romantic-lavender hidden xs:block">
              Mimix & Mimixa
            </span>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 sm:p-2.5 rounded-full transition-colors flex items-center gap-2 ${pathname === '/' ? 'bg-pink-100 text-romantic-pink' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <Home size={20} className="sm:w-[22px] sm:h-[22px]" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider hidden lg:block">Home</span>
              </motion.div>
            </Link>

            <Link href="/chat">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 sm:p-2.5 rounded-full transition-colors flex items-center gap-2 ${pathname === '/chat' ? 'bg-pink-100 text-romantic-pink' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <MessageSquare size={20} className="sm:w-[22px] sm:h-[22px]" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider hidden lg:block">Chat</span>
              </motion.div>
            </Link>

            {/* Profile button */}
            {profile ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfileModal(true)}
                className={`flex items-center gap-1.5 p-1 sm:p-1.5 pr-3 sm:pr-4 rounded-full transition-all border-2 border-white/50 bg-white/30 hover:bg-white/60`}
              >
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0 ${profile.avatar_url ? 'bg-white' : 'bg-gradient-to-br from-romantic-pink to-romantic-rose'}`}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-white" />
                  )}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-[10px] font-black uppercase tracking-tighter leading-none text-gray-600">
                    My Profile
                  </span>
                  <span className="text-[10px] text-romantic-pink font-bold truncate max-w-[80px] leading-tight">
                    {profile.display_name || profile.username}
                  </span>
                </div>
                
                {/* Notification Badge */}
                {incomingInvites.length > 0 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-romantic-pink text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-pink-100 animate-pulse"
                  >
                    {incomingInvites.length}
                  </motion.div>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                title="Logout"
                className="p-2 sm:p-2.5 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all border-2 border-transparent hover:border-red-100 shrink-0"
              >
                <LogOut size={20} />
              </motion.button>
            </>
          ) : !profileLoading && (
              <Link href="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 p-1 sm:p-1.5 pr-3 sm:pr-4 rounded-full transition-all border-2 border-white/50 bg-white/30 hover:bg-white/60"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0 bg-gray-200">
                    <User size={16} className="text-gray-400" />
                  </div>
                  <div className="hidden md:flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-tighter leading-none text-gray-600">
                      Sign In
                    </span>
                  </div>
                </motion.div>
              </Link>
            )}

            {!profile && !profileLoading && !isAuthPage && (
              <Link href="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-romantic-pink to-romantic-rose text-white text-xs font-bold shadow-md glow-pink"
                >
                  <Sparkles size={14} />
                  Join Us
                </motion.div>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {pendingGameInvite && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%', scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm"
          >
            <div className="bg-white/95 backdrop-blur-md border-2 border-romantic-pink/20 rounded-3xl p-4 shadow-2xl flex items-center gap-4 relative overflow-hidden group">
              {/* Decorative background pulse */}
              <div className="absolute inset-0 bg-gradient-to-r from-romantic-pink/5 to-romantic-lavender/5 animate-pulse" />
              
              <div className="relative z-10 w-12 h-12 rounded-2xl bg-romantic-pink/10 flex items-center justify-center shrink-0">
                {pendingGameInvite.sender?.avatar_url ? (
                  <img src={pendingGameInvite.sender.avatar_url} alt="" className="w-full h-full object-cover rounded-2xl shadow-sm" />
                ) : (
                  <Gamepad2 className="text-romantic-pink" size={24} />
                )}
                <div className="absolute -bottom-1 -right-1 bg-romantic-pink text-white p-1 rounded-full shadow-lg border-2 border-white">
                  <Sparkles size={10} />
                </div>
              </div>

              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-romantic-pink mb-0.5">Game Challenge!</p>
                <h5 className="text-sm font-bold text-gray-800 truncate">
                  {pendingGameInvite.sender?.display_name || 'Your partner'} wants to play
                </h5>
              </div>

              <div className="relative z-10 flex gap-2">
                <button
                  onClick={() => declineGameInvite(pendingGameInvite.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
                <button
                  onClick={() => acceptGameInvite(pendingGameInvite.id)}
                  className="p-2 bg-romantic-pink text-white rounded-xl shadow-md hover:scale-105 transition-all flex items-center justify-center overflow-hidden"
                >
                  <Check size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
