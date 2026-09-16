import React, { useState } from 'react';
import { 
  Key, 
  Lock, 
  User as UserIcon, 
  X, 
  ArrowRight, 
  Loader2, 
  LogOut,
  Mail,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (payload: { username: string; displayName: string; email: string; password: string }) => Promise<void>;
  onSignOut?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onRegister,
  onSignOut
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        await onLogin(username.trim().toLowerCase(), password);
        onClose();
      } else if (mode === 'REGISTER') {
        const mail = email.trim() || `${username.trim().toLowerCase()}@pooku.network`;
        await onRegister({ 
          username: username.trim().toLowerCase(), 
          displayName: displayName.trim() || username.trim(), 
          email: mail, 
          password 
        });
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-text">
      <div 
        id="auth-modal"
        className="w-full max-w-md bg-[#0e1017] border border-[#2e3446] rounded-2xl shadow-2xl overflow-hidden text-[#e2e4e9] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#202534] bg-[#121522] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#f5d58c]">
              <Key className="w-5 h-5 text-[#dfba73]" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-brand text-[#f5d58c]">
                Switch User Profile
              </h3>
              <p className="text-xs text-[#7e8597] font-code">
                Select or switch to another user session
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

        {/* Current User Info */}
        {currentUser && (
          <div className="p-4 bg-[#12141c] border-b border-[#202434] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#c5a059]/30"
              />
              <div>
                <span className="text-xs font-semibold text-[#f0f2f5] block">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] font-code text-[#737a8c]">
                  @{currentUser.username} · Active Session
                </span>
              </div>
            </div>
            {onSignOut && (
              <button
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="px-2.5 py-1 text-[11px] font-code text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded border border-rose-500/30 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-[#1c202d] bg-[#0c0e14] text-xs font-code">
          <button
            onClick={() => {
              setMode('LOGIN');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-center transition-all ${
              mode === 'LOGIN'
                ? 'text-[#f5d58c] border-b-2 border-[#c5a059] bg-[#141722]'
                : 'text-[#7d8495] hover:text-[#d0d5e2]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('REGISTER');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-center transition-all ${
              mode === 'REGISTER'
                ? 'text-[#f5d58c] border-b-2 border-[#c5a059] bg-[#141722]'
                : 'text-[#7d8495] hover:text-[#d0d5e2]'
            }`}
          >
            Register Identity
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-[11px] font-code text-[#73798c] mb-1">
                {mode === 'LOGIN' ? 'Username or Email' : 'Username'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'LOGIN' ? 'handle or email (e.g. operator)' : 'handle (e.g. operator)'}
                className="w-full bg-[#12141c] border border-[#242836] rounded-lg px-3 py-2 text-xs text-[#e2e4e9] focus:outline-none focus:border-[#c5a059] font-code"
              />
            </div>

            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-[11px] font-code text-[#73798c] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-[#12141c] border border-[#242836] rounded-lg px-3 py-2 text-xs text-[#e2e4e9] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-code text-[#73798c] mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="elena@pooku.network"
                    className="w-full bg-[#12141c] border border-[#242836] rounded-lg px-3 py-2 text-xs text-[#e2e4e9] focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-code text-[#73798c] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#12141c] border border-[#242836] rounded-lg px-3 py-2 text-xs text-[#e2e4e9] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-gradient-to-r from-[#dfba73] via-[#c5a059] to-[#9c752b] hover:opacity-95 text-[#0a0c12] rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{mode === 'LOGIN' ? 'Sign In' : 'Create & Authenticate'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
