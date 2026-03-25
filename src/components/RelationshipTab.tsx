'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, UserPlus, Check, X, Heart, AlertCircle } from 'lucide-react';
import RomanticButton from '@/components/ui/RomanticButton';

export default function RelationshipTab({ currentUserId }: { currentUserId: string }) {
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteId, setInviteId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const fetchRelationships = async () => {
    try {
      const res = await fetch('/api/relationships/me');
      if (res.ok) {
        const data = await res.json();
        setRelationships(data.relationships || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, []);

  const handleInvite = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!inviteId.trim()) return;
    setInviting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/relationships/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: inviteId.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Invite sent successfully!' });
        setInviteId('');
        fetchRelationships();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send invite' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setInviting(false);
    }
  };

  const handleRespond = async (id: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch('/api/relationships/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationship_id: id, action })
      });
      if (res.ok) {
        fetchRelationships();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || `Failed to ${action} invite` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600 font-bold animate-pulse">Loading connections...</div>;
  }

  const active = relationships.find(r => r.status === 'accepted');
  const pendingReceived = relationships.filter(r => r.status === 'pending' && !r.isInviter);
  const pendingSent = relationships.filter(r => r.status === 'pending' && r.isInviter);

  const copyMyId = () => {
    navigator.clipboard.writeText(currentUserId);
    setMessage({ type: 'success', text: 'Your ID copied to clipboard!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {message && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className={`px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold ${
            message.type === 'error' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'
          }`}>
          {message.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          {message.text}
        </motion.div>
      )}

      {/* Connection Section */}
      <div className="bg-white/90 p-5 rounded-2xl border border-pink-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Heart size={16} className="text-romantic-pink" /> 
          {active ? 'Your Soulmate' : 'Find Your Partner'}
        </h3>

        {active ? (
          <div className="flex items-center gap-4 bg-white/80 p-4 rounded-xl border border-pink-200">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-romantic-pink shadow-md">
              {active.otherPerson.avatar_url ? (
                <img src={active.otherPerson.avatar_url} alt="Partner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center text-white">
                  <Heart size={24} />
                </div>
              )}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">{active.otherPerson.username || 'Partner'}</p>
              <p className="text-xs text-gray-600 font-bold">Connected since {new Date(active.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                Send an Invite Link
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter Partner's ID..."
                  value={inviteId}
                  onChange={(e) => setInviteId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite(e)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-pink-200 bg-white focus:border-romantic-pink focus:outline-none focus:ring-4 focus:ring-romantic-pink/10 transition-all text-sm font-bold text-gray-800 placeholder-gray-400"
                />
                <RomanticButton type="button" onClick={handleInvite} disabled={inviting || !inviteId.trim()}>
                  <UserPlus size={16} className="mr-1" /> Invite
                </RomanticButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Your Details */}
      <div className="bg-white/90 p-5 rounded-2xl border border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">Your Shareable ID</p>
          <p className="text-xs font-mono font-bold text-gray-600 mt-1 bg-gray-100 px-2 py-1 rounded inline-block">{currentUserId}</p>
        </div>
        <button onClick={copyMyId} className="text-romantic-pink hover:text-white text-sm font-bold flex items-center gap-1 bg-pink-100 px-3 py-1.5 rounded-full transition-colors hover:bg-romantic-pink">
          <Link2 size={14} /> Copy
        </button>
      </div>

      {/* Pending Invites */}
      <AnimatePresence>
        {pendingReceived.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-2">Pending Requests</h4>
            {pendingReceived.map(req => (
              <div key={req.id} className="bg-white p-4 rounded-xl border border-pink-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden">
                    {req.otherPerson.avatar_url ? <img src={req.otherPerson.avatar_url} alt="" className="w-full h-full object-cover" /> : <Heart size={16} className="text-pink-300" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{req.otherPerson.username || 'Someone'}</p>
                    <p className="text-[10px] text-gray-400">wants to connect</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRespond(req.id, 'accept')} className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors">
                    <Check size={16} />
                  </button>
                  <button onClick={() => handleRespond(req.id, 'reject')} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {pendingSent.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">Sent Invites</h4>
            {pendingSent.map(req => (
              <div key={req.id} className="bg-white/40 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-600">Pending reply from <span className="font-bold">{req.otherPerson.username || 'Partner'}</span></div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
