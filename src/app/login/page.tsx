'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import Link from 'next/link';
import { Mail, Lock, Sparkles, Heart } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to login');
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
      <AnimatedBackground motif="hearts" intensity="low" />
      <GlassCard className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <motion.div
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ delay: 0.2, type: 'spring' }}
             className="mx-auto w-16 h-16 bg-gradient-to-br from-romantic-pink to-romantic-lavender text-white rounded-full flex items-center justify-center mb-4 glow-pink"
          >
            <Sparkles size={32} />
          </motion.div>
          <h1 className="text-heading-lg font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-romantic-pink to-romantic-lavender drop-shadow-sm">
            Welcome Back
          </h1>
          <p className="text-gray-500 mt-2 font-medium text-sm">Sign in to continue your journey</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
              className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-pink-50 bg-white/80 focus:border-romantic-pink focus:outline-none focus:ring-4 focus:ring-romantic-pink/10 transition-all text-gray-700 shadow-inner"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-pink-50 bg-white/80 focus:border-romantic-pink focus:outline-none focus:ring-4 focus:ring-romantic-pink/10 transition-all text-gray-700 shadow-inner"
            />
          </div>

          <RomanticButton type="submit" fullWidth loading={loading} className="mt-4">
            Sign In
          </RomanticButton>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/signup" className="text-romantic-pink font-bold hover:underline">
            Create one
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
