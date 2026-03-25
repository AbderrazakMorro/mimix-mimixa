'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/AnimatedBackground';
import GlassCard from '@/components/ui/GlassCard';
import RomanticButton from '@/components/ui/RomanticButton';
import { useBackground } from '@/components/BackgroundContext';
import RelationshipTab from '@/components/RelationshipTab';
import { Camera, Image as ImageIcon, Save, LogOut, CheckCircle2, User, Mail, Shield, Trash2, Eye, EyeOff, Palette, HeartHandshake } from 'lucide-react';

const THEME_PRESETS = [
  { name: 'Aurora', css: 'bg-gradient-to-tr from-romantic-pink to-romantic-lavender', emoji: '🌌' },
  { name: 'Sunset Love', css: 'bg-gradient-to-tr from-romantic-rose to-romantic-peach', emoji: '🌅' },
  { name: 'Soft Dream', css: 'bg-gradient-to-br from-romantic-lavender to-blue-100', emoji: '☁️' },
  { name: 'Midnight', css: 'bg-gradient-to-br from-[#2D1B33] to-[#110810]', emoji: '🌙' },
  { name: 'Peach Blossom', css: 'bg-gradient-to-tr from-orange-50 to-pink-50', emoji: '🌸' },
  { name: 'Classic', css: 'bg-background', emoji: '✨' },
];

type Motif = 'hearts' | 'butterflies' | 'tulips';
type Intensity = 'low' | 'medium' | 'high';

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'partner' | 'theme' | 'settings'>('profile');
  const [bgMotif, setBgMotif] = useState<Motif>('hearts');
  const [bgIntensity, setBgIntensity] = useState<Intensity>('medium');
  const [bgAnimEnabled, setBgAnimEnabled] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagData, setDiagData] = useState<any>(null);
  const { setBackgroundUrl } = useBackground();

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { router.push('/login'); return; }
        const { user: userData } = await res.json();
        setUser(userData);
        if (userData.username) setUsername(userData.username);
        if (userData.avatar_url) setAvatarPreview(userData.avatar_url);
        if (userData.background_url) setBgPreview(userData.background_url);
        setLoading(false);
      } catch { router.push('/login'); }
    }
    loadSession();
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setBackgroundFile(e.target.files[0]);
      setBgPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);
    setError(null);

    let finalAvatarUrl = avatarPreview;
    let finalBgUrl = bgPreview;

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const { data } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        finalAvatarUrl = publicUrl;
      }
    }

    if (backgroundFile) {
      const ext = backgroundFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const { data } = await supabase.storage.from('backgrounds').upload(fileName, backgroundFile, { upsert: true });
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('backgrounds').getPublicUrl(fileName);
        finalBgUrl = publicUrl;
      }
    }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, avatar_url: finalAvatarUrl, background_url: finalBgUrl })
    });

    const body = await res.json();
    setSaving(false);

    if (res.ok) {
      setSavedSuccess(true);
      if (finalBgUrl) setBackgroundUrl(finalBgUrl);
      // Dispatch event to notify Navbar to refresh
      window.dispatchEvent(new Event('userUpdated'));
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      setError(body.error || 'Failed to save profile.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    const res = await fetch('/api/profile', { method: 'DELETE' });
    if (res.ok) {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/signup');
    }
  };
  
  const handleRunDiagnostics = async () => {
    try {
      const res = await fetch('/api/diag/e2ee');
      const data = await res.json();
      setDiagData(data);
    } catch (err) {
      setError('Diagnostics failed');
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-romantic-pink/30 border-t-romantic-pink rounded-full animate-spin" />
      </div>
    );
  }

  const isPreset = bgPreview?.startsWith('PRESET:');
  const presetClass = isPreset ? bgPreview?.split(':')[1] : '';
  const backgroundStyle = (bgPreview && !isPreset)
    ? { backgroundImage: `url(${bgPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } as React.CSSProperties
    : {};

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'partner' as const, label: 'Partner', icon: HeartHandshake },
    { id: 'theme' as const, label: 'Theme', icon: Palette },
    { id: 'settings' as const, label: 'Settings', icon: Shield },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-start md:justify-center p-4 relative overflow-hidden transition-all duration-700 ${isPreset ? presetClass : 'bg-background'}`}
      style={backgroundStyle}
    >
      <AnimatedBackground motif={bgMotif} intensity={bgIntensity} enabled={bgAnimEnabled && (!bgPreview || isPreset)} />

      {bgPreview && !isPreset && <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />}

      {/* Top bar */}
      <div className="w-full max-w-xl flex justify-between items-center mb-4 md:mb-6 relative z-20 mt-2">
        <RomanticButton variant="ghost" onClick={() => router.push('/')} className="text-sm py-2 px-3">
          ← Home
        </RomanticButton>
        <button onClick={handleLogout} className="flex items-center gap-2 glass py-2 px-4 rounded-full text-sm font-semibold text-gray-500 hover:text-rose-500 transition-colors">
          <LogOut size={14} /> Logout
        </button>
      </div>

      <GlassCard strong className="max-w-xl w-full relative z-10 !p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 pb-0 text-center">
          <h1 className="text-heading-md font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-romantic-pink to-romantic-lavender">
            Profile Management
          </h1>
          <p className="text-gray-700 mt-1 text-sm font-bold">Customize your romantic experience</p>
        </div>

        {/* Tab Navigation - Responsive Scroll */}
        <div className="flex gap-1 p-1.5 mx-4 md:mx-6 mt-4 bg-white/50 rounded-2xl overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 shrink-0 px-4 md:px-0 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-romantic-pink shadow-sm glow-pink border border-pink-100'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-8 pt-4 space-y-6">
          <AnimatePresence mode="wait">
            {/* ─── PROFILE TAB ─── */}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="relative group cursor-pointer">
                    <label htmlFor="avatar-upload" className="cursor-pointer block">
                      <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden avatar-glow transition-all ${avatarPreview ? '' : 'bg-gradient-to-br from-romantic-pink to-romantic-peach'}`}>
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Camera size={36} className="text-white/80" />
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={28} className="text-white" />
                      </div>
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  {avatarPreview && (
                    <button type="button" onClick={removeAvatar} className="mt-2 text-[11px] text-gray-600 hover:text-red-500 transition-colors font-bold">
                      Remove avatar
                    </button>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <User size={14} /> Nickname
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="What should your partner call you?"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-pink-50 bg-white/90 focus:border-romantic-pink focus:outline-none focus:ring-4 focus:ring-romantic-pink/10 transition-all text-gray-700 shadow-inner font-medium text-base md:text-lg"
                  />
                </div>

                {/* Email (read-only) */}
                {user?.email && (
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Mail size={14} /> Email
                    </label>
                    <div className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50/80 text-gray-600 font-bold text-sm truncate">
                      {user.email}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── THEME TAB ─── */}
            {activeTab === 'theme' && (
              <motion.div key="theme" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                {/* Theme Presets */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Palette size={14} className="text-romantic-pink" /> Theme Presets
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {THEME_PRESETS.map((theme) => (
                      <motion.button
                        key={theme.name}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setBackgroundFile(null);
                          setBgPreview(theme.name === 'Classic' ? null : 'PRESET:' + theme.css);
                        }}
                        className={`h-16 md:h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                          bgPreview === 'PRESET:' + theme.css || (theme.name === 'Classic' && !bgPreview)
                            ? 'border-romantic-pink shadow-lg glow-pink'
                            : 'border-white/80 hover:border-pink-200 shadow-sm'
                        } ${theme.css}`}
                      >
                        <span className="text-lg">{theme.emoji}</span>
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${
                          theme.name === 'Midnight' ? 'text-white/80' : 'text-white/90 drop-shadow-sm'
                        }`}>
                          {theme.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Custom BG */}
                <div>
                  <div className="relative py-2 flex items-center">
                    <div className="flex-grow border-t border-pink-200/50" />
                    <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-pink-300 uppercase">Or Custom</span>
                    <div className="flex-grow border-t border-pink-200/50" />
                  </div>
                  <label htmlFor="bg-upload" className="flex items-center justify-center gap-3 w-full bg-white border-2 border-dashed border-pink-200 text-romantic-pink font-semibold py-4 px-6 rounded-2xl cursor-pointer hover:bg-pink-50 transition-colors mt-2">
                    <ImageIcon size={20} />
                    {backgroundFile ? 'Photo Selected ✓' : 'Upload Couple Photo'}
                  </label>
                  <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
                </div>

                {/* Animation Controls */}
                <div className="bg-white/60 p-4 rounded-2xl border border-pink-50 space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Eye size={14} /> Animation Settings
                  </h3>

                  {/* Enable/Disable */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-800 font-bold">Background Particles</span>
                    <button type="button" onClick={() => setBgAnimEnabled(!bgAnimEnabled)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${bgAnimEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {bgAnimEnabled ? <><Eye size={12} /> On</> : <><EyeOff size={12} /> Off</>}
                    </button>
                  </div>

                  {/* Motif Selector */}
                  <div>
                    <span className="text-xs text-gray-600 font-bold uppercase tracking-wide">Motif</span>
                    <div className="flex gap-2 mt-1.5">
                      {([['hearts', '❤️'], ['butterflies', '🦋'], ['tulips', '🌷']] as [Motif, string][]).map(([m, icon]) => (
                        <button key={m} type="button" onClick={() => setBgMotif(m)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 ${bgMotif === m ? 'border-romantic-pink bg-pink-100 text-romantic-pink' : 'border-gray-200 text-gray-600 hover:border-pink-300'}`}>
                          {icon} {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intensity */}
                  <div>
                    <span className="text-xs text-gray-600 font-bold uppercase tracking-wide">Intensity</span>
                    <div className="flex gap-2 mt-1.5">
                      {(['low', 'medium', 'high'] as Intensity[]).map((lvl) => (
                        <button key={lvl} type="button" onClick={() => setBgIntensity(lvl)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 capitalize ${bgIntensity === lvl ? 'border-romantic-pink bg-pink-100 text-romantic-pink' : 'border-gray-200 text-gray-600 hover:border-pink-300'}`}>
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── PARTNER TAB ─── */}
            {activeTab === 'partner' && user && (
              <motion.div key="partner" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <RelationshipTab currentUserId={user.id} />
              </motion.div>
            )}

            {/* ─── SETTINGS TAB ─── */}
            {activeTab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                {/* Account Info */}
                <div className="bg-white/60 p-5 rounded-2xl border border-gray-100 space-y-3">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Shield size={14} /> Account</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-bold">Email</span>
                    <span className="text-gray-800 font-bold truncate max-w-[60%]">{user?.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-bold">Member since</span>
                    <span className="text-gray-800 font-bold">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
                  </div>
                </div>

                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-3">
                    <h3 className="text-sm font-bold text-blue-500 flex items-center gap-2">🛡️ E2EE Diagnostics</h3>
                    <p className="text-xs text-gray-500">Check if your secure keys are properly synced with your partner.</p>
                    <button type="button" onClick={handleRunDiagnostics}
                      className="w-full py-3 rounded-xl border-2 border-blue-200 text-blue-500 font-bold text-sm hover:bg-blue-50 transition-colors">
                      Run Check
                    </button>
                    {diagData && (
                      <div className="text-[10px] font-mono bg-white p-2 rounded border border-blue-100 overflow-x-auto">
                        <pre>{JSON.stringify(diagData, null, 2)}</pre>
                      </div>
                    )}
                  </div>

                  {/* Danger Zone */}
                <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100 space-y-3">
                  <h3 className="text-sm font-bold text-red-400 flex items-center gap-2"><Trash2 size={14} /> Danger Zone</h3>
                  <p className="text-xs text-gray-500">Permanently delete your account and all data. This action cannot be undone.</p>
                  
                  {!showDeleteConfirm ? (
                    <button type="button" onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-3 rounded-xl border-2 border-red-200 text-red-400 font-bold text-sm hover:bg-red-50 transition-colors">
                      Delete Account
                    </button>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-xs text-red-500 font-bold">Are you sure? This is permanent!</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors">
                          Cancel
                        </button>
                        <button type="button" onClick={handleDeleteAccount}
                          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">
                          Yes, Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Messages */}
          <AnimatePresence>
            {savedSuccess && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="bg-green-50 text-green-600 p-4 rounded-xl flex items-center justify-center gap-2 font-bold border border-green-200 shadow-sm">
                <CheckCircle2 size={20} /> Profile saved!
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-bold border border-red-200">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save Button */}
          <RomanticButton type="submit" fullWidth loading={saving} disabled={savedSuccess}>
            <Save size={20} /> Save Changes
          </RomanticButton>
        </form>
      </GlassCard>
    </div>
  );
}
