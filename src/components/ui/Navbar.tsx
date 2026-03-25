'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, User, Home, Sparkles } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }
    }
    fetchUser();
    
    // Listen for custom "userUpdated" events (useful for profile-setup page)
    const handleUserUpdate = () => fetchUser();
    window.addEventListener('userUpdated', handleUserUpdate);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Hide Navbar on auth pages for a cleaner look if preferred, but user said "allways"
  // I'll keep it always but maybe make it more minimal if on auth pages.
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
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

          {/* Profile button */}
          <Link href={user ? "/profile-setup" : "/login"}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 p-1 sm:p-1.5 pr-3 sm:pr-4 rounded-full transition-all border-2 ${
                pathname === '/profile-setup' 
                  ? 'border-romantic-pink bg-pink-50/50' 
                  : 'border-white/50 bg-white/30 hover:bg-white/60'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0 ${user?.avatar_url ? '' : 'bg-gradient-to-br from-romantic-pink to-romantic-lavender'}`}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-tighter leading-none ${pathname === '/profile-setup' ? 'text-romantic-pink' : 'text-gray-600'}`}>
                  {user ? 'My Profile' : 'Sign In'}
                </span>
                {user?.username && (
                  <span className="text-[10px] text-gray-600 font-bold truncate max-w-[60px] leading-tight">
                    {user.username}
                  </span>
                )}
              </div>
            </motion.div>
          </Link>

          {!user && !isAuthPage && (
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
  );
}
