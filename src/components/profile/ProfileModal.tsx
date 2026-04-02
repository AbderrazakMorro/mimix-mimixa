'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Camera, Save, Loader2, User, Award, Settings as SettingsIcon, Image as ImageIcon, Users, Volume2, VolumeX, Moon, Sun, Heart, Copy, Check, Sparkles, Gamepad2, MessageSquare, ChevronRight, Edit3, Shield } from 'lucide-react';
import { useProfile, ProfileSettings } from '@/contexts/ProfileContext';
import AvatarPicker from './AvatarPicker';

export default function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { 
    profile, 
    settings, 
    stats, 
    relationship, 
    incomingInvites, 
    sentInvites, 
    updateProfile, 
    updateSettings, 
    refreshProfile,
    loading,
    sendGameInvite
  } = useProfile();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'partner' | 'stats' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Partner/Invite State
  const [invitePseudo, setInvitePseudo] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewUser, setPreviewUser] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  const loadingPartner = loading;

  const handleCopyId = () => {
    if (profile?.id) {
      navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (activeTab === 'partner') {
      refreshProfile();
      setInviteError(null);
      setInvitePseudo('');
    }
  }, [activeTab, refreshProfile]);

  const handleInvite = async () => {
    if (!invitePseudo.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      let partnerId = '';
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invitePseudo.trim());
      
      if (isUUID) {
        partnerId = invitePseudo.trim();
      } else {
        const searchRes = await fetch(`/api/profile?username=${invitePseudo.trim()}`);
        if (!searchRes.ok) {
          setInviteError('User not found. Check the pseudo or use an ID.');
          setInviteLoading(false);
          return;
        }
        const { user: partnerUser } = await searchRes.json();
        partnerId = partnerUser.id;
      }

      const inviteRes = await fetch('/api/relationships/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: partnerId })
      });

      if (inviteRes.ok) {
        setInvitePseudo('');
        alert('Invite sent! Your partner needs to accept it.');
        refreshProfile();
      } else {
        const errData = await inviteRes.json();
        setInviteError(errData.error || 'Failed to send invite.');
      }
    } catch (err) {
      setInviteError('Something went wrong.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRespond = async (relId: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/relationships/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationship_id: relId, action })
      });
      if (res.ok) {
        refreshProfile();
      }
    } catch (err) {
      console.error('Failed to respond to invite:', err);
    }
  };

  const handleDisconnect = async () => {
    if (!relationship) return;
    if (!confirm('Are you sure you want to disconnect from your partner?')) return;
    handleRespond(relationship.id, 'reject');
  };

  const handleViewProfile = async (userId: string) => {
    if (!userId) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/profile?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch preview profile:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const startChat = async () => {
    if (!relationship?.otherPerson?.id) return;
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'private', partner_id: relationship.otherPerson.id })
      });
      if (res.ok) {
        const { conversation } = await res.json();
        onClose();
        router.push(`/chat?id=${conversation.id}`);
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  };

  useEffect(() => {
    if (profile && !isEditing) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile, isEditing]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const handleEditClick = () => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const success = await updateProfile({
      display_name: displayName,
      username: username,
      bio: bio,
    });
    setSaving(false);
    if (success) {
      setIsEditing(false);
    } else {
      setError('Failed to update profile. Pseudo might be taken or invalid.');
    }
  };

  const handleAvatarSelect = async (url: string, id?: string) => {
    await updateProfile({ avatar_url: url, avatar_id: id } as any);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo is too large (max 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setSaving(true);
      await updateProfile({ avatar_url: base64String });
      setSaving(false);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const connectionLevel = stats?.best_match_percentage || 0;

  /* ─── Tab items for the sidebar/mobile nav ─── */
  const tabs = [
    { key: 'profile' as const, icon: User, label: 'Profile Info' },
    { key: 'partner' as const, icon: Heart, label: 'Partner' },
    { key: 'stats' as const, icon: Award, label: 'Game Stats' },
    { key: 'settings' as const, icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* ═══════════════════════════════════════
            MODAL CONTAINER
            ═══════════════════════════════════════ */}
        <motion.div
          layoutId="profile-modal"
          initial={{ scale: 0.95, opacity: 0, y: '100%' }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-5xl bg-[#FFF5F7] md:bg-[#FFF5F7]/95 backdrop-blur-xl border-t md:border border-white/40 shadow-2xl rounded-t-[2rem] md:rounded-[2.5rem] overflow-hidden h-[92vh] md:h-auto md:max-h-[88vh] pb-[env(safe-area-inset-bottom)] z-10"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/80 rounded-full transition-all z-20"
          >
            <X size={20} />
          </button>

          {/* ══════════════════════════════
              MOBILE LAYOUT
              ══════════════════════════════ */}
          <div className="md:hidden flex flex-col h-full overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex flex-col items-center pt-6 pb-4 px-5 shrink-0">
              {/* Brand */}
              <div className="flex items-center gap-1.5 mb-4">
                <Heart size={14} fill="#E8677D" className="text-[#E8677D]" />
                <span className="text-[12px] font-bold text-[#E8677D] uppercase tracking-[0.15em]">The Intimate Canvas</span>
              </div>

              {/* Avatar */}
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F8D0D8] to-[#E8A8B8] p-[3px] shadow-lg">
                  <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-serif text-[#E8677D]">
                        {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute bottom-0 right-0 p-2 bg-white text-[#9A2943] rounded-full shadow-md border border-pink-100 hover:scale-110 transition-all"
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Name & Username */}
              <h2 className="text-xl font-bold text-[#2D2D2D]">{profile?.display_name || 'Your Name'}</h2>
              <p className="text-[13px] text-[#A0A0A0] font-medium">@{profile?.username}</p>

              {/* Connection Level */}
              {connectionLevel > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Heart size={12} fill="#E8677D" className="text-[#E8677D]" />
                  <span className="text-[12px] font-bold text-[#E8677D]">{connectionLevel}% Connection Level</span>
                </div>
              )}
            </div>

            {/* Bio Card (Mobile) */}
            <div className="mx-4 mb-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9A2943]">Digital Sanctuary Bio</span>
                <button onClick={handleEditClick} className="text-[#E8677D] p-1 hover:bg-pink-50 rounded-lg transition-colors">
                  <Edit3 size={14} />
                </button>
              </div>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Write your intimate bio..."
                  className="w-full p-2 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#E8677D]/20 focus:outline-none text-[13px] text-gray-600 italic resize-none"
                />
              ) : (
                <p className="text-[13px] text-gray-600 italic leading-relaxed">
                  &quot;{profile?.bio || 'Creating a space where every word feels like a soft breath and every shared moment is a stroke on our private canvas.'}&quot;
                </p>
              )}
            </div>

            {/* Navigation Items (Mobile) */}
            <div className="mx-4 mb-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/80 overflow-hidden shadow-sm">
              {tabs.map((tab, i) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
                    i > 0 ? 'border-t border-gray-100/50' : ''
                  } ${activeTab === tab.key ? 'bg-[#E8677D]/5' : 'hover:bg-white/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${activeTab === tab.key ? 'bg-[#E8677D]/10 text-[#E8677D]' : 'bg-gray-100 text-gray-400'}`}>
                      <tab.icon size={16} />
                    </div>
                    <span className={`text-[14px] font-semibold ${activeTab === tab.key ? 'text-[#2D2D2D]' : 'text-gray-500'}`}>{tab.label}</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </button>
              ))}
            </div>

            {/* Tab Content (Mobile) */}
            <div className="mx-4 mb-4 flex-1">
              <AnimatePresence mode="wait">
                <TabContent
                  key={activeTab}
                  activeTab={activeTab}
                  profile={profile}
                  stats={stats}
                  settings={settings}
                  relationship={relationship}
                  incomingInvites={incomingInvites}
                  sentInvites={sentInvites}
                  isEditing={isEditing}
                  displayName={displayName}
                  username={username}
                  bio={bio}
                  error={error}
                  saving={saving}
                  invitePseudo={invitePseudo}
                  inviteLoading={inviteLoading}
                  inviteError={inviteError}
                  loadingPartner={loadingPartner}
                  previewUser={previewUser}
                  loadingPreview={loadingPreview}
                  copied={copied}
                  setDisplayName={setDisplayName}
                  setUsername={setUsername}
                  setBio={setBio}
                  setInvitePseudo={setInvitePseudo}
                  handleSave={handleSave}
                  handleEditClick={handleEditClick}
                  handleCopyId={handleCopyId}
                  handleInvite={handleInvite}
                  handleRespond={handleRespond}
                  handleDisconnect={handleDisconnect}
                  handleViewProfile={handleViewProfile}
                  setPreviewUser={setPreviewUser}
                  setIsEditing={setIsEditing}
                  startChat={startChat}
                  sendGameInvite={sendGameInvite}
                  updateSettings={updateSettings}
                  setShowAvatarPicker={() => setShowAvatarPicker(true)}
                  fileInputRef={fileInputRef}
                  showAvatarSection={false}
                />
              </AnimatePresence>
            </div>

            {/* Save Button (Mobile) */}
            {isEditing && (
              <div className="mx-4 mb-6 shrink-0">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E8677D] to-[#F08090] text-white font-bold text-sm shadow-lg shadow-[#E8677D]/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* ══════════════════════════════
              DESKTOP LAYOUT
              ══════════════════════════════ */}
          <div className="hidden md:flex h-full max-h-[88vh]">
            {/* Left Panel — Avatar & Bio */}
            <div className="w-[55%] p-8 lg:p-12 overflow-y-auto">
              {/* Avatar Section */}
              <div className="mb-6">
                <div className="relative inline-block">
                  <div className="w-36 h-36 lg:w-44 lg:h-44 rounded-full bg-gradient-to-br from-[#2D2D2D] to-[#1a1a1a] p-[3px] shadow-xl">
                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl font-serif text-[#E8677D]">
                          {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <button
                    onClick={() => setShowAvatarPicker(true)}
                    className="absolute bottom-2 right-2 p-2.5 bg-[#E8677D] text-white rounded-full shadow-lg hover:scale-110 transition-all border-3 border-white"
                  >
                    <Camera size={16} />
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="mb-6">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="text-3xl lg:text-4xl font-bold text-[#2D2D2D] bg-transparent border-b-2 border-[#E8677D]/30 focus:border-[#E8677D] focus:outline-none pb-1 w-full"
                      placeholder="Display Name"
                    />
                    <div className="relative">
                      <span className="absolute left-0 top-0 text-[#A0A0A0] text-lg">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                        className="text-lg text-[#A0A0A0] bg-transparent border-b border-gray-200 focus:border-[#E8677D] focus:outline-none pb-1 pl-5 w-full"
                        placeholder="username"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl lg:text-4xl font-bold text-[#2D2D2D] leading-tight">{profile?.display_name || 'Your Name'}</h1>
                    <p className="text-[15px] text-[#A0A0A0] font-medium mt-1">@{profile?.username}</p>
                  </>
                )}
                {error && <p className="mt-2 text-xs text-red-500 font-bold">{error}</p>}
              </div>

              {/* Bio Section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/80 p-5 lg:p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9A2943]">Digital Sanctuary Bio</span>
                  {!isEditing && (
                    <button onClick={handleEditClick} className="flex items-center gap-1.5 text-[13px] text-[#E8677D] font-semibold hover:text-[#C94A5C] transition-colors">
                      <Edit3 size={13} />
                      Edit
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Exploring the delicate balance between digital connection and personal sanctuary..."
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#E8677D]/20 focus:outline-none text-[14px] text-gray-600 leading-relaxed resize-none"
                  />
                ) : (
                  <p className="text-[14px] text-gray-600 leading-relaxed">
                    {profile?.bio || 'Exploring the delicate balance between digital connection and personal sanctuary. Lover of twilight walks, vintage canvases, and deep conversations.'} ✨
                  </p>
                )}
              </div>

              {/* Save Button (Desktop) */}
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(profile?.display_name || '');
                      setUsername(profile?.username || '');
                      setBio(profile?.bio || '');
                    }}
                    className="px-6 py-3 rounded-xl font-medium text-gray-500 hover:bg-white/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-8 py-3 rounded-full bg-gradient-to-r from-[#E8677D] to-[#F08090] text-white font-bold text-sm shadow-lg shadow-[#E8677D]/20 hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEditClick}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-[#E8677D] to-[#F08090] text-white font-bold text-sm shadow-lg shadow-[#E8677D]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Save Changes
                </button>
              )}

              {/* Copy ID */}
              <div className="mt-4">
                <button 
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white transition-all text-[10px] text-gray-400 font-bold uppercase tracking-wider border border-gray-100"
                >
                  {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                  {copied ? 'Copied!' : `ID: ${profile?.id?.substring(0, 8)}...`}
                </button>
              </div>
            </div>

            {/* Right Panel — Navigation Card */}
            <div className="w-[45%] p-8 lg:p-12 flex flex-col">
              {/* Sidebar Card */}
              <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/80 shadow-sm p-5 lg:p-6 mb-5 flex-1 overflow-y-auto">
                {/* Card Header */}
                <div className="mb-5">
                  <h3 className="text-[15px] font-bold text-[#9A2943]">The Intimate Canvas</h3>
                  <p className="text-[10px] font-semibold text-[#C4969E] uppercase tracking-[0.12em]">Digital Sanctuary</p>
                </div>

                {/* Tab Navigation */}
                <nav className="space-y-1.5 mb-6">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all ${
                        activeTab === tab.key
                          ? 'bg-gradient-to-r from-[#E8677D] to-[#9B6FB0] text-white shadow-md'
                          : 'text-[#8B7090] hover:bg-white/80'
                      }`}
                    >
                      <tab.icon size={17} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>

                {/* Tab Content (Desktop) */}
                <AnimatePresence mode="wait">
                  <TabContent
                    key={activeTab}
                    activeTab={activeTab}
                    profile={profile}
                    stats={stats}
                    settings={settings}
                    relationship={relationship}
                    incomingInvites={incomingInvites}
                    sentInvites={sentInvites}
                    isEditing={isEditing}
                    displayName={displayName}
                    username={username}
                    bio={bio}
                    error={error}
                    saving={saving}
                    invitePseudo={invitePseudo}
                    inviteLoading={inviteLoading}
                    inviteError={inviteError}
                    loadingPartner={loadingPartner}
                    previewUser={previewUser}
                    loadingPreview={loadingPreview}
                    copied={copied}
                    setDisplayName={setDisplayName}
                    setUsername={setUsername}
                    setBio={setBio}
                    setInvitePseudo={setInvitePseudo}
                    handleSave={handleSave}
                    handleEditClick={handleEditClick}
                    handleCopyId={handleCopyId}
                    handleInvite={handleInvite}
                    handleRespond={handleRespond}
                    handleDisconnect={handleDisconnect}
                    handleViewProfile={handleViewProfile}
                    setPreviewUser={setPreviewUser}
                    setIsEditing={setIsEditing}
                    startChat={startChat}
                    sendGameInvite={sendGameInvite}
                    updateSettings={updateSettings}
                    setShowAvatarPicker={() => setShowAvatarPicker(true)}
                    fileInputRef={fileInputRef}
                    showAvatarSection={false}
                  />
                </AnimatePresence>
              </div>

              {/* Connection Level Card */}
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-sm p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#E8677D]/10">
                    <Sparkles size={20} className="text-[#E8677D]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#C4969E] uppercase tracking-[0.12em]">Connection Level</p>
                    <p className="text-3xl font-black text-[#9A2943]">{connectionLevel}%</p>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-[#E8677D]/20 flex items-center justify-center">
                  <Heart size={20} fill="#E8677D" className="text-[#E8677D]" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Avatar Picker */}
      <AnimatePresence>
        {showAvatarPicker && (
          <AvatarPicker
            currentAvatarUrl={profile?.avatar_url || null}
            onSelect={handleAvatarSelect}
            onClose={() => setShowAvatarPicker(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════
   TAB CONTENT — Shared between mobile & desktop
   ═══════════════════════════════════════════ */
function TabContent({
  activeTab, profile, stats, settings, relationship, incomingInvites, sentInvites,
  isEditing, displayName, username, bio, error, saving,
  invitePseudo, inviteLoading, inviteError, loadingPartner, previewUser, loadingPreview, copied,
  setDisplayName, setUsername, setBio, setInvitePseudo,
  handleSave, handleEditClick, handleCopyId, handleInvite, handleRespond, handleDisconnect,
  handleViewProfile, setPreviewUser, setIsEditing, startChat, sendGameInvite, updateSettings,
  setShowAvatarPicker, fileInputRef, showAvatarSection,
}: any) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {/* ─── PROFILE TAB ─── */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {/* Only show inline edit fields on desktop (mobile edits bio in the card above) */}
          {showAvatarSection && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#9A2943] uppercase tracking-wider mb-1.5">Display Name</label>
                {isEditing ? (
                  <input type="text" value={displayName} onChange={(e: any) => setDisplayName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#E8677D]/20 focus:outline-none text-sm" />
                ) : (
                  <p className="text-sm font-medium text-gray-700 p-3">{profile?.display_name || 'No name'}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#9A2943] uppercase tracking-wider mb-1.5">Username</label>
                <p className="text-sm text-gray-500 font-medium p-3 italic">@{profile?.username}</p>
              </div>
            </div>
          )}
          {/* Quick stats preview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 rounded-xl p-4 border border-white/80 text-center">
              <p className="text-2xl font-black text-[#9A2943]">{stats?.games_played || 0}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Games</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4 border border-white/80 text-center">
              <p className="text-2xl font-black text-[#9B6FB0]">{stats?.best_match_percentage || 0}%</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Best Match</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── PARTNER TAB ─── */}
      {activeTab === 'partner' && (
        <div className="space-y-4">
          {loadingPartner ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[#E8677D]" />
            </div>
          ) : relationship ? (
            <div className="bg-white/60 p-4 rounded-2xl border border-white/80">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F8D0D8] to-[#E8A8B8] p-[2px] shadow-md shrink-0">
                  <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                    {relationship.otherPerson.avatar_url ? (
                      <img src={relationship.otherPerson.avatar_url} alt="Partner" className="w-full h-full object-cover" />
                    ) : (
                      <Heart className="text-pink-200" size={24} />
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <h4 className="text-[15px] font-bold text-[#2D2D2D] truncate">{relationship.otherPerson.display_name}</h4>
                  <p className="text-[12px] text-gray-400 font-medium">@{relationship.otherPerson.username}</p>
                  <p className="text-[10px] text-[#C4969E] mt-0.5 font-semibold">
                    Since {new Date(relationship.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => sendGameInvite(relationship.otherPerson.id)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[#E8677D] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
                >
                  <Gamepad2 size={13} /> Play
                </button>
                <button
                  onClick={startChat}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[#9B6FB0]/10 text-[#9B6FB0] border border-[#9B6FB0]/20 text-[11px] font-bold uppercase tracking-wider hover:bg-[#9B6FB0]/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={13} /> Whisper
                </button>
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full text-center text-[10px] font-bold text-red-400 hover:text-red-500 uppercase tracking-widest py-2 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              {previewUser && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/80 p-4 rounded-2xl border border-pink-100 relative">
                  <button onClick={() => setPreviewUser(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-pink-100 overflow-hidden shadow-sm">
                      {previewUser.avatar_url ? <img src={previewUser.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-pink-200 m-auto mt-3" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-[14px] text-gray-800">{previewUser.display_name}</h5>
                      <p className="text-[11px] text-[#E8677D]">@{previewUser.username}</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-500 italic mb-3">&quot;{previewUser.bio || 'No bio yet'}&quot;</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-pink-50 p-2.5 rounded-xl text-center">
                      <p className="text-lg font-black text-gray-800">{previewUser.user_stats?.[0]?.games_played || 0}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Games</p>
                    </div>
                    <div className="bg-pink-50 p-2.5 rounded-xl text-center">
                      <p className="text-lg font-black text-[#E8677D]">{previewUser.user_stats?.[0]?.best_match_percentage || 0}%</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">Best Match</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Incoming Invites */}
              {incomingInvites.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Pending Invites</h4>
                  {incomingInvites.map((rel: any) => (
                    <div key={rel.id} className="bg-white/80 border border-pink-100 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center overflow-hidden border border-pink-100 shrink-0">
                          {rel.otherPerson.avatar_url ? <img src={rel.otherPerson.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={14} className="text-pink-300" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-gray-700 truncate">{rel.otherPerson.display_name}</p>
                          <p className="text-[10px] text-gray-400">@{rel.otherPerson.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleViewProfile(rel.otherPerson.id)} disabled={loadingPreview} className="p-1.5 text-[#9B6FB0] hover:bg-purple-50 rounded-lg transition-all">
                          {loadingPreview ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        </button>
                        <button onClick={() => handleRespond(rel.id, 'reject')} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                        <button onClick={() => handleRespond(rel.id, 'accept')} className="p-1.5 bg-[#E8677D] text-white rounded-lg hover:scale-105 transition-all"><Heart size={12} fill="currentColor" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sent Invites */}
              {sentInvites.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Sent</h4>
                  {sentInvites.map((rel: any) => (
                    <div key={rel.id} className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-100 grayscale opacity-60 shrink-0">
                          {rel.otherPerson.avatar_url ? <img src={rel.otherPerson.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={14} className="text-gray-300" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-gray-500 truncate">{rel.otherPerson.display_name}</p>
                          <p className="text-[10px] text-gray-400 italic">Pending</p>
                        </div>
                      </div>
                      <button onClick={() => handleRespond(rel.id, 'reject')} className="text-[10px] font-bold text-gray-400 hover:text-red-400 uppercase">Cancel</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Invite Form */}
              <div className="text-center py-4 px-3 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                <Heart className="mx-auto text-gray-200 mb-3" size={36} />
                <h4 className="text-[14px] font-bold text-gray-600 mb-1">Connect with your Soulmate</h4>
                <p className="text-[12px] text-gray-400 mb-4">Enter your partner&#39;s pseudo to start your romantic journey.</p>
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400 text-sm">@</span>
                    <input
                      type="text"
                      value={invitePseudo}
                      onChange={(e: any) => setInvitePseudo(e.target.value.toLowerCase())}
                      placeholder="partner_pseudo"
                      className="w-full p-3 pl-8 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#E8677D]/20 focus:outline-none text-sm font-medium"
                    />
                  </div>
                  {inviteError && <p className="text-[11px] text-red-500 font-bold bg-red-50 py-1.5 px-3 rounded-lg">{inviteError}</p>}
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading || !invitePseudo}
                    className="w-full px-4 py-3 rounded-xl bg-[#E8677D] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                    Send Love Invite
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STATS TAB ─── */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-5 rounded-2xl border border-pink-100 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-[#E8677D] mb-1">{stats?.games_played || 0}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Games Played</span>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 rounded-2xl border border-purple-100 flex flex-col items-center justify-center text-center">
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="text-3xl font-black text-[#9B6FB0]">{stats?.best_match_percentage || 0}</span>
                <span className="text-xl font-bold text-[#9B6FB0]/60">%</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Best Match</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── SETTINGS TAB ─── */}
      {activeTab === 'settings' && (
        <div className="space-y-3">
          {/* Sound */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white/80">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${settings?.sound_enabled ? 'bg-pink-100 text-[#E8677D]' : 'bg-gray-100 text-gray-400'}`}>
                {settings?.sound_enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-gray-700">Sound Effects</h4>
                <p className="text-[10px] text-gray-400">Audio & notifications</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ sound_enabled: !settings?.sound_enabled })}
              className={`w-12 h-7 rounded-full relative transition-all ${settings?.sound_enabled ? 'bg-[#E8677D]' : 'bg-gray-300'}`}
            >
              <motion.div animate={{ x: settings?.sound_enabled ? 22 : 3 }} className="absolute top-[3px] w-[20px] h-[20px] bg-white rounded-full shadow-sm" />
            </button>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white/80">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${settings?.theme === 'dark' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                {settings?.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-gray-700">Dark Mode</h4>
                <p className="text-[10px] text-gray-400">Night theme</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ theme: settings?.theme === 'dark' ? 'light' : 'dark' })}
              className={`w-12 h-7 rounded-full relative transition-all ${settings?.theme === 'dark' ? 'bg-purple-500' : 'bg-gray-300'}`}
            >
              <motion.div animate={{ x: settings?.theme === 'dark' ? 22 : 3 }} className="absolute top-[3px] w-[20px] h-[20px] bg-white rounded-full shadow-sm" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
