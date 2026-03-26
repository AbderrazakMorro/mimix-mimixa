'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Camera, Save, Loader2, User, Award, Settings as SettingsIcon, Image as ImageIcon, Users, Volume2, VolumeX, Moon, Sun, Heart, Copy, Check, Sparkles, Gamepad2, MessageSquare } from 'lucide-react';
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
      // 1. Resolve partner ID
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

      // 2. Send invite
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
    // We don't have a local setLoadingPartner anymore, so we rely on context loading or just the action
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
    } finally {
      // Loading is handled by context
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

  // Sync state with profile when it loads or when entering edit mode
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
    // Instant save for avatar selection
    await updateProfile({ avatar_url: url, avatar_id: id } as any);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size check (2MB)
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

        {/* Modal */}
        <motion.div
          layoutId="profile-modal"
          initial={{ scale: 0.9, opacity: 0, y: "100%" }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: "100%" }}
          className="relative w-full max-w-4xl bg-white md:bg-white/90 backdrop-blur-xl border-t md:border border-white/40 shadow-2xl rounded-t-[2.5rem] rounded-b-none md:rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[85vh] pb-[env(safe-area-inset-bottom)] z-10"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-full transition-all z-10"
          >
            <X size={24} />
          </button>

          {/* Sidebar */}
          <div className="w-full md:w-1/3 bg-gray-50/50 p-8 border-r border-gray-100 flex flex-col">
            <h2 className="text-3xl font-serif font-bold text-gray-800 mb-8 flex items-center gap-3 font-playfair">
              <User className="text-romantic-pink" />
              My Profile
            </h2>

              <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
              <TabButton
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                icon={<User size={20} />}
                label="Profile Info"
              />
              <TabButton
                active={activeTab === 'partner'}
                onClick={() => setActiveTab('partner')}
                icon={<Heart size={20} />}
                label="Partner"
              />
              <TabButton
                active={activeTab === 'stats'}
                onClick={() => setActiveTab('stats')}
                icon={<Award size={20} />}
                label="Game Stats"
              />
              <TabButton
                active={activeTab === 'settings'}
                onClick={() => setActiveTab('settings')}
                icon={<SettingsIcon size={20} />}
                label="Settings"
              />
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-white/50">
            <div className="max-w-xl mx-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-pink-100 to-rose-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl font-serif text-romantic-pink">
                              {profile?.display_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                        <button
                          onClick={() => setShowAvatarPicker(true)}
                          className="absolute -bottom-3 -right-3 p-3 bg-white text-gray-700 rounded-full shadow-lg border border-gray-100 hover:text-romantic-pink hover:scale-110 transition-all flex items-center justify-center"
                          title="Change Avatar"
                        >
                          <Camera size={18} />
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-3 left-[-12px] p-3 bg-white text-gray-700 rounded-full shadow-lg border border-gray-100 hover:text-romantic-lavender hover:scale-110 transition-all flex items-center justify-center"
                          title="Upload Photo"
                        >
                          <ImageIcon size={18} />
                        </button>
                      </div>
                      {error && <p className="mt-4 text-xs text-red-500 font-bold">{error}</p>}
                      <div className="mt-4 flex flex-col items-center gap-1">
                        <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
                          @{profile?.username}
                        </p>
                        <button 
                          onClick={handleCopyId}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-all text-[10px] text-gray-400 font-bold uppercase tracking-wider"
                        >
                          {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                          {copied ? 'Copied!' : `ID: ${profile?.id?.substring(0, 8)}...`}
                        </button>
                      </div>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-1">Display Name</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-romantic-pink focus:outline-none transition-all"
                            />
                          ) : (
                            <div className="p-3 text-gray-800 font-medium">{profile?.display_name || 'No Name'}</div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-600 mb-1">Pseudo (Username)</label>
                          {isEditing ? (
                            <div className="relative">
                              <span className="absolute left-3 top-3.5 text-gray-400">@</span>
                              <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                className="w-full p-3 pl-8 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-romantic-pink focus:outline-none transition-all"
                              />
                            </div>
                          ) : (
                            <div className="p-3 text-gray-800 font-medium italic">@{profile?.username}</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Bio</label>
                        {isEditing ? (
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            placeholder="A short romantic bio..."
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-romantic-pink focus:outline-none transition-all resize-none"
                          />
                        ) : (
                          <div className="p-3 text-gray-600 italic">
                            {profile?.bio || 'No bio provided yet.'}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end pt-4">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setDisplayName(profile?.display_name || '');
                                setBio(profile?.bio || '');
                              }}
                              className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r from-romantic-pink to-romantic-rose text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                            >
                              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                              Save Changes
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleEditClick}
                            className="px-6 py-2.5 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Edit Profile
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'partner' && (
                  <motion.div
                    key="partner"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-serif font-bold text-gray-800 mb-6">Partner Relationship</h3>
                    
                    {loadingPartner ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-romantic-pink" />
                      </div>
                    ) : relationship ? (
                      <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-[2rem] border border-pink-100">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 rounded-2xl bg-white border-2 border-pink-100 overflow-hidden shrink-0 shadow-sm">
                            {relationship.otherPerson.avatar_url ? (
                              <img src={relationship.otherPerson.avatar_url} alt="Partner" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <Heart className="text-pink-200" size={32} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-800">
                              {relationship.otherPerson.display_name}
                            </h4>
                            <p className="text-gray-500 font-medium italic">@{relationship.otherPerson.username}</p>
                            <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">
                              Connected since {new Date(relationship.created_at).toLocaleDateString()}
                            </p>
                            <div className="mt-4 flex gap-2">
                              <button 
                                onClick={() => sendGameInvite(relationship.otherPerson.id)}
                                className="px-4 py-2 rounded-xl bg-romantic-pink text-white text-xs font-black uppercase tracking-wider shadow-sm hover:scale-105 transition-all flex items-center gap-2 group"
                              >
                                <Gamepad2 size={14} className="group-hover:rotate-12 transition-transform" />
                                Play Game
                              </button>
                              
                              <button 
                                onClick={startChat}
                                className="px-4 py-2 rounded-xl bg-romantic-lavender/10 text-romantic-lavender border-2 border-romantic-lavender/20 text-xs font-black uppercase tracking-wider hover:bg-romantic-lavender/20 transition-all flex items-center gap-2 group"
                              >
                                <MessageSquare size={14} className="group-hover:scale-110 transition-transform" />
                                Whisper
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/60 flex justify-end">
                          <button 
                            onClick={handleDisconnect}
                            className="px-4 py-2 text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                          >
                            Disconnect Partner
                          </button>
                        </div>
                      </div>
                    ) : (sentInvites.length > 0 || incomingInvites.length > 0 || true) && (
                      <div className="space-y-6">
                        {/* Profile Preview Card (Investigate View) - Moved to TOP for visibility */}
                        {previewUser && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-br from-white to-pink-50/30 border-2 border-romantic-pink/10 p-6 rounded-[2.5rem] relative shadow-xl overflow-hidden mb-6"
                          >
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-romantic-pink/5 rounded-full blur-3xl" />
                            <button 
                              onClick={() => setPreviewUser(null)}
                              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all z-10"
                            >
                              <X size={16} />
                            </button>
                            <div className="relative z-10">
                              <div className="flex items-center gap-5 mb-6">
                                <div className="relative">
                                  <div className="w-20 h-20 rounded-[1.5rem] bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                    {previewUser.avatar_url ? (
                                      <img src={previewUser.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : <User size={32} className="text-pink-100" />}
                                  </div>
                                  <div className="absolute -bottom-2 -right-2 bg-romantic-pink text-white p-1.5 rounded-xl shadow-lg border-2 border-white">
                                    <Sparkles size={12} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-serif font-black text-xl text-gray-800">{previewUser.display_name}</h5>
                                    {previewUser.user_stats?.[0]?.games_played > 10 && (
                                      <span className="bg-romantic-rose/10 text-romantic-rose text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-romantic-rose/20">Pro Matcher</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-romantic-pink font-bold">@{previewUser.username}</p>
                                </div>
                              </div>
                              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/50 mb-6">
                                <p className="text-sm text-gray-600 leading-relaxed italic">
                                  "{previewUser.bio || "Searching for their perfect match..."}"
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-pink-50 shadow-sm flex flex-col items-center">
                                  <span className="text-2xl font-black text-gray-800">
                                    {previewUser.user_stats?.[0]?.games_played || 0}
                                  </span>
                                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Games</span>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-pink-50 shadow-sm flex flex-col items-center">
                                  <div className="flex items-baseline gap-0.5">
                                    <span className="text-2xl font-black text-romantic-pink">
                                      {previewUser.user_stats?.[0]?.best_match_percentage || 0}
                                    </span>
                                    <span className="text-sm font-bold text-romantic-pink">%</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-tighter">Best Match</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        {/* Incoming Invites */}
                        {incomingInvites.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Pending Invites</h4>
                            {incomingInvites.map((rel) => (
                              <div key={rel.id} className="bg-white border border-pink-100 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center overflow-hidden border border-pink-100">
                                    {rel.otherPerson.avatar_url ? (
                                      <img src={rel.otherPerson.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : <User size={18} className="text-pink-300" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-700">{rel.otherPerson.display_name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium">@{rel.otherPerson.username} wants to connect</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleViewProfile(rel.otherPerson.id)}
                                    disabled={loadingPreview}
                                    className="px-3 py-1.5 rounded-lg bg-romantic-lavender/10 text-romantic-lavender hover:bg-romantic-lavender/20 transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                                    title="Investigate Profile"
                                  >
                                    {loadingPreview ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <Sparkles size={12} />
                                    )}
                                    Investigate
                                  </button>
                                  <div className="h-4 w-[1px] bg-gray-100 mx-1" />
                                  <button 
                                    onClick={() => handleRespond(rel.id, 'reject')}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <X size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleRespond(rel.id, 'accept')}
                                    className="p-2 bg-romantic-pink text-white rounded-lg hover:scale-105 transition-all shadow-sm"
                                  >
                                    <Heart size={16} fill="currentColor" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}



                        {/* Sent Invites */}
                        {sentInvites.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2">Sent Invitations</h4>
                            {sentInvites.map((rel) => (
                              <div key={rel.id} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-100 grayscale opacity-60">
                                    {rel.otherPerson.avatar_url ? (
                                      <img src={rel.otherPerson.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : <User size={18} className="text-gray-300" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-500">{rel.otherPerson.display_name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium italic">Pending response from @{rel.otherPerson.username}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleRespond(rel.id, 'reject')}
                                  className="text-[10px] font-bold text-gray-400 hover:text-red-400 uppercase tracking-tighter"
                                >
                                  Cancel
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Search/Invite Form */}
                        {!relationship && (
                          <div className="text-center py-8 px-6 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                            <Heart className="mx-auto text-gray-200 mb-4" size={48} />
                            <h4 className="text-lg font-bold text-gray-600 mb-2">Connect with your Soulmate</h4>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">
                              Enter your partner's pseudo to start your romantic journey together.
                            </p>
                            
                            <div className="flex flex-col gap-3 max-w-sm mx-auto">
                              <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-400 text-sm">@</span>
                                <input
                                  type="text"
                                  value={invitePseudo}
                                  onChange={(e) => setInvitePseudo(e.target.value.toLowerCase())}
                                  placeholder="partner_pseudo"
                                  className="w-full p-3.5 pl-10 rounded-2xl border border-gray-200 bg-white focus:ring-2 focus:ring-romantic-pink focus:outline-none transition-all text-sm font-medium"
                                />
                              </div>
                              {inviteError && <p className="text-xs text-red-500 font-bold bg-red-50 py-2 px-4 rounded-lg">{inviteError}</p>}
                              <button 
                                onClick={handleInvite}
                                disabled={inviteLoading || !invitePseudo}
                                className="px-6 py-4 rounded-2xl bg-romantic-pink text-white font-bold text-sm shadow-md hover:shadow-lg hover:glow-pink transition-all flex items-center justify-center gap-2 group"
                              >
                                {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <Users size={18} className="group-hover:scale-110 transition-transform" />}
                                Send Love Invite
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'stats' && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-serif font-bold text-gray-800 mb-6">Your Journey</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-[2rem] border border-pink-100 flex flex-col items-center justify-center text-center text-romantic-pink">
                        <span className="text-4xl font-black mb-2">{stats?.games_played || 0}</span>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Games Played</span>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 rounded-[2rem] border border-purple-100 flex flex-col items-center justify-center text-center text-purple-600">
                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-4xl font-black">{stats?.best_match_percentage || 0}</span>
                          <span className="text-2xl font-bold text-purple-400">%</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Best Match</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    <h3 className="text-xl font-serif font-bold text-gray-800 mb-6 font-playfair">Preferences</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${settings?.sound_enabled ? 'bg-pink-100 text-romantic-pink' : 'bg-gray-200 text-gray-400'}`}>
                            {settings?.sound_enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-700">Sound Effects</h4>
                            <p className="text-xs text-gray-400 font-medium tracking-wide">Gameplay audio and notifications</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => updateSettings({ sound_enabled: !settings?.sound_enabled })}
                          className={`w-14 h-8 rounded-full relative transition-all ${settings?.sound_enabled ? 'bg-romantic-pink' : 'bg-gray-300'}`}
                        >
                          <motion.div 
                            animate={{ x: settings?.sound_enabled ? 28 : 4 }}
                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm" 
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${settings?.theme === 'dark' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-500'}`}>
                            {settings?.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-700">Dark Mode</h4>
                            <p className="text-xs text-gray-400 font-medium tracking-wide">Sleek dark theme for night sessions</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => updateSettings({ theme: settings?.theme === 'dark' ? 'light' : 'dark' })}
                          className={`w-14 h-8 rounded-full relative transition-all ${settings?.theme === 'dark' ? 'bg-purple-500' : 'bg-gray-300'}`}
                        >
                          <motion.div 
                            animate={{ x: settings?.theme === 'dark' ? 28 : 4 }}
                            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm" 
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Avatar Picker Modal - Renders on top of Profile Modal */}
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

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
        active
          ? 'bg-white text-romantic-pink shadow-sm border border-pink-100'
          : 'text-gray-600 hover:bg-gray-100/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
