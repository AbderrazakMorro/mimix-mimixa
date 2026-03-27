'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import Link from 'next/link';
import { Mail, Lock, HeartPulse, ShieldAlert } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to sign up');
        setLoading(false);
      } else {
        window.dispatchEvent(new Event('userUpdated'));
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground motif="tulips" intensity="low" />
      <GlassCard className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <motion.div
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ delay: 0.2, type: 'spring' }}
             className="mx-auto w-16 h-16 bg-gradient-to-br from-romantic-lavender to-romantic-peach text-white rounded-full flex items-center justify-center mb-4 glow-lavender"
          >
            <HeartPulse size={32} />
          </motion.div>
          <h1 className="text-heading-lg font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-romantic-lavender to-romantic-peach drop-shadow-sm">
            Create Account
          </h1>
          <p className="text-gray-500 mt-2 font-medium text-sm">Start your romantic journey</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Mail size={20} />
            </div>
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-lavender-50 bg-white/80 focus:border-romantic-lavender focus:outline-none focus:ring-4 focus:ring-romantic-lavender/10 transition-all text-gray-700 shadow-inner"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-lavender-50 bg-white/80 focus:border-romantic-lavender focus:outline-none focus:ring-4 focus:ring-romantic-lavender/10 transition-all text-gray-700 shadow-inner"
            />
          </div>

          <RomanticButton type="submit" fullWidth loading={loading} className="mt-4 bg-gradient-to-r from-romantic-lavender to-romantic-peach glow-lavender">
            Sign Up
          </RomanticButton>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-romantic-lavender font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
