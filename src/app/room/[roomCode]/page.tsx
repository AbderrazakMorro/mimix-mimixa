'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Copy, Play, Loader2, Sparkles, Settings2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import ProfileCard from '@/components/ui/ProfileCard';
import { useGameSession } from '@/hooks/useGameSession';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function RoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const router = useRouter();
  const { roomCode } = use(params);
  const { user, loading: userLoading } = useCurrentUser();
  
  const {
    session,
    players,
    loading,
    error,
    isHost,
    bothPlayersPresent,
    startGame,
  } = useGameSession({
    roomCode,
    userId: user?.id ?? '',
  });

  // Host configuration state
  const [questionCount, setQuestionCount] = useState<10 | 20>(10);
  const [includeAdult, setIncludeAdult] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync settings from session when loaded
  useEffect(() => {
    if (session) {
      setQuestionCount((session.question_count === 20 ? 20 : 10) as 10 | 20);
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

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
        <AnimatedBackground motif="hearts" intensity="low" />
        <GlassCard className="text-center relative z-10">
          <Loader2 className="mx-auto text-romantic-pink w-10 h-10 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading room...</p>
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <AnimatedBackground motif="hearts" intensity="low" />
      
      <GlassCard strong className="max-w-lg w-full text-center relative z-10">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="mx-auto w-16 h-16 bg-gradient-to-br from-romantic-pink to-romantic-rose text-white rounded-full flex items-center justify-center mb-6 glow-pink"
        >
          <Heart fill="currentColor" size={32} />
        </motion.div>

        <h1 className="text-heading-lg font-serif font-bold text-gray-800 mb-2">
          Room <span className="text-romantic-pink tracking-widest">{roomCode}</span>
        </h1>
        <p className="text-gray-500 mb-8 font-medium">
          {bothPlayersPresent ? '💕 Both players connected!' : 'Waiting for your partner to connect...'}
        </p>

        {/* Players Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 px-4 relative gap-6 sm:gap-0">
          {(() => {
            const hostPlayer = players.find(p => p.player_id === session?.host_id);
            const isMe = user?.id === session?.host_id;
            const displayName = hostPlayer?.profiles?.display_name || hostPlayer?.profiles?.username || (isMe ? "You (Host)" : "Host");
            const avatarUrl = hostPlayer?.profiles?.avatar_url;
            return <ProfileCard username={displayName} avatarUrl={avatarUrl} status="ready" size="lg" />;
          })()}

          {/* Connection Line */}
          <div className="hidden sm:flex flex-grow items-center justify-center relative mx-4">
            <div className="absolute w-full h-1 bg-gray-200 rounded-full"></div>
            {bothPlayersPresent ? (
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="absolute w-full h-1 bg-gradient-to-r from-romantic-pink to-romantic-peach rounded-full origin-left" />
            ) : (
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute w-full h-1 bg-gradient-to-r from-romantic-pink to-romantic-peach rounded-full origin-left opacity-50" />
            )}
            <motion.div
               animate={bothPlayersPresent ? { scale: [1, 1.2, 1] } : { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className="z-10 bg-white p-2 rounded-full shadow-md text-romantic-pink border border-pink-100"
            >
               <Heart size={20} fill="currentColor" />
            </motion.div>
          </div>

          {/* Vertical pulse for mobile */}
          <motion.div className="sm:hidden" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <Heart size={28} className="text-romantic-pink" fill="currentColor" />
          </motion.div>

          {(() => {
            const p2Id = session?.player2_id;
            const p2Player = players.find(p => p.player_id === p2Id);
            const isMe = user?.id === p2Id;
            const displayName = bothPlayersPresent 
              ? (p2Player?.profiles?.display_name || p2Player?.profiles?.username || (isMe ? "You" : "Partner"))
              : "Partner";
            const avatarUrl = p2Player?.profiles?.avatar_url;
            return <ProfileCard username={displayName} avatarUrl={avatarUrl} status={bothPlayersPresent ? "ready" : "waiting"} size="lg" placeholder={!bothPlayersPresent ? "?" : undefined} />;
          })()}
        </div>

        {/* Host Configuration Panel - Always visible to host */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-4"
          >
            <div className="flex items-center gap-2 justify-center text-gray-500 mb-4">
              <Settings2 size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Game Settings</span>
            </div>

            {/* Journey Length */}
            <div className="p-4 bg-white/80 rounded-2xl border border-pink-100 shadow-sm">
              <p className="font-semibold text-gray-800 mb-3 text-sm">Journey Length</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setQuestionCount(10)}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all text-sm ${
                    questionCount === 10
                      ? 'border-romantic-pink bg-pink-50 text-romantic-pink shadow-sm'
                      : 'border-gray-100 text-gray-500 hover:border-pink-200'
                  }`}
                >
                  10 Questions
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionCount(20)}
                  className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all text-sm ${
                    questionCount === 20
                      ? 'border-romantic-pink bg-pink-50 text-romantic-pink shadow-sm'
                      : 'border-gray-100 text-gray-500 hover:border-pink-200'
                  }`}
                >
                  20 Questions
                </button>
              </div>
            </div>

            {/* Spicy Mode Toggle */}
            <div className="p-4 bg-white/80 rounded-2xl border border-pink-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 text-sm">Spicy Mode (+18)</p>
                <p className="text-xs text-gray-500 mt-0.5">Deeper, more intimate questions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={includeAdult} onChange={(e) => setIncludeAdult(e.target.checked)} />
                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-romantic-pink shadow-inner"></div>
              </label>
            </div>
          </motion.div>
        )}

        {/* Guest waiting message when both connected */}
        {!isHost && bothPlayersPresent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-4 bg-pink-50/60 rounded-2xl border border-pink-100"
          >
            <div className="flex items-center justify-center gap-2 text-romantic-pink">
              <Sparkles size={16} />
              <p className="text-sm font-semibold">Connected! Host is setting up the game...</p>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <RomanticButton variant="secondary" fullWidth onClick={copyCode}>
            {copied ? <Check size={20} /> : <Copy size={20} />}
            {copied ? 'Copied!' : `Copy Room Code: ${roomCode}`}
          </RomanticButton>
          
          {isHost ? (
            <RomanticButton 
              variant="primary" 
              fullWidth 
              onClick={handleStartGame}
              disabled={!bothPlayersPresent || isStarting}
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
            <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 text-romantic-pink font-medium text-sm flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {bothPlayersPresent ? 'Waiting for host to start the game...' : 'Waiting for partner to join...'}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
