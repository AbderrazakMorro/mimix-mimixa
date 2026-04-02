'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, X, Loader2, Plus, Send, Video, ArrowLeft, CheckCheck, Image as ImageIcon } from 'lucide-react';
import { useChat, ChatMessage } from '@/hooks/useChat';

/* ─── Props ─── */
interface ChatUIProps {
  conversationId: string;
  currentUserId: string;
  currentAvatarUrl?: string | null;
  partnerId: string;
  partnerName?: string;
  partnerAvatarUrl?: string | null;
  partnerPublicKey?: any;
  onBack?: () => void;
  onClose?: () => void;
  fullHeight?: boolean;
}

/* ─── Message Grouping Helper ─── */
function groupMessages(messages: ChatMessage[]) {
  const groups: { label: string; messages: ChatMessage[] }[] = [];
  let currentGroup: { label: string; messages: ChatMessage[] } | null = null;
  let lastDate: string | null = null;

  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at);
    const dateKey = msgDate.toDateString();

    if (dateKey !== lastDate) {
      const now = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let label: string;
      if (dateKey === now.toDateString()) label = 'Today';
      else if (dateKey === yesterday.toDateString()) label = 'Yesterday';
      else label = msgDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

      currentGroup = { label, messages: [msg] };
      groups.push(currentGroup);
    } else {
      currentGroup?.messages.push(msg);
    }
    lastDate = dateKey;
  });
  return groups;
}

/* ─── Emoji Palette ─── */
const EMOJIS = ['💖', '🔥', '😘', '😂', '🥺', '😏', '✨', '💕', '🦋', '👀', '🥂', '🌹', '💯', '🌈', '🌙', '🍕', '🎉', '🎸', '❤️', '😍', '🥰', '💋', '🤗', '😊'];

/* ═══════════════════════════════════════════
   MAIN CHAT UI COMPONENT
   ═══════════════════════════════════════════ */
export default function ChatUIV2({
  conversationId,
  currentUserId,
  currentAvatarUrl,
  partnerId,
  partnerName,
  partnerAvatarUrl,
  partnerPublicKey,
  onBack,
  onClose,
  fullHeight = false,
}: ChatUIProps) {
  const {
    messages, loading, isTyping,
    sendMessage, toggleReaction, setTyping, markAsSeen, initE2E
  } = useChat(conversationId);

  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ─── E2EE Init ─── */
  useEffect(() => {
    if (partnerPublicKey) initE2E(partnerPublicKey);
  }, [partnerPublicKey, initE2E]);

  /* ─── Auto-scroll ─── */
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [messages, isTyping]);

  /* ─── Mark as Seen ─── */
  useEffect(() => {
    if (conversationId) markAsSeen();
  }, [conversationId, messages.length]);

  /* ─── Send ─── */
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    sendMessage(text);
    setInputText('');
    setShowEmoji(false);
    setTyping(false);
    // Refocus input
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [inputText, sendMessage, setTyping]);

  /* ─── Textarea auto-resize + keyboard ─── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!e.target.value) setTyping(false);
    else if (e.target.value.length === 1) setTyping(true);

    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const groupedMessages = groupMessages(messages);
  const partnerIsTyping = isTyping[partnerId];

  /* ─── Container classes ─── */
  const containerClass = fullHeight
    ? 'w-full h-full bg-white/80 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-white/70 overflow-hidden'
    : 'w-full h-[100dvh] md:h-[560px] md:max-h-[85vh] md:w-[420px] bg-white md:rounded-[2rem] md:shadow-[0_20px_60px_rgba(0,0,0,0.12)] md:border md:border-white/70 overflow-hidden';

  return (
    <div dir="ltr" className={`flex flex-col relative ${containerClass}`}>

      {/* ═══ HEADER ═══ */}
      <header className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white/90 backdrop-blur-xl border-b border-gray-100/80 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button (mobile full-screen) */}
          {(onBack || onClose) && (
            <button
              onClick={onBack || onClose}
              className="p-1.5 -ml-1 rounded-full text-gray-400 hover:text-[#9A2943] hover:bg-pink-50 transition-colors shrink-0 md:hidden"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {/* Avatar */}
          <div className="relative shrink-0">
            {partnerAvatarUrl ? (
              <img src={partnerAvatarUrl} alt={partnerName || 'Partner'} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8677D] to-[#B5456A] flex items-center justify-center text-white text-base font-bold shadow-sm">
                {(partnerName || 'P')[0]}
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ${partnerIsTyping ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
          </div>

          {/* Name & Status */}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-[15px] text-gray-800 truncate leading-tight">{partnerName || 'Partner'}</span>
            <span className="text-[11px] text-gray-400 font-medium leading-tight">
              {partnerIsTyping ? (
                <span className="text-[#E8677D] font-semibold">typing...</span>
              ) : 'Online'}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="p-2 rounded-full text-[#8B3F5A]/70 hover:bg-pink-50 hover:text-[#8B3F5A] transition-colors" aria-label="Video call">
            <Video size={18} />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors hidden md:flex" aria-label="Close">
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {/* ═══ MESSAGES ═══ */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-5 pt-4 pb-4 space-y-5 overscroll-contain"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#E8D0D4 transparent' }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-[#E8677D]" size={28} />
          </div>
        ) : (
          <>
            {groupedMessages.map((group, gi) => (
              <div key={gi} className="space-y-3">
                {/* Date pill */}
                <div className="flex justify-center py-1">
                  <span className="px-3 py-1 bg-[#FDF5F5] text-[10px] font-semibold text-[#B98E94] tracking-wider uppercase rounded-full border border-pink-50/60 select-none">
                    {group.label}
                  </span>
                </div>

                {/* Messages */}
                {group.messages.map((msg, mi) => {
                  const isMe = msg.sender_id === currentUserId;
                  const prevMsg = mi > 0 ? group.messages[mi - 1] : null;
                  const nextMsg = mi < group.messages.length - 1 ? group.messages[mi + 1] : null;
                  const isFirstInCluster = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                  const isLastInCluster = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMe={isMe}
                      isFirstInCluster={isFirstInCluster}
                      isLastInCluster={isLastInCluster}
                      partnerAvatarUrl={partnerAvatarUrl}
                      toggleReaction={toggleReaction}
                    />
                  );
                })}
              </div>
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {partnerIsTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="flex items-end gap-2 pl-1"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 opacity-0" />
                  <div className="px-4 py-2.5 bg-[#FBE5E5]/60 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-[#C48C90] rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-[#C48C90] rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-[#C48C90] rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ═══ EMOJI PICKER ═══ */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 bg-white overflow-hidden shrink-0 z-20"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold uppercase text-[#B98E94] tracking-widest">Emoji</span>
                <button onClick={() => setShowEmoji(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => { setInputText(prev => prev + e); setShowEmoji(false); inputRef.current?.focus(); }}
                    className="text-xl p-1.5 rounded-lg hover:bg-pink-50 active:scale-90 transition-all flex items-center justify-center"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ INPUT BAR ═══ */}
      <div className="shrink-0 border-t border-gray-100/80 bg-white/95 backdrop-blur-lg px-3 sm:px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] z-20">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          {/* Plus / Attach */}
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#9A2943] text-white hover:bg-[#872440] active:scale-95 transition-all shrink-0 shadow-sm mb-0.5"
            aria-label="Attach"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>

          {/* Text input pill */}
          <div className="flex-1 flex items-end bg-[#FBF0F0] rounded-[1.25rem] px-3.5 py-1.5 min-h-[40px] focus-within:ring-2 focus-within:ring-[#9A2943]/15 transition-shadow">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Write something sweet..."
              rows={1}
              className="flex-1 bg-transparent border-none focus:outline-none text-[14px] font-medium text-gray-800 placeholder-[#C4A0A8] resize-none leading-[1.4] max-h-[120px] py-1"
              style={{ height: '24px' }}
            />
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-1 rounded-full shrink-0 ml-1 transition-colors ${showEmoji ? 'text-[#9A2943]' : 'text-[#B89098] hover:text-[#9A2943]'}`}
              aria-label="Emoji"
            >
              <Smile size={18} />
            </button>
          </div>

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || loading}
            className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-[#9A2943] to-[#6E2E48] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 active:scale-95 transition-all shadow-md mb-0.5"
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Send size={16} className="translate-x-[1px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MESSAGE BUBBLE
   ═══════════════════════════════════════════ */
const MessageBubble = React.memo(function MessageBubble({
  msg,
  isMe,
  isFirstInCluster,
  isLastInCluster,
  partnerAvatarUrl,
  toggleReaction,
}: {
  msg: ChatMessage;
  isMe: boolean;
  isFirstInCluster: boolean;
  isLastInCluster: boolean;
  partnerAvatarUrl?: string | null;
  toggleReaction: (msgId: string, reaction: string) => void;
}) {
  const isSticker = msg.message_type === 'sticker';
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* Rounded corners logic:
     - For "me" bubbles: always round, but sharp bottom-right on last in cluster
     - For "partner" bubbles: always round, but sharp top-left on first in cluster */
  const bubbleRadius = isMe
    ? `rounded-[1.25rem] ${isLastInCluster ? 'rounded-br-[4px]' : ''}`
    : `rounded-[1.25rem] ${isFirstInCluster ? 'rounded-tl-[4px]' : ''}`;

  const bubbleColor = isMe
    ? 'bg-[#9A2943] text-white'
    : 'bg-[#FBE5E5] text-gray-800';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isFirstInCluster ? 'mt-3' : 'mt-0.5'}`}
    >
      {/* Partner avatar (only on last in cluster) */}
      <div className="w-7 shrink-0 self-end">
        {!isMe && isLastInCluster && (
          <div className="w-7 h-7 rounded-full overflow-hidden shadow-sm">
            {partnerAvatarUrl ? (
              <img src={partnerAvatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#E8677D] to-[#B5456A] flex items-center justify-center text-white text-[10px] font-bold">P</div>
            )}
          </div>
        )}
      </div>

      {/* Bubble content */}
      <div className={`max-w-[75%] sm:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`relative px-3.5 py-2.5 ${bubbleRadius} ${bubbleColor} shadow-sm`}>
          {isSticker ? (
            <img src={msg.content} alt="sticker" className="w-28 h-28 sm:w-32 sm:h-32 object-contain" />
          ) : (
            <p className="text-[14px] leading-[1.45] break-words whitespace-pre-wrap">{msg.content}</p>
          )}
        </div>

        {/* Timestamp & read receipt (only on last in cluster) */}
        {isLastInCluster && (
          <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
            <span className="text-[10px] text-gray-400 font-medium select-none">{time}</span>
            {isMe && <CheckCheck size={12} className="text-[#9A2943]/40" />}
          </div>
        )}
      </div>
    </motion.div>
  );
});
