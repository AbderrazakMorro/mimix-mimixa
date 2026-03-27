'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Copy, Play, Loader2, Sparkles, Settings2, Check, Minus, Plus, Crown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import { useGameSession } from '@/hooks/useGameSession';
import { useProfile } from '@/contexts/ProfileContext';

export default function RoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const router = useRouter();
  const { roomCode } = use(params);
  const { profile, relationship, loading: profileLoading } = useProfile();
  
  const {
    session,
    players,
    loading: sessionLoading,
    error,
    isHost,
    bothPlayersPresent,
    startGame,
  } = useGameSession({
    roomCode,
    userId: profile?.id ?? '',
  });

  // Host configuration state
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customMode, setCustomMode] = useState(false);
  const [includeAdult, setIncludeAdult] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync settings from session when loaded
  useEffect(() => {
    if (session) {
      setQuestionCount(session.question_count || 10);
      setIncludeAdult(session.include_adult || false);
    }
  }, [session]);

  // Auto-navigate to game when status changes to in_progress
  useEffect(() => {
    if (session?.status === 'in_progress') {
      router.push(`/game/${roomCode}`);
    }
  }, [session?.status, roomCode, router]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    try {
      setIsStarting(true);
      await startGame({ questionCount, includeAdult });
    } catch (err) {
      console.error('Failed to start game:', err);
      setIsStarting(false);
    }
  };

  // Determine which player is me and which is partner
  const myProfile = profile;
  const partnerProfile = relationship?.otherPerson;

  // Check if they are actually in the session
  const amIJoined = players.some(p => p.player_id === profile?.id);
  const isPartnerJoined = players.some(p => p.player_id === partnerProfile?.id);
  const partnerInSession = bothPlayersPresent || isPartnerJoined;

  if (sessionLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
        <AnimatedBackground motif="hearts" intensity="low" />
        <GlassCard className="text-center relative z-10 px-12 py-10">
          <Loader2 className="mx-auto text-romantic-pink w-10 h-10 animate-spin mb-4" />
          <p className="text-gray-500 font-bold text-sm">Loading room...</p>
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
        <AnimatedBackground motif="hearts" intensity="low" />
        <GlassCard className="text-center relative z-10">
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <RomanticButton variant="secondary" onClick={() => router.push('/')}>
            Back Home
          </RomanticButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 overflow-hidden relative">
      <AnimatedBackground motif="hearts" intensity="low" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-auto space-y-5"
      >
        {/* Room Code Header */}
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Game Room</p>
          <button onClick={copyCode} className="inline-flex items-center gap-2 group">
            <h1 className="text-3xl sm:text-4xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-romantic-pink to-romantic-lavender tracking-wider">
              {roomCode}
            </h1>
            <motion.div whileTap={{ scale: 0.85 }}>
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} className="text-gray-400 group-hover:text-romantic-pink transition-colors" />
              )}
            </motion.div>
          </button>
        </div>

        {/* Players Card */}
        <GlassCard strong className="p-6 sm:p-8">
          <div className="flex items-stretch justify-between gap-3">
            {/* Me (Left) */}
            <div className="flex-1 flex flex-col items-center text-center gap-2">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden ring-4 ring-romantic-pink/10">
                  {myProfile?.avatar_url ? (
                    <img src={myProfile.avatar_url} alt={myProfile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-romantic-pink to-romantic-rose">
                      <User className="text-white" size={32} />
                    </div>
                  )}
                </div>
                <div className={`absolute bottom-0 right-0 w-5 h-5 ${amIJoined ? 'bg-green-400' : 'bg-gray-300'} rounded-full border-[3px] border-white shadow-sm`} />
                {session?.host_id === profile?.id && (
                  <div className="absolute -top-1 -left-1 bg-romantic-gold text-white p-1 rounded-full shadow-md border-2 border-white">
                    <Crown size={10} />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 truncate max-w-[100px]">{myProfile?.display_name || 'You'}</h4>
                {myProfile?.username && (
                  <p className="text-[10px] font-bold text-romantic-pink">@{myProfile.username}</p>
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">You</span>
            </div>

            {/* Heart Connector */}
            <div className="flex flex-col items-center justify-center gap-1 px-2">
              <motion.div
                animate={partnerInSession 
                  ? { scale: [1, 1.25, 1] } 
                  : { scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }
                }
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              >
                <Heart size={28} className="text-romantic-pink drop-shadow-md" fill="currentColor" />
              </motion.div>
              <p className={`text-[9px] font-black uppercase tracking-wider ${partnerInSession ? 'text-green-500' : 'text-gray-400'}`}>
                {partnerInSession ? 'Connected' : 'Waiting...'}
              </p>
            </div>

            {/* Partner (Right) */}
            <div className="flex-1 flex flex-col items-center text-center gap-2">
              <div className="relative">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-white shadow-xl overflow-hidden ring-4 ${partnerInSession ? 'ring-romantic-lavender/10' : 'ring-gray-100'}`}>
                  {partnerInSession && partnerProfile?.avatar_url ? (
                    <img src={partnerProfile.avatar_url} alt={partnerProfile.display_name} className="w-full h-full object-cover" />
                  ) : partnerInSession ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-romantic-lavender to-romantic-pink">
                      <User className="text-white" size={32} />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2 }}>
                        <User className="text-gray-300" size={32} />
                      </motion.div>
                    </div>
                  )}
                </div>
                {partnerInSession && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-400 rounded-full border-[3px] border-white shadow-sm" />
                )}
                {session?.host_id === partnerProfile?.id && session?.host_id !== profile?.id && (
                  <div className="absolute -top-1 -left-1 bg-romantic-gold text-white p-1 rounded-full shadow-md border-2 border-white">
                    <Crown size={10} />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 truncate max-w-[100px]">{partnerProfile?.display_name || 'Waiting...'}</h4>
                {partnerProfile?.username && (
                  <p className="text-[10px] font-bold text-romantic-lavender">@{partnerProfile.username}</p>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${partnerInSession ? 'text-romantic-lavender bg-romantic-lavender/10' : 'text-gray-400 bg-gray-100'}`}>
                {partnerInSession ? 'Partner' : 'Pending'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Host Settings */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-2 justify-center text-gray-500">
                <Settings2 size={15} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Game Settings</span>
              </div>

              {/* Question Count */}
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700 text-center">How many questions?</p>
                
                <div className="flex gap-2">
                  {[10, 20].map(n => (
                    <button
                      key={n}
                      onClick={() => { setQuestionCount(n); setCustomMode(false); }}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                        questionCount === n && !customMode
                          ? 'border-romantic-pink bg-romantic-pink/5 text-romantic-pink shadow-sm'
                          : 'border-gray-100 text-gray-500 hover:border-pink-200 hover:bg-pink-50/30'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => { setCustomMode(true); if (questionCount === 10 || questionCount === 20) setQuestionCount(15); }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      customMode
                        ? 'border-romantic-pink bg-romantic-pink/5 text-romantic-pink shadow-sm'
                        : 'border-gray-100 text-gray-500 hover:border-pink-200 hover:bg-pink-50/30'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {/* Custom Stepper */}
                <AnimatePresence>
                  {customMode && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-center gap-4 pt-2">
                        <button
                          onClick={() => setQuestionCount(Math.max(5, questionCount - 5))}
                          className="w-10 h-10 rounded-full border-2 border-gray-200 text-gray-500 hover:border-romantic-pink hover:text-romantic-pink flex items-center justify-center transition-all active:scale-90"
                        >
                          <Minus size={16} />
                        </button>
                        <div className="w-20 text-center">
                          <span className="text-3xl font-serif font-extrabold text-romantic-pink">{questionCount}</span>
                        </div>
                        <button
                          onClick={() => setQuestionCount(Math.min(50, questionCount + 5))}
                          className="w-10 h-10 rounded-full border-2 border-gray-200 text-gray-500 hover:border-romantic-pink hover:text-romantic-pink flex items-center justify-center transition-all active:scale-90"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-gray-400 font-medium mt-1">Min: 5 — Max: 50</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Spicy Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-pink-50">
                <div>
                  <p className="text-sm font-bold text-gray-800">Spicy Mode 🔥</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Deeper, more intimate questions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={includeAdult} onChange={(e) => setIncludeAdult(e.target.checked)} />
                  <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-romantic-pink shadow-inner"></div>
                </label>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Guest waiting message */}
        {!isHost && bothPlayersPresent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-romantic-pink">
                <Sparkles size={16} className="animate-pulse" />
                <p className="text-sm font-bold">Connected! Host is setting up the game...</p>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <RomanticButton 
              variant="primary" 
              fullWidth 
              onClick={handleStartGame}
              disabled={!bothPlayersPresent || isStarting}
              className="py-5 text-base"
            >
              {isStarting ? (
                <><Loader2 size={20} className="animate-spin" /> Starting...</>
              ) : bothPlayersPresent ? (
                <><Play size={20} fill="currentColor" /> Begin Experience</>
              ) : (
                <><Loader2 size={20} className="animate-spin" /> Waiting for Partner...</>
              )}
            </RomanticButton>
          ) : (
            <div className="p-4 bg-pink-50/80 rounded-2xl border border-pink-100 text-romantic-pink font-bold text-sm flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {bothPlayersPresent ? 'Waiting for host to start...' : 'Waiting for partner to join...'}
            </div>
          )}

          <button
            onClick={copyCode}
            className="w-full py-3.5 rounded-2xl bg-white/80 border border-gray-200 text-gray-600 font-bold text-sm hover:bg-white hover:border-gray-300 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? 'Code Copied!' : `Share Code: ${roomCode}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
