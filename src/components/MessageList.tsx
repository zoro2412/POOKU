import React, { useEffect, useRef, useState } from 'react';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  ShieldCheck, 
  MoreVertical, 
  Reply, 
  Edit3, 
  Trash2, 
  Copy, 
  Smile, 
  FileText, 
  Download, 
  ExternalLink, 
  Lock, 
  KeyRound,
  Eye,
  ChevronDown
} from 'lucide-react';
import { Message, User, TypingState } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  typingUsers: TypingState[];
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onInspectCrypto: (message: Message) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

const COMMON_REACTIONS = ['🛡️', '⚡', '🔥', '✨', '👍', '🚀'];

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  typingUsers,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onInspectCrypto,
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState<string | null>(null);

  useEffect(() => {
    // Smooth scroll down on new messages
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUsers.length]);

  const formatMessageTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (isoString: string) => {
    const d = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages: { date: string; items: Message[] }[] = [];
  let currentDate = '';
  messages.forEach(msg => {
    const dStr = formatDateSeparator(msg.createdAt);
    if (dStr !== currentDate) {
      currentDate = dStr;
      groupedMessages.push({ date: dStr, items: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].items.push(msg);
    }
  });

  return (
    <div 
      id="message-area"
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 relative select-text"
      onClick={() => {
        setActiveActionMenuId(null);
        setActiveReactionPickerId(null);
      }}
    >
      {/* Load More Pagination Button */}
      {hasMore && (
        <div className="flex justify-center pb-2">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-xs font-code text-[#c5a059] bg-[#14161f] border border-[#2b3040] hover:bg-[#1a1e2a] px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
          >
            {isLoadingMore ? 'Querying cursor index...' : 'Load previous messages'}
          </button>
        </div>
      )}

      {groupedMessages.map((group) => (
        <div key={group.date} className="space-y-4">
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <div className="h-[1px] bg-[#222632] flex-1" />
            <span className="px-3 py-1 bg-[#12141a] border border-[#252936] text-[11px] font-code text-[#7d8495] rounded-full mx-4 shadow-sm">
              {group.date}
            </span>
            <div className="h-[1px] bg-[#222632] flex-1" />
          </div>

          {group.items.map((message) => {
            const isMe = message.senderId === currentUser.id;
            const isMenuOpen = activeActionMenuId === message.id;
            const isReactionPickerOpen = activeReactionPickerId === message.id;

            return (
              <div
                id={`message-row-${message.id}`}
                key={message.id}
                className={`group flex items-start gap-3 relative transition-all ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar (for incoming messages) */}
                {!isMe && (
                  <img
                    src={message.sender?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={message.sender?.displayName || 'Peer'}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-[#2c3140] mt-0.5 flex-shrink-0"
                  />
                )}

                {/* Message Bubble Container */}
                <div className={`max-w-[85%] sm:max-w-[70%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name (for group context) */}
                  {!isMe && (
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-[11px] font-semibold text-[#a6adc0]">
                        {message.sender?.displayName || 'Peer'}
                      </span>
                      <span className="text-[10px] font-code text-[#5a6072]">
                        @{message.sender?.username}
                      </span>
                    </div>
                  )}

                  {/* Bubble Card */}
                  <div
                    className={`relative rounded-xl p-3.5 shadow-md border transition-all ${
                      isMe
                        ? 'bg-gradient-to-br from-[#1b1e28] via-[#161822] to-[#12141c] border-[#c5a059]/30 text-[#f3f4f6]'
                        : 'bg-[#151720] border-[#252836] text-[#e5e7eb]'
                    } ${message.isDeleted ? 'opacity-60 italic' : ''}`}
                  >
                    {/* Reply Reference Card */}
                    {message.replyTo && (
                      <div className="mb-2 p-2 rounded-lg bg-[#0e1016]/70 border-l-2 border-[#c5a059] text-[11px] text-[#9ca3af]">
                        <span className="font-semibold text-[#f5d58c] block mb-0.5">
                          {message.replyTo.senderName}
                        </span>
                        <p className="truncate line-clamp-1">{message.replyTo.content}</p>
                      </div>
                    )}

                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {message.attachments.map((att) => (
                          <div key={att.id} className="rounded-lg overflow-hidden border border-[#2b3040]">
                            {att.type === 'image' ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                className="max-h-64 w-full object-cover rounded-md"
                              />
                            ) : (
                              <div className="flex items-center justify-between p-2.5 bg-[#0e1015]">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-[#c5a059] flex-shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-[#f0f2f5] truncate">{att.name}</p>
                                    <span className="text-[10px] text-[#6b7280] font-code">
                                      {(att.size / 1024).toFixed(1)} KB
                                    </span>
                                  </div>
                                </div>
                                <a
                                  href={att.url}
                                  download={att.name}
                                  className="p-1.5 rounded text-[#a5abbc] hover:text-[#f5d58c] hover:bg-[#1a1d28] transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Main Content */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-sans">
                      {message.content}
                    </div>

                    {/* Bottom Metadata: Time, Status, PQC badge */}
                    <div className="flex items-center justify-end gap-2 mt-2 pt-1 border-t border-[#ffffff0a] text-[10px] font-code text-[#73798c]">
                      {message.isEdited && (
                        <span className="text-[#a1a8b8] italic">edited</span>
                      )}

                      {/* Quantum-Safe Verified Indicator */}
                      {message.encryption?.isQuantumSafe && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectCrypto(message);
                          }}
                          className="flex items-center gap-1 text-[#dfba73] hover:text-[#f5d58c] transition-colors cursor-pointer"
                          title="Verified ML-KEM-768 + AES-256-GCM. Click to inspect."
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span className="hidden sm:inline">PQC·R#{message.encryption.ratchetCount}</span>
                        </button>
                      )}

                      <span>{formatMessageTime(message.createdAt)}</span>

                      {/* Delivery Status (for sender) */}
                      {isMe && (
                        <span title={`Status: ${message.status}`}>
                          {message.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#dfba73]" />
                          ) : message.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#73798c]" />
                          ) : message.status === 'sent' ? (
                            <Check className="w-3.5 h-3.5 text-[#73798c]" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Reactions Row */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1 pl-1">
                      {message.reactions.map((reaction) => {
                        const hasReacted = reaction.userIds.includes(currentUser.id);
                        return (
                          <button
                            key={reaction.emoji}
                            onClick={() => onReaction(message.id, reaction.emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-code transition-all ${
                              hasReacted
                                ? 'bg-[#c5a059]/20 text-[#f5d58c] border border-[#c5a059]/40'
                                : 'bg-[#151720] text-[#9ca3af] border border-[#252836] hover:border-[#383d4f]'
                            }`}
                          >
                            <span>{reaction.emoji}</span>
                            <span className="text-[10px]">{reaction.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Floating Action Menu (Triggered on hover) */}
                <div
                  className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 ${
                    isMe ? 'left-4' : 'right-4'
                  } flex items-center gap-0.5 bg-[#12141a]/95 border border-[#2a2e3d] rounded-lg p-1 shadow-lg backdrop-blur z-20`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReply(message);
                    }}
                    className="p-1 rounded text-[#8e94a5] hover:text-[#f5d58c] hover:bg-[#1f222e] transition-colors"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactionPickerId(isReactionPickerOpen ? null : message.id);
                    }}
                    className="p-1 rounded text-[#8e94a5] hover:text-[#f5d58c] hover:bg-[#1f222e] transition-colors"
                    title="React"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(message.content);
                    }}
                    className="p-1 rounded text-[#8e94a5] hover:text-[#f5d58c] hover:bg-[#1f222e] transition-colors"
                    title="Copy Text"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectCrypto(message);
                    }}
                    className="p-1 rounded text-[#dfba73] hover:text-[#f5d58c] hover:bg-[#1f222e] transition-colors"
                    title="Inspect Cryptographic Envelope"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {isMe && !message.isDeleted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(message);
                      }}
                      className="p-1 rounded text-[#8e94a5] hover:text-[#f5d58c] hover:bg-[#1f222e] transition-colors"
                      title="Edit message"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isMe && !message.isDeleted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(message.id);
                      }}
                      className="p-1 rounded text-[#8e94a5] hover:text-rose-400 hover:bg-[#1f222e] transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Reaction Picker Popover */}
                {isReactionPickerOpen && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute z-30 -top-10 ${
                      isMe ? 'left-6' : 'right-6'
                    } flex items-center gap-1 bg-[#12141a] border border-[#303546] rounded-full p-1.5 shadow-xl`}
                  >
                    {COMMON_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          onReaction(message.id, emoji);
                          setActiveReactionPickerId(null);
                        }}
                        className="w-7 h-7 flex items-center justify-center hover:scale-125 transition-transform text-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 pl-2 text-xs font-code text-[#c5a059]/90 animate-pulse">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] delay-75" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] delay-150" />
          </div>
          <span>
            {typingUsers.map(t => t.username).join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
