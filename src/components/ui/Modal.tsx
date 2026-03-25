'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  showClose = true
}: ModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary-900/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative w-full max-w-lg bg-white/90 glass-strong rounded-[2.5rem] p-8 shadow-2xl border-2 border-white/50 overflow-hidden',
              className
            )}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              {title && (
                <h2 className="text-2xl font-serif font-black text-primary-500 tracking-tight">
                  {title}
                </h2>
              )}
              {showClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-primary-50 text-primary-300 hover:text-primary-500 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="relative z-10">
              {children}
            </div>

            {/* Decorative Background Elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-100/30 rounded-full blur-3xl -z-1" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary-100/30 rounded-full blur-3xl -z-1" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
