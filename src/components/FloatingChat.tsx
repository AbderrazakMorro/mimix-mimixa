'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls, useMotionValue, useTransform, animate } from 'framer-motion';
import { Heart, X, MessageCircle } from 'lucide-react';
import ChatUIV2 from '@/components/ChatUIV2';
import { usePresence } from '@/hooks/usePresence';
import { useProfile } from '@/contexts/ProfileContext';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'floating-chat-pos';
const FAB_SIZE = 56; // w-14 = 3.5rem = 56px
const EDGE_PADDING = 16;

function getStoredPos(): { x: number; y: number } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function storePos(x: number, y: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {}
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { profile: myProfile } = useProfile();
  const [user, setUser] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pathname = usePathname();
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Position state
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [initialized, setInitialized] = useState(false);

  // Initialize position from localStorage or default to bottom-right
  useEffect(() => {
    const stored = getStoredPos();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    if (stored) {
      // Clamp within current viewport
      const clampedX = Math.min(Math.max(stored.x, EDGE_PADDING), vw - FAB_SIZE - EDGE_PADDING);
      const clampedY = Math.min(Math.max(stored.y, EDGE_PADDING), vh - FAB_SIZE - EDGE_PADDING);
      x.set(clampedX);
      y.set(clampedY);
    } else {
      // Default: bottom-right
      x.set(vw - FAB_SIZE - EDGE_PADDING * 1.5);
      y.set(vh - FAB_SIZE - EDGE_PADDING * 5); // above safe area
    }
    setInitialized(true);
  }, []);

  // Snap to nearest edge after drag
  const snapToEdge = (currentX: number, currentY: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const midX = vw / 2;

    // Snap to left or right edge
    const targetX = currentX < midX
      ? EDGE_PADDING
      : vw - FAB_SIZE - EDGE_PADDING;

    // Clamp Y within viewport
    const targetY = Math.min(Math.max(currentY, EDGE_PADDING + 60), vh - FAB_SIZE - EDGE_PADDING * 5);

    animate(x, targetX, { type: 'spring', stiffness: 400, damping: 30 });
    animate(y, targetY, { type: 'spring', stiffness: 400, damping: 30 });

    storePos(targetX, targetY);
  };

  // Hide on auth pages and the dedicated chat page
  const hiddenPaths = ['/login', '/signup', '/chat'];
  const shouldHide = hiddenPaths.some(p => pathname?.startsWith(p));

  useEffect(() => {
    let mounted = true;

    async function fetchUserAndPartner() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const { user: fetchedUser } = await res.json();
        if (!mounted) return;
        setUser(fetchedUser);

        const relRes = await fetch('/api/relationships/me');
        if (!relRes.ok) return;
        const { relationships } = await relRes.json();
        const active = relationships.find((r: any) => r.status === 'accepted');
        if (!active || !mounted) return;

        setPartner(active.otherPerson);

        const convRes = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'private', partner_id: active.otherPerson.id })
        });
        if (convRes.ok) {
          const { conversation } = await convRes.json();
          if (mounted) setConversationId(conversation.id);
        }
      } catch (err) {
        console.error('Failed to initialize floating chat');
      }
    }

    fetchUserAndPartner();
    return () => { mounted = false; };
  }, []);

  // Reset unread when opening
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const currentX = x.get();
      const currentY = y.get();

      const clampedX = Math.min(Math.max(currentX, EDGE_PADDING), vw - FAB_SIZE - EDGE_PADDING);
      const clampedY = Math.min(Math.max(currentY, EDGE_PADDING + 60), vh - FAB_SIZE - EDGE_PADDING * 5);

      x.set(clampedX);
      y.set(clampedY);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { onlineStatus } = usePresence(partner?.id, user?.id);

  if (!user || !partner || shouldHide || !initialized) return null;

  return (
    <>
      {/* ═══ CHAT WINDOW ═══ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99] md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed inset-0 z-[100] md:fixed md:bottom-24 md:right-6 md:inset-auto md:w-auto md:h-auto"
            >
              {conversationId ? (
                <ChatUIV2
                  conversationId={conversationId}
                  currentUserId={user.id}
                  currentAvatarUrl={myProfile?.avatar_url}
                  partnerId={partner.id}
                  partnerName={partner.display_name || partner.username}
                  partnerAvatarUrl={partner.avatar_url}
                  partnerPublicKey={partner.public_key}
                  onClose={() => setIsOpen(false)}
                />
              ) : (
                <div className="w-full h-[100dvh] md:h-[560px] md:w-[420px] bg-white md:rounded-[2rem] md:shadow-2xl flex items-center justify-center">
                  <div className="animate-spin text-[#E8677D]">
                    <MessageCircle size={24} />
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ DRAGGABLE FAB ═══ */}
      <motion.div
        dir="ltr"
        style={{ x, y, position: 'fixed', top: 0, left: 0, zIndex: 50 }}
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          // Only snap after actually moving
          const currentX = x.get();
          const currentY = y.get();
          snapToEdge(currentX, currentY);

          // Delay resetting isDragging so onClick doesn't fire
          setTimeout(() => setIsDragging(false), 100);
        }}
        className="touch-none"
      >
        <motion.button
          whileHover={isDragging ? {} : { scale: 1.08 }}
          whileTap={isDragging ? {} : { scale: 0.92 }}
          onClick={() => {
            if (!isDragging) setIsOpen(!isOpen);
          }}
          className={`relative w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing border-2 border-white/80 transition-colors select-none ${
            isOpen
              ? 'bg-gray-400 hover:bg-gray-500'
              : 'bg-gradient-to-br from-[#8B3F5A] to-[#603551] hover:shadow-xl'
          }`}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? (
            <X size={22} />
          ) : (
            <Heart size={22} fill="white" strokeWidth={0} />
          )}

          {/* Unread badge */}
          {!isOpen && unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-[#E8677D] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white rounded-full shadow-sm"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}

          {/* Online indicator */}
          {!isOpen && (
            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
              onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          )}
        </motion.button>
      </motion.div>
    </>
  );
}
