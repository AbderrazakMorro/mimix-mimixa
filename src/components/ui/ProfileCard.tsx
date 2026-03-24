'use client';

import { motion } from 'framer-motion';

type ProfileCardProps = {
  avatarUrl?: string | null;
  username?: string;
  status?: 'ready' | 'waiting' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
};

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const statusColors = {
  ready: 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]',
  waiting: 'bg-romantic-gold animate-pulse shadow-[0_0_10px_rgba(255,209,102,0.5)]',
  offline: 'bg-gray-300',
};

export default function ProfileCard({
  avatarUrl,
  username,
  status = 'offline',
  size = 'md',
  placeholder,
}: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-3"
    >
      {/* Avatar */}
      <div className={`relative ${sizeMap[size]}`}>
        <div
          className={`
            ${sizeMap[size]} rounded-full overflow-hidden
            border-4 border-white shadow-xl avatar-glow
            flex items-center justify-center
            ${!avatarUrl ? 'bg-gradient-to-br from-romantic-pink to-romantic-peach' : ''}
          `}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username || 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white font-serif font-bold text-lg select-none">
              {placeholder || username?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        {/* Status Dot */}
        <div
          className={`
            absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-[3px] border-white
            ${statusColors[status]}
          `}
        />
      </div>

      {/* Username */}
      {username && (
        <span className="text-sm font-bold text-gray-700 bg-white/60 px-3 py-1 rounded-full border border-white/80 shadow-sm">
          {username}
        </span>
      )}
    </motion.div>
  );
}
