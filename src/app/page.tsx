'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import { Heart, Users, Sparkles, MessageSquare, Gamepad2, ArrowRight, Crown, Flame } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';

export default function Home() {
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
        const { conversation } = await res.json();
        router.push(`/chat?id=${conversation.id}`);
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden bg-background">
      <AnimatedBackground motif="hearts" intensity="medium" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg mx-auto"
      >
        {/* Logo & Brand */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-28 h-28 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-white/60 overflow-hidden ring-4 ring-romantic-pink/10"
          >
            <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain p-3" />
          </motion.div>

          <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-romantic-pink via-romantic-rose to-romantic-lavender mb-3 drop-shadow-sm leading-tight tracking-tight">
            Mimix & Mimixa
          </h1>
          <p className="text-gray-600 font-semibold text-base sm:text-lg px-6 leading-relaxed">
            Discover a deeper connection with the one you love.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div variants={itemVariants}>
          <GlassCard strong className="w-full p-6 sm:p-8 backdrop-blur-2xl">

            {/* Partner Mode: Show partner actions directly */}
            {hasPartner ? (
              <div className="space-y-5">
                {/* Couple Profile Card */}
                <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-romantic-pink/5 via-white to-romantic-lavender/5 border border-pink-100/60 p-5 sm:p-6">
                  {/* Decorative blurs */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-romantic-pink/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-romantic-lavender/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10">
                    {/* Both Avatars Side by Side */}
                    <div className="flex items-center justify-center gap-3 sm:gap-5 mb-5">
                      {/* Current User */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden ring-4 ring-romantic-lavender/10">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="You" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-romantic-lavender to-romantic-pink">
                              <span className="text-white font-serif font-bold text-xl">{profile?.display_name?.charAt(0) || '?'}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 truncate max-w-[100px]">{profile?.display_name || 'You'}</h4>
                        <p className="text-[10px] font-bold text-romantic-lavender">@{profile?.username || '...'}</p>
                      </div>

                      {/* Heart Connector */}
                      <div className="flex flex-col items-center gap-1 -mt-6">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                        >
                          <Heart size={28} className="text-romantic-pink drop-shadow-sm" fill="currentColor" />
                        </motion.div>
                        <div className="w-px h-6 bg-gradient-to-b from-romantic-pink/40 to-transparent" />
                      </div>

                      {/* Partner */}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="relative">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden ring-4 ring-romantic-pink/10">
                            {relationship.otherPerson.avatar_url ? (
                              <img src={relationship.otherPerson.avatar_url} alt="Partner" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-romantic-pink to-romantic-rose">
                                <span className="text-white font-serif font-bold text-xl">{(relationship.otherPerson.display_name || 'P').charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-[3px] border-white shadow-sm" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 truncate max-w-[100px]">{relationship.otherPerson.display_name || relationship.otherPerson.username}</h4>
                        <p className="text-[10px] font-bold text-romantic-pink">@{relationship.otherPerson.username}</p>
                      </div>
                    </div>

                    {/* Partner Bio */}
                    {relationship.otherPerson.bio && (
                      <p className="text-sm text-gray-500 italic leading-relaxed text-center max-w-xs mx-auto mb-3 px-2">
                        "{relationship.otherPerson.bio}"
                      </p>
                    )}

                    {/* Connected Since */}
                    <div className="flex justify-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-pink-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <Heart size={10} className="text-romantic-pink" fill="currentColor" />
                        Connected since {new Date(relationship.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Action: Play Game */}
                <button
                  onClick={() => sendGameInvite?.(relationship.otherPerson.id)}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-romantic-pink to-romantic-rose text-white font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Gamepad2 size={22} className="group-hover:rotate-12 transition-transform relative z-10" />
                  <span className="relative z-10">Play Together</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform relative z-10" />
                </button>

                {/* Secondary Action: Whisper */}
                <button
                  onClick={startChatWithPartner}
                  className="w-full py-4 rounded-2xl bg-white border-2 border-romantic-lavender/20 text-romantic-lavender font-black text-sm uppercase tracking-wider hover:bg-romantic-lavender/5 hover:border-romantic-lavender/30 transition-all flex items-center justify-center gap-3 group shadow-sm"
                >
                  <MessageSquare size={20} className="group-hover:scale-110 transition-transform" fill="currentColor" />
                  <span>Whisper to {relationship.otherPerson.display_name?.split(' ')[0]}</span>
                </button>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link href="/create-room" className="block">
                    <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-romantic-pink/20 hover:bg-pink-50/50 transition-all text-center group cursor-pointer">
                      <Crown size={20} className="mx-auto mb-2 text-romantic-pink/60 group-hover:text-romantic-pink transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-700">New Room</span>
                    </div>
                  </Link>
                  <Link href="/join-room" className="block">
                    <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-romantic-lavender/20 hover:bg-purple-50/50 transition-all text-center group cursor-pointer">
                      <Users size={20} className="mx-auto mb-2 text-romantic-lavender/60 group-hover:text-romantic-lavender transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-700">Join Code</span>
                    </div>
                  </Link>
                </div>
              </div>
            ) : (
              /* No Partner Mode: Show room create/join */
              <div className="space-y-4 sm:space-y-5">
                <Link href="/create-room" className="block outline-none">
                  <RomanticButton variant="primary" fullWidth className="py-5 text-base sm:text-lg">
                    <Heart size={22} fill="currentColor" />
                    <span>Start Romantic Game</span>
                  </RomanticButton>
                </Link>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-gray-200" />
                  <span className="flex-shrink-0 mx-4 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Or</span>
                  <div className="flex-grow border-t border-gray-200" />
                </div>

                <Link href="/join-room" className="block outline-none">
                  <RomanticButton variant="secondary" fullWidth className="py-4">
                    <Users size={22} />
                    <span>Join with Code</span>
                  </RomanticButton>
                </Link>

                {/* Sign in prompt for unauthenticated users */}
                {!profile && !loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center pt-4 border-t border-gray-100"
                  >
                    <p className="text-xs text-gray-400 font-medium mb-2">
                      Connect with your partner for the full experience
                    </p>
                    <Link 
                      href="/login" 
                      className="inline-flex items-center gap-1.5 text-romantic-pink font-bold text-sm hover:underline"
                    >
                      <Sparkles size={14} />
                      Sign In
                    </Link>
                  </motion.div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </main>
  );
}
