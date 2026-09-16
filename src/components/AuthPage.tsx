import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Mail, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Sparkles,
  CheckCircle2,
  KeyRound,
  Terminal,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface AuthPageProps {
  onAuthSuccess: (user: UserType, token: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = username.trim();
    if (!cleanInput || !password.trim()) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    if (mode === 'REGISTER' && !displayName.trim()) {
      setErrorMessage('Please provide a display name.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'LOGIN') {
        const res = await api.login(cleanInput.toLowerCase(), password);
        onAuthSuccess(res.user, res.accessToken);
      } else {
        const emailAddress = email.trim() || (cleanInput.includes('@') ? cleanInput : `${cleanInput.toLowerCase()}@pooku.network`);
        const cleanUser = cleanInput.includes('@') ? cleanInput.split('@')[0] : cleanInput;
        const res = await api.register({
          username: cleanUser.toLowerCase(),
          displayName: displayName.trim(),
          email: emailAddress,
          password: password
        });
        onAuthSuccess(res.user, res.accessToken);
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication error. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAccess = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await api.quickLogin();
      onAuthSuccess(res.user, res.accessToken);
    } catch (err: any) {
      setErrorMessage(err.message || 'Instant sign-in temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="pooku-auth-gate"
      className="min-h-screen w-full bg-[#08090d] text-[#e2e4e9] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none"
    >
      {/* Subtle architectural background textures */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#1f1910]/30 via-[#08090d]/80 to-[#06070a] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#dfba73 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Decorative top ambient bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c5a059]/40 to-transparent" />

      {/* Central Identity Terminal */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfba73] via-[#c5a059] to-[#7d6024] p-[1.5px] shadow-xl shadow-[#c5a059]/10">
              <div className="w-full h-full bg-[#0e1017] rounded-[14px] flex items-center justify-center">
                <span className="font-fraktur font-bold text-3xl text-[#f5d58c]">
                  P
                </span>
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#08090d]" />
          </div>

          <h1 className="font-fraktur text-4xl font-bold text-[#f5d58c] tracking-wide drop-shadow-md">
            POOKU
          </h1>
          <p className="text-xs text-[#8c94a6] font-code tracking-wider mt-1.5 uppercase">
            Distributed Real-Time Messaging Platform
          </p>
        </div>

        {/* Card Surface */}
        <div className="bg-[#0e1017]/90 border border-[#262b3a] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Tabs */}
          <div className="flex border-b border-[#212634] mb-6 font-code text-xs">
            <button
              id="btn-tab-login"
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-3 text-center transition-all relative font-medium cursor-pointer ${
                mode === 'LOGIN'
                  ? 'text-[#f5d58c]'
                  : 'text-[#6f7688] hover:text-[#c4c9d6]'
              }`}
            >
              Sign In
              {mode === 'LOGIN' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#dfba73] to-[#c5a059]" />
              )}
            </button>

            <button
              id="btn-tab-register"
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-3 text-center transition-all relative font-medium cursor-pointer ${
                mode === 'REGISTER'
                  ? 'text-[#f5d58c]'
                  : 'text-[#6f7688] hover:text-[#c4c9d6]'
              }`}
            >
              Register Identity
              {mode === 'REGISTER' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#dfba73] to-[#c5a059]" />
              )}
            </button>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{errorMessage}</span>
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('REGISTER');
                      setErrorMessage(null);
                    }}
                    className="block text-[11px] text-[#dfba73] hover:underline font-code cursor-pointer mt-1"
                  >
                    Need to create a new profile? Switch to Register
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <div>
                <label className="block text-[11px] font-code uppercase tracking-wider text-[#798094] mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#646b7e]" />
                  <input
                    id="input-auth-display-name"
                    type="text"
                    required
                    placeholder="e.g. Elena Rostova"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#12141c] border border-[#252a38] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#f0f2f5] placeholder-[#555c6d] focus:outline-none focus:border-[#c5a059] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-code uppercase tracking-wider text-[#798094] mb-1.5">
                {mode === 'LOGIN' ? 'Username or Email' : 'Username'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-[#646b7e] font-code">@</span>
                <input
                  id="input-auth-username"
                  type="text"
                  required
                  autoCapitalize="none"
                  placeholder={mode === 'LOGIN' ? 'handle or email (e.g. operator)' : 'handle (e.g. operator)'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#12141c] border border-[#252a38] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-[#f0f2f5] placeholder-[#555c6d] focus:outline-none focus:border-[#c5a059] transition-colors font-code"
                />
              </div>
            </div>

            {mode === 'REGISTER' && (
              <div>
                <label className="block text-[11px] font-code uppercase tracking-wider text-[#798094] mb-1.5">
                  Email <span className="text-[#555c6d] lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#646b7e]" />
                  <input
                    id="input-auth-email"
                    type="email"
                    placeholder="identity@pooku.network"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#12141c] border border-[#252a38] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#f0f2f5] placeholder-[#555c6d] focus:outline-none focus:border-[#c5a059] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-code uppercase tracking-wider text-[#798094] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#646b7e]" />
                <input
                  id="input-auth-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#12141c] border border-[#252a38] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#f0f2f5] placeholder-[#555c6d] focus:outline-none focus:border-[#c5a059] transition-colors"
                />
              </div>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#dfba73] via-[#c5a059] to-[#a07d32] text-[#0a0b0e] font-semibold text-xs tracking-wide flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-[#c5a059]/15 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0a0b0e]" />
              ) : (
                <>
                  <span>{mode === 'LOGIN' ? 'Enter POOKU Network' : 'Create & Authenticate Identity'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Instant Quick Demo Sign In */}
          <div className="relative my-4 pt-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#202534]" />
            </div>
            <div className="relative flex justify-center text-[10px] font-code uppercase">
              <span className="bg-[#0e1017] px-2 text-[#646b7e]">Or Instant Access</span>
            </div>
          </div>

          <button
            id="btn-quick-sign-in"
            type="button"
            onClick={handleQuickAccess}
            disabled={isLoading}
            className="w-full py-2.5 px-3 bg-[#131622] hover:bg-[#1c2132] border border-[#262c3e] rounded-xl text-xs font-code text-[#f5d58c] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#dfba73]" />
            <span>Instant Demo Sign In (1-Click)</span>
          </button>

          {/* Subtle footer */}
          <div className="mt-6 pt-4 border-t border-[#1c202b] flex items-center justify-between text-[10px] font-code text-[#626879]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Network: Online</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Encrypted Session</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
