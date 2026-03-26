'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, X } from 'lucide-react';

export type AvatarType = {
  id: string;
  name: string;
  image_url: string;
  category: string;
};

interface AvatarPickerProps {
  currentAvatarUrl: string | null;
  onSelect: (url: string, id?: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ currentAvatarUrl, onSelect, onClose }: AvatarPickerProps) {
  const [avatars, setAvatars] = useState<AvatarType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const res = await fetch('/api/avatars');
        if (res.ok) {
          const data = await res.json();
          setAvatars(data.avatars);
        }
      } catch (err) {
        console.error('Failed to fetch avatars:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvatars();
  }, []);

  const categories = Array.from(new Set(avatars.map((a) => a.category)));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 font-playfair">
          Choose Avatar
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-romantic-pink" />
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 ml-1">
                  {category}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {avatars
                    .filter((a) => a.category === category)
                    .map((avatar) => {
                      const isSelected = currentAvatarUrl === avatar.image_url;
                      return (
                        <button
                          key={avatar.id}
                          onClick={() => {
                            onSelect(avatar.image_url, avatar.id);
                            onClose();
                          }}
                          title={avatar.name}
                          className={`relative aspect-square rounded-2xl p-1 transition-all ${
                            isSelected
                              ? 'bg-gradient-to-br from-romantic-pink to-romantic-rose shadow-lg scale-105'
                              : 'bg-white hover:bg-pink-50 hover:shadow-md border border-gray-100'
                          }`}
                        >
                          <img
                            src={avatar.image_url}
                            alt={avatar.name}
                            className="w-full h-full rounded-xl object-contain bg-white"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-romantic-pink text-white rounded-full p-0.5 shadow-sm">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
