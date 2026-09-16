import React from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Search, 
  PanelRight, 
  Lock, 
  KeyRound, 
  UserCheck, 
  Users,
  Info,
  ChevronLeft
} from 'lucide-react';
import { Conversation, User } from '../types';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: User;
  onToggleRightSidebar: () => void;
  rightSidebarOpen: boolean;
  onOpenSearch: () => void;
  onOpenPqcDetails: () => void;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUser,
  onToggleRightSidebar,
  rightSidebarOpen,
  onOpenSearch,
  onOpenPqcDetails,
  onBack
}) => {
  const otherUser = conversation.type === 'DIRECT'
    ? conversation.members.find(m => m.id !== currentUser.id) || conversation.members[0]
    : null;

  const isOnline = otherUser?.status === 'online';
  const isQuantumSafe = conversation.encryptionLevel === 'PQC_KYBER_AES_GCM';

  const formatLastSeen = (isoString?: string) => {
    if (!isoString) return 'Active recently';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      id="chat-header" 
      className="h-16 px-4 sm:px-5 border-b border-[#20222a] bg-[#101217]/90 backdrop-blur flex items-center justify-between select-none z-10"
    >
      {/* Left: Mobile Back Button + Avatar & Meta */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {onBack && (
          <button
            id="btn-back-to-channels"
            onClick={onBack}
            className="md:hidden p-2 -ml-2 rounded-lg text-[#8e94a5] hover:text-[#f0f2f5] hover:bg-[#181b22] active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            title="Back to conversations"
            aria-label="Back to conversations"
          >
            <ChevronLeft className="w-5 h-5 text-[#dfba73]" />
          </button>
        )}

        <div className="relative flex-shrink-0">
          <img
            src={conversation.avatarUrl || otherUser?.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
            alt={conversation.name}
            className="w-10 h-10 rounded-lg object-cover ring-1 ring-[#2f3442]"
          />
          {conversation.type === 'DIRECT' ? (
            <div
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#101217] ${
                isOnline ? 'bg-emerald-500 ring-1 ring-emerald-500/30' : 'bg-zinc-600'
              }`}
            />
          ) : (
            <div className="absolute -bottom-1 -right-1 p-0.5 rounded bg-[#1c1f28] border border-[#303544]">
              <Users className="w-2.5 h-2.5 text-[#dfba73]" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#f0f2f5] truncate">
              {conversation.name}
            </h2>
            {conversation.type === 'GROUP' && (
              <span className="text-[10px] font-code px-1.5 py-0.2 rounded bg-[#1c1f28] text-[#8e94a5] border border-[#2b303e]">
                {conversation.members.length} peers
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#787f91]">
            {conversation.type === 'DIRECT' ? (
              <span className="flex items-center gap-1.5 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                {isOnline ? 'Online' : `Last seen ${formatLastSeen(otherUser?.lastSeen)}`}
              </span>
            ) : (
              <span>
                {conversation.members.slice(0, 3).map(m => m.displayName.split(' ')[0]).join(', ')}
                {conversation.members.length > 3 ? ` +${conversation.members.length - 3}` : ''}
              </span>
            )}

            <span className="text-zinc-600">·</span>

            {/* Security Indicator */}
            <div
              className="flex items-center gap-1 font-code text-[10px] text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded border border-[#c5a059]/25"
            >
              <Lock className="w-3 h-3 text-[#dfba73]" />
              <span>Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        <button
          id="btn-search-messages"
          onClick={onOpenSearch}
          className="p-2 rounded-lg text-[#8e94a5] hover:text-[#f0f2f5] hover:bg-[#181b22] active:scale-95 transition-all cursor-pointer"
          title="Search conversation history"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          id="btn-toggle-right-sidebar"
          onClick={onToggleRightSidebar}
          className={`p-2 rounded-lg active:scale-95 transition-all cursor-pointer ${
            rightSidebarOpen 
              ? 'text-[#f5d58c] bg-[#1e222d] border border-[#c5a059]/30' 
              : 'text-[#8e94a5] hover:text-[#f0f2f5] hover:bg-[#181b22]'
          }`}
          title="Conversation metadata & security details"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
