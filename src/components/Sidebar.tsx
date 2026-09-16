import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  Plus, 
  Users, 
  User as UserIcon, 
  Archive, 
  Settings, 
  Check, 
  CheckCheck, 
  Lock, 
  Circle,
  Radio
} from 'lucide-react';
import { User, Conversation } from '../types';

interface SidebarProps {
  currentUser: User;
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onOpenSettings: () => void;
  onSwitchUserModal: () => void;
  wsConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onOpenNewChat,
  onOpenSettings,
  onSwitchUserModal,
  wsConnected
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'DIRECT' | 'GROUP' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv => {
    // Tab filter
    if (activeTab === 'ARCHIVED') {
      if (!conv.isArchived) return false;
    } else {
      if (conv.isArchived) return false;
      if (activeTab === 'DIRECT' && conv.type !== 'DIRECT') return false;
      if (activeTab === 'GROUP' && conv.type !== 'GROUP') return false;
    }

    // Search filter
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.name.toLowerCase().includes(query) ||
      (conv.lastMessage?.content && conv.lastMessage.content.toLowerCase().includes(query)) ||
      conv.members.some(m => m.displayName.toLowerCase().includes(query) || m.username.toLowerCase().includes(query))
    );
  });

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 3600);

    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffHours < 48) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside 
      id="pooku-left-sidebar" 
      className="w-full h-full flex flex-col bg-[#0e1014] border-r border-[#262830] select-none"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#20222a] flex items-center justify-between bg-[#12141a]/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#dfba73] via-[#c5a059] to-[#876a2b] p-0.5 shadow-md shadow-[#c5a059]/10 flex items-center justify-center">
            <div className="w-full h-full bg-[#0e1014] rounded-[7px] flex items-center justify-center">
              <span className="font-fraktur font-bold text-xl text-[#f5d58c]">P</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0e1014]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-fraktur font-bold text-lg text-[#f5d58c] tracking-wide">POOKU</h1>
              <span className="text-[10px] font-code px-1.5 py-0.2 rounded border border-[#c5a059]/30 text-[#dfba73] bg-[#c5a059]/10">
                CORE·V1
              </span>
            </div>
            <p className="text-[11px] text-[#8e929e] tracking-tight flex items-center gap-1.5 font-medium">
              Network
              <span className="inline-block w-1 h-1 rounded-full bg-[#c5a059]/60" />
              <span className="text-emerald-400/90 font-code text-[10px]">
                {wsConnected ? 'Connected' : 'Connecting...'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-new-conversation"
            onClick={onOpenNewChat}
            title="Create New Conversation"
            className="p-2 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/25 text-[#f5d58c] hover:bg-[#c5a059]/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Status Bar with Persona Switcher */}
      <div className="px-4 py-2.5 bg-[#121418] border-b border-[#20222a] flex items-center justify-between">
        <div 
          onClick={onSwitchUserModal}
          className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0 pr-2"
          title="Click to Switch Persona / Test Distributed Multi-User Real-Time Chat"
        >
          <div className="relative flex-shrink-0">
            <img 
              src={currentUser.avatarUrl} 
              alt={currentUser.displayName}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#c5a059]/40 group-hover:ring-[#f5d58c] transition-all"
            />
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#121418] ${
              currentUser.status === 'online' ? 'bg-emerald-500' : currentUser.status === 'away' ? 'bg-amber-400' : 'bg-zinc-500'
            }`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#f0f2f5] truncate group-hover:text-[#f5d58c] transition-colors">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] font-code px-1 rounded bg-[#20242c] text-[#a5abb8] border border-[#2d323f]">
                {currentUser.role}
              </span>
            </div>
            <p className="text-[10px] text-[#787d8a] truncate font-code">
              @{currentUser.username} · Account & Identity
            </p>
          </div>
        </div>

        <button
          id="btn-sidebar-settings"
          onClick={onOpenSettings}
          className="p-1.5 rounded text-[#787d8a] hover:text-[#e2e4e9] hover:bg-[#1a1d24] transition-colors"
          title="Platform Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#6c7280]" />
          <input
            id="input-search-conversations"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels, members, keys..."
            className="w-full bg-[#14161d] border border-[#242732] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e2e4e9] placeholder-[#5f6575] focus:outline-none focus:border-[#c5a059]/60 transition-colors font-sans"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[10px] text-[#787d8a] hover:text-[#e2e4e9]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3 pb-2 flex items-center gap-1 border-b border-[#1c1e27]">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-1 text-[11px] font-medium rounded transition-all text-center ${
            activeTab === 'ALL' 
              ? 'bg-[#1e222c] text-[#f5d58c] shadow-sm font-semibold border border-[#303544]' 
              : 'text-[#848a99] hover:text-[#cbd0dc] hover:bg-[#161820]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab('DIRECT')}
          className={`flex-1 py-1 text-[11px] font-medium rounded transition-all text-center ${
            activeTab === 'DIRECT' 
              ? 'bg-[#1e222c] text-[#f5d58c] shadow-sm font-semibold border border-[#303544]' 
              : 'text-[#848a99] hover:text-[#cbd0dc] hover:bg-[#161820]'
          }`}
        >
          Direct
        </button>
        <button
          onClick={() => setActiveTab('GROUP')}
          className={`flex-1 py-1 text-[11px] font-medium rounded transition-all text-center ${
            activeTab === 'GROUP' 
              ? 'bg-[#1e222c] text-[#f5d58c] shadow-sm font-semibold border border-[#303544]' 
              : 'text-[#848a99] hover:text-[#cbd0dc] hover:bg-[#161820]'
          }`}
        >
          Groups
        </button>
        <button
          onClick={() => setActiveTab('ARCHIVED')}
          className={`px-2 py-1 text-[11px] font-medium rounded transition-all text-center ${
            activeTab === 'ARCHIVED' 
              ? 'bg-[#1e222c] text-[#f5d58c] shadow-sm font-semibold border border-[#303544]' 
              : 'text-[#848a99] hover:text-[#cbd0dc] hover:bg-[#161820]'
          }`}
          title="Archived channels"
        >
          <Archive className="w-3.5 h-3.5 inline" />
        </button>
      </div>

      {/* Conversations List */}
      <div id="conversation-list" className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="py-12 text-center text-[#636979] text-xs">
            <Shield className="w-6 h-6 mx-auto mb-2 opacity-30 text-[#c5a059]" />
            No conversations located
          </div>
        ) : (
          filteredConversations.map(conv => {
            const isSelected = conv.id === selectedConversationId;
            const otherUser = conv.type === 'DIRECT' 
              ? conv.members.find(m => m.id !== currentUser.id) || conv.members[0]
              : null;
            const isOnline = otherUser?.status === 'online';

            return (
              <div
                id={`conversation-item-${conv.id}`}
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-2.5 rounded-lg flex items-center gap-3 cursor-pointer transition-all border ${
                  isSelected 
                    ? 'bg-[#181b24] border-[#c5a059]/40 shadow-sm' 
                    : 'border-transparent hover:bg-[#13151c] hover:border-[#222530]'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.avatarUrl || otherUser?.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
                    alt={conv.name}
                    className="w-10 h-10 rounded-lg object-cover ring-1 ring-[#2c303d]"
                  />
                  {conv.type === 'DIRECT' ? (
                    <div 
                      className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#0e1014] ${
                        isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
                      }`}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  ) : (
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded bg-[#1c1f28] border border-[#303544]">
                      <Users className="w-2.5 h-2.5 text-[#c5a059]" />
                    </div>
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[#f5d58c]' : 'text-[#eceef2]'}`}>
                      {conv.name}
                    </span>
                    <span className="text-[10px] font-code text-[#6c7280] ml-1 flex-shrink-0">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[#7d8393] truncate pr-1 flex items-center gap-1">
                      {conv.lastMessage?.senderId === currentUser.id && (
                        <span className="text-[#c5a059] flex-shrink-0">
                          {conv.lastMessage.status === 'read' ? (
                            <CheckCheck className="w-3 h-3 text-[#dfba73]" />
                          ) : conv.lastMessage.status === 'delivered' ? (
                            <CheckCheck className="w-3 h-3 text-[#787e8e]" />
                          ) : (
                            <Check className="w-3 h-3 text-[#787e8e]" />
                          )}
                        </span>
                      )}
                      <span className="truncate">
                        {conv.lastMessage?.isDeleted 
                          ? '« Message deleted »'
                          : conv.lastMessage?.content || conv.description || 'Channel open'}
                      </span>
                    </p>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold font-code bg-gradient-to-r from-[#dfba73] to-[#c5a059] text-[#0b0c0e]">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Status & Security Footer */}
      <div className="px-4 py-2.5 bg-[#0a0b0e] border-t border-[#1e2029] flex items-center justify-between text-[11px] text-[#787f91]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-amber-500 animate-pulse'}`} />
          <span className="font-medium text-[#9ca3af]">
            {wsConnected ? 'Network Connected' : 'Syncing...'}
          </span>
        </div>
        <div className="text-[11px] text-[#c5a059] font-medium flex items-center gap-1">
          <Lock className="w-3 h-3 text-[#dfba73]" />
          <span>Encrypted</span>
        </div>
      </div>
    </aside>
  );
};
