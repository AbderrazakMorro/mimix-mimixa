'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, X, Heart, Sticker, Loader2, MoreVertical, ThumbsUp, Laugh, Flame, Ghost, Frown } from 'lucide-react';
import { useChat, ChatMessage } from '@/hooks/useChat';
import GlassCard from '@/components/ui/GlassCard';

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
  fullHeight = false
}: ChatUIProps) {
  const { messages, loading, isTyping, sendMessage, toggleReaction, setTyping, markAsSeen, initE2E } = useChat(conversationId);
  const [inputText, setInputText] = useState('');
  const [showPicker, setShowPicker] = useState<'emojis' | 'stickers' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const emojis = ['💖', '🔥', '😘', '😂', '🥺', '😏', '✨', '💕', '🦋', '👀', '🥂', '🌹', '💯', '🌈', '🌙', '🍕', '🎉', '🎸'];
  
  // Stickers (Placeholder URLs - these would ideally be assets)
  const stickers = [
    { title: 'Love Heart', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2ZkbHk1NmZ6ZzJ6ZzZ6ZzZ6ZzZ6ZzZ6ZzZ6ZzZ6ZzZ6ZzZ6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/vguX8E9H4fXk9Xp9Xp/giphy.gif' },
    { title: 'Cute Cat', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2ZkbHk1NmZ6ZzJ6ZzZ6ZzZ6ZzZ6ZzZ6ZzZ6ZzZ6ZzZ6ZzZ6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1z/vguX8E9H4fXk9Xp9Xp/giphy.gif' },
    // More stickers...
  ];

  const reactions = [
    { icon: <Heart size={14} className="text-romantic-pink" />, label: '❤️' },
    { icon: <ThumbsUp size={14} className="text-blue-500" />, label: '👍' },
    { icon: <Laugh size={14} className="text-yellow-500" />, label: '😂' },
    { icon: <Flame size={14} className="text-orange-500" />, label: '🔥' },
    { icon: <Ghost size={14} className="text-purple-500" />, label: '😮' },
    { icon: <Frown size={14} className="text-indigo-500" />, label: '😢' },
  ];

  useEffect(() => {
    if (partnerPublicKey) {
      initE2E(partnerPublicKey);
    }
  }, [partnerPublicKey, initE2E]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (conversationId) {
      markAsSeen();
    }
  }, [conversationId, messages.length]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
      setShowPicker(null);
      setTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!e.target.value) setTyping(false);
    else if (e.target.value.length === 1) setTyping(true);
  };

  const sendSticker = (stickerUrl: string) => {
    sendMessage(stickerUrl, 'sticker');
    setShowPicker(null);
  };

  return (
    <GlassCard className={`flex flex-col w-full h-full overflow-hidden p-0 relative shadow-2xl transition-all duration-300 ${fullHeight ? 'h-full' : 'rounded-none sm:h-[600px] sm:max-h-[85vh] sm:max-w-md sm:rounded-[2.5rem] bg-[#FAFAFA] sm:bg-white/80 z-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-pink-100 bg-white/80 backdrop-blur-xl z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-romantic-pink transition-colors">
               <X className="rotate-90" size={20} />
            </button>
          )}
          <div className="relative">
             {partnerAvatarUrl ? (
               <img src={partnerAvatarUrl} alt={partnerName} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
             ) : (
               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-romantic-pink to-romantic-peach flex items-center justify-center text-white text-sm font-black shadow-inner">
                 {partnerName?.[0] || 'P'}
               </div>
             )}
             <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isTyping[partnerId] ? 'bg-romantic-pink animate-pulse' : 'bg-gray-300'}`} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 leading-tight">{partnerName || 'Partner'}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              {isTyping[partnerId] ? 'Thinking...' : 'online'}
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-romantic-pink transition-colors p-2 hover:bg-white rounded-full">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth bg-[#FAFAFA] sm:bg-transparent custom-scrollbar">
        {loading && messages.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
             <Loader2 className="animate-spin text-romantic-pink" size={32} />
             <p className="text-xs font-bold text-romantic-pink animate-pulse uppercase tracking-widest">Connecting History...</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMe={msg.sender_id === currentUserId}
                toggleReaction={toggleReaction}
              />
            ))}
            
            {/* Typing Indicator Bubble */}
            <AnimatePresence>
              {isTyping[partnerId] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="flex gap-2"
                >
                  <div className="px-4 py-3 bg-white border border-pink-100 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-romantic-pink/40 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-romantic-pink/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-romantic-pink/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Pickers (Emoji/Stickers) */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-20 left-4 right-4 bg-white/95 backdrop-blur-xl border border-pink-100 rounded-3xl shadow-2xl z-40 p-4 max-h-[300px] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-xs font-black uppercase text-romantic-pink tracking-widest">{showPicker}</span>
              <button onClick={() => setShowPicker(null)} className="text-gray-400 hover:text-romantic-pink"><X size={16} /></button>
            </div>
            
            {showPicker === 'emojis' ? (
              <div className="grid grid-cols-6 gap-3">
                {emojis.map(e => (
                  <button 
                    key={e} 
                    onClick={() => { setInputText(prev => prev + e); setShowPicker(null); }}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {stickers.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => sendSticker(s.url)}
                    className="aspect-square bg-gray-50 rounded-2xl p-2 hover:bg-pink-50 transition-colors group overflow-hidden"
                  >
                    <img src={s.url} alt={s.title} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input UI */}
      <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-lg z-30 shrink-0 border-t border-pink-50/50">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-2 bg-white rounded-[2rem] p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-100 focus-within:ring-4 focus-within:ring-romantic-pink/10 transition-all">
          <div className="flex gap-1">
            <button 
              type="button" 
              onClick={() => setShowPicker(showPicker === 'emojis' ? null : 'emojis')}
              className={`p-2.5 rounded-full transition-all ${showPicker === 'emojis' ? 'bg-romantic-pink text-white scale-110' : 'text-gray-400 hover:text-romantic-pink hover:bg-pink-50'}`}
            >
              <Smile size={20} />
            </button>
            <button 
              type="button" 
              onClick={() => setShowPicker(showPicker === 'stickers' ? null : 'stickers')}
              className={`p-2.5 rounded-full transition-all hidden sm:flex ${showPicker === 'stickers' ? 'bg-romantic-pink text-white scale-110' : 'text-gray-400 hover:text-romantic-pink hover:bg-pink-50'}`}
            >
              <Sticker size={20} />
            </button>
          </div>
          
          <textarea
            value={inputText}
            onChange={(e: any) => handleInputChange(e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
            placeholder="Type a loving message..."
            rows={1}
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px] font-medium text-gray-700 placeholder-gray-400 py-3 ml-2 resize-none max-h-32 min-h-[44px] custom-scrollbar"
            style={{ height: 'auto' }}
          />
          
          <button 
            type="submit"
            disabled={!inputText.trim() || loading}
            className="w-11 h-11 rounded-full shrink-0 bg-gradient-to-tr from-romantic-pink to-romantic-lavender text-white flex items-center justify-center disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed hover:shadow-lg hover:scale-105 transition-all shadow-md active:scale-95 mb-0.5 mr-0.5"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} className="translate-x-0.5" />}
          </button>
        </form>
      </div>
    </GlassCard>
  );
}

const MessageBubble = React.memo(function MessageBubble({
  msg,
  isMe,
  toggleReaction
}: {
  msg: ChatMessage;
  isMe: boolean;
  toggleReaction: (msgId: string, reaction: string) => void;
}) {
  const reactionsCount = (msg.reactions || []).reduce((acc: any, r: any) => {
    acc[r.reaction] = (acc[r.reaction] || 0) + 1;
    return acc;
  }, {});

  const reactions = [
    { icon: <Heart size={14} className="text-romantic-pink" />, label: '❤️' },
    { icon: <ThumbsUp size={14} className="text-blue-500" />, label: '👍' },
    { icon: <Laugh size={14} className="text-yellow-500" />, label: '😂' },
    { icon: <Flame size={14} className="text-orange-500" />, label: '🔥' },
    { icon: <Ghost size={14} className="text-purple-500" />, label: '😮' },
    { icon: <Frown size={14} className="text-indigo-500" />, label: '😢' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Bubble */}
      <div className="relative group max-w-[85%] sm:max-w-[75%]">
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 rounded-[1.25rem] shadow-sm relative z-10 ${
          isMe
            ? 'bg-gradient-to-tr from-romantic-pink to-romantic-lavender text-white rounded-br-md shadow-[0_4px_14px_rgb(255,107,158,0.25)]'
            : 'bg-white text-gray-800 rounded-bl-md border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]'
        }`}>
          {msg.message_type === 'sticker' ? (
            <img src={msg.content} alt="sticker" className="w-32 h-32 object-contain" />
          ) : (
            <p className="text-[15px] font-medium leading-[1.4] break-words whitespace-pre-wrap">{msg.content}</p>
          )}
          <span className={`text-[9px] mt-1.5 block font-bold uppercase tracking-wider opacity-80 ${isMe ? 'text-white' : 'text-gray-400'}`}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Reactions Display */}
        {Object.keys(reactionsCount).length > 0 && (
          <div className={`absolute -bottom-3 flex gap-1 z-20 ${isMe ? 'right-2' : 'left-2'}`}>
            {Object.entries(reactionsCount).map(([r, count]: any) => (
              <button
                key={r}
                onClick={() => toggleReaction(msg.id, r)}
                className="px-1.5 py-0.5 bg-white border border-pink-100 rounded-full shadow-sm text-[10px] flex items-center gap-1 hover:scale-110 transition-transform"
              >
                <span>{r}</span>
                {count > 1 && <span className="font-bold text-gray-500">{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Reaction Picker (On Hover/Tap) */}
        <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-romantic-pink bg-white shadow-sm rounded-full cursor-pointer ${isMe ? '-left-8' : '-right-8'}`}>
          <div className="absolute top-0 opacity-0 group-hover:opacity-100 flex items-center bg-white shadow-xl border border-pink-100 rounded-full p-1 gap-1 -translate-y-full mb-2">
            {reactions.map(r => (
              <button 
                key={r.label} 
                onClick={() => toggleReaction(msg.id, r.label)}
                className="w-6 h-6 flex items-center justify-center hover:scale-125 transition-transform"
              >
                {r.label}
              </button>
            ))}
          </div>
          <Smile size={16} />
        </div>
      </div>
    </motion.div>
  );
});
