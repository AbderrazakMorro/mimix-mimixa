'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Heart, ShieldAlert } from 'lucide-react';
import { useProfile } from '@/contexts/ProfileContext';
import ChatUIV2 from '@/components/ChatUIV2';
import GlassCard from '@/components/ui/GlassCard';

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFF5F8] flex items-center justify-center"><Loader2 className="animate-spin text-romantic-pink" size={32} /></div>}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const { profile: myProfile, relationship } = useProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [partnerConversation, setPartnerConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    let intervalId: NodeJS.Timeout;
    let isCreating = false;

    const fetchPartnerConversation = async (shouldCreate = false) => {
      if (!myProfile) return;

      if (!relationship?.otherPerson?.id) {
         if (active) setLoading(false);
         return;
      }

      try {
        const res = await fetch('/api/chat/conversations');
        if (!res.ok) {
          if (active) setLoading(false);
          return;
        }
        
        const data = await res.json();
        
        let hasPartnerConv = data.conversations?.find((c: any) => 
          c.type === 'private' && c.partner?.id === relationship.otherPerson.id
        );

        if (!hasPartnerConv && shouldCreate && !isCreating) {
          isCreating = true;
          if (active) setCreating(true);
          try {
            const createRes = await fetch('/api/chat/conversations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'private', partner_id: relationship.otherPerson.id })
            });
            if (createRes.ok) {
              const { conversation } = await createRes.json();
              const refreshRes = await fetch('/api/chat/conversations');
              if (refreshRes.ok) {
                 const refreshData = await refreshRes.json();
                 hasPartnerConv = refreshData.conversations?.find((c: any) => 
                   c.id === conversation.id || (c.type === 'private' && c.partner?.id === relationship.otherPerson.id)
                 );
              }
            }
          } catch (createErr) {
            console.error('Create conversation error:', createErr);
          } finally {
            isCreating = false;
            if (active) setCreating(false);
          }
        }

        if (active && hasPartnerConv) {
           setPartnerConversation(hasPartnerConv);
           if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Fetch conversations error:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPartnerConversation(true);

    intervalId = setInterval(() => {
       fetchPartnerConversation(false);
    }, 5000);
    
    return () => {
       active = false;
       clearInterval(intervalId);
    };
  }, [relationship?.otherPerson?.id, myProfile?.id]);

  // Safety: force-stop loading after 8s
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
      setCreating(false);
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <main dir="ltr" className="min-h-screen bg-[#FFF5F8] pt-16 sm:pt-20 pb-6 sm:pb-10 px-0 sm:px-4 md:px-8 xl:px-20 flex flex-col">
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
         <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-romantic-pink/40 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-romantic-lavender/30 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {(loading || creating) && !partnerConversation ? (
            <motion.div
               key="loading"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               transition={{ duration: 0.3 }}
               className="w-full flex items-center justify-center flex-1"
            >
               <GlassCard className="flex flex-col items-center justify-center border-white/40 bg-white/40 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] shadow-2xl text-center px-8 sm:px-12 py-12 sm:py-16">
                  <div className="flex flex-col items-center gap-5">
                     <div className="relative">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/80 rounded-full flex items-center justify-center shadow-lg relative z-10">
                           <Loader2 className="animate-spin text-romantic-pink" size={36} />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 bg-romantic-pink/20 blur-2xl rounded-full animate-pulse" />
                     </div>
                     <h2 className="text-lg sm:text-xl font-black text-gray-800 tracking-wider uppercase">
                        {creating ? 'Establishing Secure Whisper...' : 'Syncing Hearts...'}
                     </h2>
                  </div>
               </GlassCard>
            </motion.div>
          ) : partnerConversation ? (
              <motion.div
               key="chat"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 22 }}
               className="flex-1 flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100vh-7rem)] sm:shadow-2xl sm:rounded-[2.5rem] sm:border sm:border-white/40 sm:bg-white/40 sm:backdrop-blur-3xl overflow-hidden"
            >
               <ChatUIV2 
                 key={partnerConversation.id}
                 conversationId={partnerConversation.id}
                 currentUserId={myProfile!.id}
                 currentAvatarUrl={myProfile!.avatar_url}
                 partnerId={partnerConversation.partner?.id}
                 partnerName={partnerConversation.partner?.display_name || partnerConversation.partner?.username}
                 partnerAvatarUrl={partnerConversation.partner?.avatar_url}
                 partnerPublicKey={partnerConversation.partner?.public_key}
                 onBack={() => router.push('/')}
                 fullHeight
               />
            </motion.div>
          ) : !relationship?.otherPerson ? (
            <motion.div
               key="no-relationship"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="w-full flex items-center justify-center flex-1"
            >
               <GlassCard className="flex flex-col items-center justify-center border-white/40 bg-white/20 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] shadow-inner text-center px-8 sm:px-10 py-16 sm:py-20">
                  <div className="max-w-md space-y-8">
                     <div className="relative inline-block">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl relative z-10">
                          <Heart className="text-gray-300" size={56} fill="#F3F4F6" strokeWidth={3} />
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-48 sm:h-48 bg-gray-200/50 blur-3xl rounded-full" />
                     </div>
                     
                     <div className="space-y-3">
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter">Whispers are for Two</h2>
                        <p className="text-gray-500 font-bold leading-relaxed px-2 sm:px-4 text-sm sm:text-base">
                          You need a partner to use Whispers. Connect with someone special from the Home page first.
                        </p>
                     </div>

                     <button 
                       onClick={() => router.push('/')}
                       className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-romantic-pink to-romantic-lavender text-white font-black text-xs sm:text-sm uppercase tracking-widest rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                     >
                       Return Home
                     </button>
                  </div>
               </GlassCard>
            </motion.div>
          ) : (
            <motion.div
               key="error"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-full flex items-center justify-center flex-1"
            >
               <GlassCard className="flex flex-col items-center justify-center border-white/40 bg-white/20 backdrop-blur-md rounded-[2rem] sm:rounded-[3rem] shadow-inner text-center px-8 sm:px-10 py-16 sm:py-20">
                  <div className="flex flex-col items-center gap-4">
                     <ShieldAlert size={44} className="text-red-400" />
                     <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tighter">Connection Error</h2>
                     <p className="text-gray-500 font-bold max-w-sm text-sm sm:text-base">
                       Couldn&apos;t verify the secure room. Try reloading.
                     </p>
                     <button 
                       onClick={() => window.location.reload()}
                       className="mt-4 px-6 py-3 bg-white text-gray-700 font-black text-xs uppercase tracking-widest rounded-full shadow-md hover:shadow-lg transition-all"
                     >
                       Retry
                     </button>
                  </div>
               </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
