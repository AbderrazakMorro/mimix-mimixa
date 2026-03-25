'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, X } from 'lucide-react';
import { useMessaging, Message } from '@/hooks/useMessaging';
import GlassCard from '@/components/ui/GlassCard';

interface ChatUIProps {
  currentUserId: string;
  partnerId: string;
  partnerName?: string;
  partnerPublicKey?: any;
  onClose?: () => void;
}

export default function ChatUI({ currentUserId, partnerId, partnerName, partnerPublicKey, onClose }: ChatUIProps) {
  const { messages, sendMessage } = useMessaging(currentUserId, partnerId, partnerPublicKey);
  const [inputText, setInputText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Common romantic/game-related emojis
  const emojis = ['💖', '🔥', '😘', '😂', '🥺', '😏', '✨', '💕', '🦋', '👀', '🥂', '🌹'];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
      setShowEmojis(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojis(false);
  };

  return (
    <GlassCard className="flex flex-col h-[500px] max-h-[80vh] w-full max-w-sm overflow-hidden p-0 relative shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-pink-100 bg-white/50 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-romantic-pink to-romantic-peach flex items-center justify-center text-white text-xs font-bold shadow-inner uppercase">
            {partnerName?.[0] || 'P'}
          </div>
          <span className="font-semibold text-gray-800">{partnerName || 'Partner'}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-romantic-pink transition-colors p-1">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth bg-white/20"
      >
        <AnimatePresence>
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-br from-romantic-pink to-romantic-rose text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none border border-pink-50'
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block ${isMe ? 'text-pink-100' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400 text-sm italic">Send a message to start chatting...</p>
          </div>
        )}
      </div>

      {/* Emoji Picker Popover */}
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-16 left-2 right-2 p-2 bg-white/95 backdrop-blur-xl border border-pink-100 rounded-xl shadow-lg z-20"
          >
            <div className="grid grid-cols-6 gap-2">
              {emojis.map(e => (
                <button 
                  key={e} 
                  onClick={() => handleEmojiClick(e)}
                  className="text-xl hover:scale-125 transition-transform p-1"
                >
                  {e}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white/60 backdrop-blur-md border-t border-pink-100 z-10">
        <div className="flex items-center gap-2 bg-white rounded-full p-1 pr-2 shadow-inner border border-pink-50 focus-within:ring-2 focus-within:ring-romantic-pink/20 transition-all">
          <button 
            type="button" 
            onClick={() => setShowEmojis(!showEmojis)}
            className="p-2 text-gray-400 hover:text-romantic-pink transition-colors"
          >
            <Smile size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Whisper something..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder-gray-400 py-2"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="w-8 h-8 rounded-full bg-romantic-pink text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-romantic-rose transition-colors"
          >
            <Send size={14} className="ml-0.5" />
          </button>
        </div>
      </form>
    </GlassCard>
  );
}
