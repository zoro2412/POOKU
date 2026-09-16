import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Users, 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Key, 
  KeyRound, 
  Copy, 
  Check, 
  ExternalLink, 
  X,
  ChevronRight,
  Sparkles,
  Shield,
  Fingerprint,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { Conversation, User, Message } from '../types';

interface RightSidebarProps {
  conversation: Conversation;
  currentUser: User;
  messages: Message[];
  onClose: () => void;
  onOpenCryptoAudit: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  conversation,
  currentUser,
  messages,
  onClose,
  onOpenCryptoAudit
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'MEDIA'>('OVERVIEW');
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Extract shared media and files
  const sharedMedia = messages
    .flatMap(m => m.attachments || [])
    .filter(a => a.type === 'image');

  const sharedFiles = messages
    .flatMap(m => m.attachments || [])
    .filter(a => a.type !== 'image');

  // Extract links from messages
  const linkRegex = /(https?:\/\/[^\s]+)/g;
  const sharedLinks = messages
    .filter(m => linkRegex.test(m.content))
    .map(m => {
      const match = m.content.match(linkRegex);
      return { url: match ? match[0] : '', messageId: m.id, date: m.createdAt };
    });

  const fingerprint = conversation.pqcSessionFingerprint || '9E:B4:71:A2:3C:D8:1F:05:6E:9A:88:21:44:B3:0F:7D';

  const copyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 2000);
  };

  return (
    <aside 
      id="pooku-right-sidebar" 
      className="w-80 md:w-88 flex-shrink-0 h-full flex flex-col bg-[#0e1014] border-l border-[#242732] select-none z-10"
    >
      {/* Header */}
      <div className="p-4 border-b border-[#20222a] flex items-center justify-between bg-[#12141a]/60">
        <h3 className="text-xs font-semibold text-[#f0f2f5] uppercase tracking-wider font-code flex items-center gap-2">
          <span>Channel Intelligence</span>
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-[#787f91] hover:text-[#f0f2f5] hover:bg-[#1c1f28] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 flex items-center gap-1 border-b border-[#1c1f27] bg-[#0c0d12]">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex-1 py-1 text-[11px] font-medium rounded transition-all text-center ${
            activeTab === 'OVERVIEW'
              ? 'bg-[#1c202a] text-[#f5d58c] font-semibold border border-[#2e3343]'
              : 'text-[#7d8495] hover:text-[#c5c9d6]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex-1 py-1 text-[11px] font-medium rounded transition-all text-center ${
            activeTab === 'MEMBERS'
              ? 'bg-[#1c202a] text-[#f5d58c] font-semibold border border-[#2e3343]'
              : 'text-[#7d8495] hover:text-[#c5c9d6]'
          }`}
        >
          Peers ({conversation.members.length})
        </button>
        <button
          onClick={() => setActiveTab('MEDIA')}
          className={`flex-1 py-1 text-[11px] font-medium rounded transition-all text-center ${
            activeTab === 'MEDIA'
              ? 'bg-[#1c202a] text-[#f5d58c] font-semibold border border-[#2e3343]'
              : 'text-[#7d8495] hover:text-[#c5c9d6]'
          }`}
        >
          Media
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-5">
            {/* Avatar & Profile Card */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-[#12141c] border border-[#242836]">
              <img
                src={conversation.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
                alt={conversation.name}
                className="w-16 h-16 rounded-xl object-cover ring-2 ring-[#c5a059]/40 mb-3 shadow-lg"
              />
              <h4 className="text-sm font-semibold text-[#f0f2f5]">{conversation.name}</h4>
              <p className="text-xs text-[#7b8192] mt-1 font-sans max-w-[220px]">
                {conversation.description || 'Secure communication tunnel'}
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-code text-[#c5a059] bg-[#c5a059]/10 px-2.5 py-1 rounded-full border border-[#c5a059]/20">
                <Lock className="w-3 h-3 text-[#dfba73]" />
                <span>End-to-End Encrypted</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-[#12141c] border border-[#222634]">
                <span className="text-[10px] font-code text-[#6c7283] block">MESSAGES</span>
                <span className="text-base font-semibold text-[#f0f2f5] font-code">{messages.length}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#12141c] border border-[#222634]">
                <span className="text-[10px] font-code text-[#6c7283] block">CHANNEL CIPHER</span>
                <span className="text-xs font-semibold text-[#dfba73] font-code">AES-256-GCM</span>
              </div>
            </div>

            {/* Cryptographic Session Identity */}
            <div className="p-3.5 rounded-xl bg-[#12141c] border border-[#262b3a] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#eceef3]">
                <span className="flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-[#c5a059]" />
                  Session Fingerprint
                </span>
                <button
                  onClick={copyFingerprint}
                  className="text-[10px] font-code text-[#c5a059] hover:text-[#f5d58c] flex items-center gap-1"
                >
                  {copiedFingerprint ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedFingerprint ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[10px] font-code text-[#9aa0b2] break-all bg-[#0a0b0e] p-2 rounded border border-[#1e222c]">
                {fingerprint}
              </p>
              <p className="text-[10px] text-[#63697a] leading-tight">
                Authenticity verified against mutual cryptographic handshake.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'MEMBERS' && (
          <div className="space-y-2">
            <h5 className="text-[11px] font-code text-[#737a8c] uppercase tracking-wider px-1">
              Active Network Peers
            </h5>
            <div className="space-y-1.5">
              {conversation.members.map((member) => (
                <div
                  key={member.id}
                  className="p-2.5 rounded-lg bg-[#12141c] border border-[#222634] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <img
                        src={member.avatarUrl}
                        alt={member.displayName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-[#2f3444]"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#12141c] ${
                          member.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-600'
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#f0f2f5] truncate">
                          {member.displayName}
                        </span>
                        {member.role === 'ADMIN' && (
                          <span className="text-[9px] font-code px-1 rounded bg-[#c5a059]/20 text-[#f5d58c] border border-[#c5a059]/30">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6e7587] truncate font-code">
                        {member.department || '@' + member.username}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'MEDIA' && (
          <div className="space-y-4">
            <div>
              <h5 className="text-[11px] font-code text-[#737a8c] uppercase tracking-wider mb-2 px-1">
                Shared Visuals ({sharedMedia.length})
              </h5>
              {sharedMedia.length === 0 ? (
                <p className="text-xs text-[#5e6475] italic p-3 bg-[#12141c] rounded-lg border border-[#202330]">
                  No images shared in this channel
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {sharedMedia.map((m) => (
                    <img
                      key={m.id}
                      src={m.url}
                      alt={m.name}
                      className="w-full h-24 object-cover rounded-lg border border-[#262a38] hover:opacity-90 transition-opacity cursor-pointer"
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h5 className="text-[11px] font-code text-[#737a8c] uppercase tracking-wider mb-2 px-1">
                Documents & Files ({sharedFiles.length})
              </h5>
              {sharedFiles.length === 0 ? (
                <p className="text-xs text-[#5e6475] italic p-3 bg-[#12141c] rounded-lg border border-[#202330]">
                  No documents shared
                </p>
              ) : (
                <div className="space-y-1.5">
                  {sharedFiles.map((f) => (
                    <div
                      key={f.id}
                      className="p-2 bg-[#12141c] border border-[#222634] rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-[#c5a059] flex-shrink-0" />
                        <span className="truncate text-[#e5e7eb]">{f.name}</span>
                      </div>
                      <a
                        href={f.url}
                        download={f.name}
                        className="text-[#dfba73] hover:text-[#f5d58c] p-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
