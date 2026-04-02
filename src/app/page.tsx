'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Users, Sparkles, MessageSquare, Home, Lock, Gamepad2, Plus, Settings, Calendar, Gift, Shield, HelpCircle, Play } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import HeroInstallButton from '@/components/ui/HeroInstallButton';
import SidebarInstallButton from '@/components/ui/SidebarInstallButton';

export default function HomePage() {
  const router = useRouter();
  const { profile, relationship, sendGameInvite, loading } = useProfile() || {};

  const hasPartner = !!relationship?.otherPerson;

  const startChatWithPartner = async () => {
    if (!relationship?.otherPerson?.id) return;
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'private', partner_id: relationship.otherPerson.id })
      });
      if (res.ok) {
        router.push('/chat');
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  /* ─── Sidebar items (desktop) ─── */
  const sidebarNav = [
    { icon: Sparkles, label: 'Moments', href: '#moments', active: true },
    { icon: Calendar, label: 'Schedule', href: '#schedule', active: false },
    { icon: Gift, label: 'Wishlist', href: '#wishlist', active: false },
    { icon: Lock, label: 'Shared Vault', href: '#vault', active: false },
    { icon: Settings, label: 'Settings', href: '#settings', active: false },
  ];

  /* ─── Mobile bottom nav ─── */
  const mobileNav = [
    { icon: Home, label: 'Home', href: '/', active: true },
    { icon: Sparkles, label: 'Moments', href: '#', active: false },
    { icon: MessageSquare, label: 'Chat', href: '/chat', active: false },
    { icon: Lock, label: 'Vault', href: '#', active: false },
  ];

  return (
    <main dir="ltr" className="relative min-h-[100dvh] bg-[#FFF5F7] overflow-hidden">

      {/* ═══ BACKGROUND ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] left-[5%] w-[60vw] max-w-[500px] aspect-square bg-[#FFD6DE]/30 rounded-full blur-[80px] sm:blur-[100px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[50vw] max-w-[400px] aspect-square bg-[#F0D0E0]/25 rounded-full blur-[100px] sm:blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[40vw] max-w-[300px] aspect-square bg-[#FFE4EC]/20 rounded-full blur-[60px] sm:blur-[80px]" />
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="hidden md:block absolute top-[20%] right-[15%] text-[#E8A0B0]/20"
        >
          <Plus size={40} strokeWidth={1} />
        </motion.div>
        <motion.div
          animate={{ y: [-5, 5, -5], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden md:block absolute bottom-[35%] right-[12%] text-[#E8A0B0]/15"
        >
          <Sparkles size={20} strokeWidth={1.5} />
        </motion.div>
      </div>

      {/* ═══ LAYOUT ═══ */}
      <div className="relative z-10 flex min-h-[100dvh]">

        {/* ══════════════════════════════
            DESKTOP SIDEBAR
            ══════════════════════════════ */}
        <aside className="hidden lg:flex flex-col w-[15rem] shrink-0 pt-24 pb-6 px-5 border-r border-[#F0D8DE]/50">

          {/* Sanctuary header */}
          <div className="mb-6 px-1">
            <h2 className="text-[#9A2943] font-bold text-[15px] leading-tight">Our Sanctuary</h2>
            <p className="text-[#C4969E] text-[11px] font-medium mt-0.5">
              {relationship?.created_at
                ? `Since ${new Date(relationship.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
                : 'Your shared space'
              }
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {sidebarNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  item.active
                    ? 'bg-[#E8677D]/10 text-[#E8677D] border border-[#E8677D]/15'
                    : 'text-[#C08894] hover:bg-white/60 hover:text-[#A06070]'
                }`}
              >
                <item.icon size={17} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="mt-auto flex flex-col gap-3">
            {/* New Memory button */}
            <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#E8677D] to-[#F08090] text-white text-sm font-bold shadow-md shadow-[#E8677D]/20 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all group">
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              <span>New Memory</span>
            </button>
            
            <SidebarInstallButton />

            {/* Support & Privacy */}
            <div className="flex flex-col gap-1 mt-2 px-1">
              <Link href="#support" className="flex items-center gap-2 text-[12px] text-[#D4868F] font-medium hover:text-[#C06070] transition-colors py-1">
                <HelpCircle size={14} />
                <span>Support</span>
              </Link>
              <Link href="#privacy" className="flex items-center gap-2 text-[12px] text-[#D4868F] font-medium hover:text-[#C06070] transition-colors py-1">
                <Shield size={14} />
                <span>Privacy</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════
            MAIN CONTENT
            ══════════════════════════════ */}
        <div className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-10 pt-20 sm:pt-24 pb-24 lg:pb-8 overflow-y-auto">
          <div className="w-full max-w-[48rem] mx-auto flex flex-col items-center">

            {/* ─── Hero: Logo + Title ─── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center w-full"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-4 sm:mb-5"
              >
                <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-28 lg:h-28 rounded-[2rem] flex items-center justify-center overflow-hidden">
                  <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-serif font-black text-[#E8677D] text-center leading-[1.05] tracking-tight
                           text-[2rem] sm:text-[2.75rem] lg:text-[3.5rem] mb-1 sm:mb-2"
              >
                Mimix & Mimixa
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-[#E8677D]/70 font-medium text-center mb-5 sm:mb-7
                           text-sm sm:text-base lg:text-lg"
              >
                Your Private Universe
              </motion.p>
              
              {/* Install App CTA (only shows if not installed) */}
              <HeroInstallButton />
            </motion.div>

            {/* ═══ COUPLE CARD ═══ */}
            {hasPartner ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
                className="w-full"
              >
                {/* Profile Card */}
                <div className="relative bg-white/60 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] border border-white/80 shadow-[0_12px_40px_rgba(232,103,125,0.06)] p-5 sm:p-7 lg:p-10 mb-4 sm:mb-6">
                  {/* Glow */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[60%] max-w-[200px] h-[60px] bg-[#FFD6DE]/20 rounded-full blur-[40px] pointer-events-none" />

                  {/* ─── Avatars Row ─── */}
                  <div className="relative flex items-start justify-center gap-8 sm:gap-14 lg:gap-20 mb-5 sm:mb-6">

                    {/* Current User */}
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2 relative z-10 min-w-0">
                      <div className="relative">
                        <div className="w-[4.5rem] h-[4.5rem] sm:w-[6.5rem] sm:h-[6.5rem] lg:w-[8rem] lg:h-[8rem] rounded-full bg-gradient-to-br from-[#F8D0D8] to-[#F0B8C8] p-[2.5px] sm:p-[3px] shadow-lg">
                          <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="You" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F8D0D8] to-[#E8A8B8]">
                                <span className="text-white font-serif font-bold text-lg sm:text-2xl lg:text-3xl">{profile?.display_name?.charAt(0) || '?'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 bg-[#E8677D] rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                        >
                          <Heart size={8} fill="white" strokeWidth={0} />
                        </motion.div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <h4 className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#3D3D3D] truncate max-w-[5rem] sm:max-w-[7rem]">{profile?.display_name || 'You'}</h4>
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full" />
                      </div>
                    </div>

                    {/* Connection Line + Heart */}
                    <div className="absolute top-[2.25rem] sm:top-[3.25rem] lg:top-[4rem] left-1/2 -translate-x-1/2 flex items-center z-[5] w-[7rem] sm:w-[10rem] lg:w-[13rem]">
                      <div className="flex-1 h-[2px] bg-gradient-to-r from-[#E8677D]/30 to-[#E8677D]/50 rounded-full" />
                      {/* Heartbeat icon */}
                      <div className="mx-1 sm:mx-2 flex items-center gap-0">
                        <svg viewBox="0 0 60 20" className="w-10 sm:w-14 lg:w-16 h-4 text-[#E8677D]/40">
                          <path d="M0,10 L12,10 L16,3 L20,17 L24,7 L28,13 L32,10 L60,10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <Heart size={10} className="text-[#E8677D] -ml-1 sm:w-3 sm:h-3" fill="currentColor" strokeWidth={0} />
                      </div>
                      <div className="flex-1 h-[2px] bg-gradient-to-l from-[#9B6FB0]/30 to-[#9B6FB0]/50 rounded-full" />
                    </div>

                    {/* Partner */}
                    <div className="flex flex-col items-center gap-1.5 sm:gap-2 relative z-10 min-w-0">
                      <div className="relative">
                        <div className="w-[4.5rem] h-[4.5rem] sm:w-[6.5rem] sm:h-[6.5rem] lg:w-[8rem] lg:h-[8rem] rounded-full bg-gradient-to-br from-[#D0D0E8] to-[#B8B8D0] p-[2.5px] sm:p-[3px] shadow-lg">
                          <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                            {relationship.otherPerson.avatar_url ? (
                              <img src={relationship.otherPerson.avatar_url} alt="Partner" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D0D0E8] to-[#B0B0D0]">
                                <span className="text-white font-serif font-bold text-lg sm:text-2xl lg:text-3xl">{(relationship.otherPerson.display_name || 'P').charAt(0)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ repeat: Infinity, duration: 2.5, delay: 0.3 }}
                          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 bg-[#8B6FB0] rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                        >
                          <Heart size={8} fill="white" strokeWidth={0} />
                        </motion.div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <h4 className="text-xs sm:text-sm lg:text-[15px] font-bold text-[#3D3D3D] truncate max-w-[5rem] sm:max-w-[7rem]">{relationship.otherPerson.display_name || relationship.otherPerson.username}</h4>
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons (inside card for desktop) */}
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <button
                      onClick={() => sendGameInvite?.(relationship.otherPerson.id)}
                      className="px-6 sm:px-8 lg:px-10 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#E8677D] to-[#F08090] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#E8677D]/20 hover:shadow-xl hover:shadow-[#E8677D]/30 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2.5 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <Play size={16} fill="currentColor" strokeWidth={0} />
                      <span className="relative z-10">Play Together</span>
                    </button>

                    <button
                      onClick={startChatWithPartner}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#9B6FB0]/15 text-[#9B6FB0] flex items-center justify-center hover:bg-[#9B6FB0]/25 hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
                      aria-label="Whisper"
                    >
                      <MessageSquare size={18} fill="currentColor" strokeWidth={0} />
                    </button>
                  </div>
                </div>

                {/* ═══ BOTTOM INFO CARDS (Desktop only) ═══ */}
                <div className="hidden lg:grid grid-cols-2 gap-5 w-full">
                  {/* Ongoing Magic */}
                  <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] border border-white/80 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E8677D]">Ongoing Magic</span>
                    <h3 className="text-[15px] font-bold text-[#2D2D2D] mt-1.5 mb-1">Morning Gratitude</h3>
                    <p className="text-[12px] text-[#A0A0A0] font-medium leading-relaxed">
                      {profile?.display_name || 'You'} added a new note to the vault. &quot;Thank you for the coffee this morning.&quot;
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#E8677D] flex items-center justify-center text-white text-[8px] font-bold border-2 border-white shadow-sm">
                          <Lock size={10} />
                        </div>
                        <div className="w-6 h-6 rounded-full bg-[#9B6FB0] flex items-center justify-center text-white text-[8px] font-bold border-2 border-white shadow-sm">
                          <Sparkles size={10} />
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#8B7090]">2 New Shared Memories</span>
                    </div>
                  </div>

                  {/* Date Night */}
                  <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] border border-white/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center">
                    <Calendar size={28} className="text-[#E8677D]/60 mb-2" />
                    <h3 className="text-[15px] font-bold text-[#2D2D2D]">Date Night</h3>
                    <p className="text-[12px] text-[#A0A0A0] font-medium mt-0.5">In 2 days, 4 hours</p>
                    <button className="mt-3 text-[12px] font-bold text-[#E8677D] flex items-center gap-1 hover:gap-2 transition-all">
                      View Plan <span>→</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ═══ NO PARTNER ═══ */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-md"
              >
                <div className="bg-white/60 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/80 shadow-[0_12px_40px_rgba(232,103,125,0.07)] p-5 sm:p-7 md:p-8 space-y-4 sm:space-y-5">
                  <Link href="/create-room" className="block">
                    <button className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-[#E8677D] to-[#F08090] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#E8677D]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 min-h-[3rem]">
                      <Heart size={18} fill="currentColor" />
                      <span>Start Romantic Game</span>
                    </button>
                  </Link>

                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-gray-200" />
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Or</span>
                    <div className="flex-grow border-t border-gray-200" />
                  </div>

                  <Link href="/join-room" className="block">
                    <button className="w-full py-3.5 sm:py-4 rounded-2xl bg-white border-2 border-[#E8677D]/20 text-[#E8677D] font-bold text-sm tracking-wide hover:bg-[#E8677D]/5 hover:border-[#E8677D]/30 transition-all flex items-center justify-center gap-3 min-h-[3rem]">
                      <Users size={18} />
                      <span>Join with Code</span>
                    </button>
                  </Link>

                  {!profile && !loading && (
                    <div className="text-center pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-400 font-medium mb-2">
                        Connect with your partner for the full experience
                      </p>
                      <Link href="/login" className="inline-flex items-center gap-1.5 text-[#E8677D] font-bold text-sm hover:underline">
                        <Sparkles size={14} />
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div dir="ltr" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-lg border-t border-gray-100/80 px-2 py-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobileNav.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-colors min-w-[3rem] ${
                item.active ? 'text-[#E8677D]' : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
