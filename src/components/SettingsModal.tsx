import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Bell, 
  Sliders, 
  User as UserIcon, 
  X, 
  Check, 
  LogOut
} from 'lucide-react';
import { User } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updated: Partial<User>) => Promise<void>;
  onSignOut?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onSignOut
}) => {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>(currentUser.status);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onUpdateUser({
        displayName,
        bio,
        status
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-text">
      <div 
        id="settings-modal"
        className="w-full max-w-xl bg-[#0e1017] border border-[#2e3446] rounded-2xl shadow-2xl overflow-hidden text-[#e2e4e9] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#202534] bg-[#121522] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#f5d58c]">
              <Settings className="w-5 h-5 text-[#dfba73]" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-brand text-[#f5d58c]">
                System Preferences & Identity
              </h3>
              <p className="text-xs text-[#7e8597] font-code">
                Node configuration and user parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#787f92] hover:text-[#e2e4e9] hover:bg-[#1a1e2a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 1. Identity Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h4 className="text-xs font-code font-semibold text-[#f5d58c] uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Node Identity
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-code text-[#73798c] mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#12141c] border border-[#242836] rounded-lg px-3 py-2 text-xs text-[#e2e4e9] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-code text-[#73798c] mb-1">
                  Availability Status
                </label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full bg-[#12141c] border border-[#242836] rounded-lg px-3 py-2 text-xs text-[#e2e4e9] focus:outline-none focus:border-[#c5a059]"
                >
                  <option value="online">Online</option>
                  <option value="away">Away</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-code text-[#73798c] mb-1">
                Role & Responsibility
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#12141c] border border-[#242836] rounded-lg px-3 py-2 text-xs text-[#e2e4e9] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-[#1b1f2c] hover:bg-[#232838] border border-[#2e3448] text-xs font-semibold rounded-lg text-[#f5d58c] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              <span>{isSaving ? 'Updating...' : saveSuccess ? 'Profile Updated' : 'Save Profile Changes'}</span>
            </button>
          </form>

          {/* 2. System Preferences */}
          <div className="space-y-2">
            <h4 className="text-xs font-code font-semibold text-[#f5d58c] uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Runtime Switches
            </h4>

            <label className="p-3 rounded-lg bg-[#12141c] border border-[#222634] flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[#e5e7eb]">
                Auditory Event Signals (Message Received Notification)
              </span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="rounded accent-[#c5a059]"
              />
            </label>
          </div>

          {/* 3. Account Actions */}
          {onSignOut && (
            <div className="pt-2 border-t border-[#202534]">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Disconnect & Sign Out of Identity</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#202534] bg-[#0c0e14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1b1f2c] hover:bg-[#252a3a] text-xs font-medium rounded-lg text-[#cbd0dc] transition-colors"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
