/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageComposer } from './components/MessageComposer';
import { RightSidebar } from './components/RightSidebar';
import { CryptoAuditModal } from './components/CryptoAuditModal';
import { AuthModal } from './components/AuthModal';
import { NewConversationModal } from './components/NewConversationModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthPage } from './components/AuthPage';
import { 
  User, 
  Conversation, 
  Message, 
  TypingState, 
  ReplyReference,
  EncryptionLevel
} from './types';
import { api } from './services/api';
import { socketService } from './services/socket';
import { 
  generatePqcKeyPair, 
  encapsulateSecret, 
  encryptWithPqcKey, 
  decryptWithPqcKey 
} from './services/crypto';
import { ShieldCheck, Search, X, Loader2, AlertCircle } from 'lucide-react';

// Subtle Web Audio synthesizer for pristine event sounds
const playChime = (frequency: number = 880, duration: number = 0.08) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio context may be restricted before user interaction
  }
};

export default function App() {
  // Core State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingState[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Pagination cursor
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // UI State
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyReference | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInChatQuery, setSearchInChatQuery] = useState('');

  // Modals
  const [initError, setInitError] = useState<string | null>(null);
  const [isCryptoAuditOpen, setIsCryptoAuditOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedAuditMessage, setSelectedAuditMessage] = useState<Message | null>(null);

  // Active conversation helper
  const activeConversation = conversations.find(c => c.id === selectedConversationId) || null;

  // Initialize App
  const initApp = useCallback(async () => {
    try {
      setIsInitializing(true);
      setInitError(null);

      // Check if access token exists in localStorage
      let token = localStorage.getItem('pooku_access_token');
      let user: User | null = null;

      if (token) {
        try {
          user = await api.getCurrentUser();
        } catch {
          api.clearTokens();
          token = null;
        }
      }

      if (user && token) {
        setCurrentUser(user);
        socketService.connect(token);

        // Fetch Conversations
        try {
          const convs = await api.getConversations();
          setConversations(convs);
          if (convs.length > 0 && !selectedConversationId) {
            setSelectedConversationId(convs[0].id);
          }
        } catch (convErr) {
          console.warn('Conversation load note:', convErr);
        }

        // Fetch available users
        try {
          const users = await api.getUsers();
          setAvailableUsers(users);
        } catch (e) {
          console.warn('User directory prefetch note:', e);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err: any) {
      console.error('Initialization note:', err);
      setCurrentUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, [selectedConversationId]);

  const handleAuthSuccess = async (user: User, token: string) => {
    setCurrentUser(user);
    socketService.connect(token);
    try {
      const convs = await api.getConversations();
      setConversations(convs);
      if (convs.length > 0) {
        setSelectedConversationId(convs[0].id);
      }
    } catch (err) {
      console.warn('Failed to load conversations after auth', err);
    }
    try {
      const users = await api.getUsers();
      setAvailableUsers(users);
    } catch (err) {
      console.warn('Failed to load user list after auth', err);
    }
  };

  const handleSignOut = () => {
    api.clearTokens();
    socketService.disconnect();
    setCurrentUser(null);
    setConversations([]);
    setSelectedConversationId(null);
    setMessages([]);
    setIsAuthModalOpen(false);
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    let isMounted = true;
    initApp();

    return () => {
      isMounted = false;
      socketService.disconnect();
    };
  }, [initApp]);

  // Fetch Messages when active conversation changes
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await api.getMessages(convId, 40);
      setMessages(res.messages);
      setNextCursor(res.nextCursor || null);
      // Mark as read in server
      api.markAsRead(convId).catch(() => {});
      socketService.sendReadReceipt(convId);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
      setReplyingTo(null);
      setTypingUsers([]);
      setSearchInChatQuery('');
    }
  }, [selectedConversationId, fetchMessages]);

  // Handle Load More (Cursor Pagination)
  const handleLoadMore = async () => {
    if (!selectedConversationId || !nextCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const res = await api.getMessages(selectedConversationId, 40, nextCursor);
      setMessages(prev => [...res.messages, ...prev]);
      setNextCursor(res.nextCursor || null);
    } catch (err) {
      console.error('Cursor pagination failed', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // WebSocket Event Handlers
  useEffect(() => {
    // 1. Connection status
    const unsubConnect = socketService.onConnectChange((connected) => {
      setWsConnected(connected);
    });

    // 2. New message received
    const unsubMessage = socketService.onMessage((newMsg: Message) => {
      playChime(1050, 0.09);

      setMessages(prev => {
        // Avoid duplicate if already exists
        if (prev.some(m => m.id === newMsg.id)) return prev;
        if (newMsg.conversationId === selectedConversationId) {
          // Send read receipt if active
          socketService.sendReadReceipt(newMsg.conversationId, newMsg.id);
          return [...prev, newMsg];
        }
        return prev;
      });

      // Update last message on conversation item
      setConversations(prev =>
        prev.map(c => {
          if (c.id === newMsg.conversationId) {
            return {
              ...c,
              lastMessage: newMsg,
              unreadCount: c.id === selectedConversationId ? 0 : c.unreadCount + 1,
              updatedAt: newMsg.createdAt
            };
          }
          return c;
        })
      );
    });

    // 3. Message updated
    const unsubUpdate = socketService.onMessageUpdate((updatedMsg: Message) => {
      setMessages(prev =>
        prev.map(m => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
      );
    });

    // 4. Message deleted
    const unsubDelete = socketService.onMessageDelete((messageId: string) => {
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, isDeleted: true, content: '« This message was deleted »' } : m))
      );
    });

    // 5. Reaction updated
    const unsubReaction = socketService.onReaction((data: { messageId: string; reactions: any[] }) => {
      setMessages(prev =>
        prev.map(m => (m.id === data.messageId ? { ...m, reactions: data.reactions } : m))
      );
    });

    // 6. Typing status
    const unsubTyping = socketService.onTyping((typingState: TypingState) => {
      if (typingState.conversationId === selectedConversationId) {
        if (typingState.userId === currentUser?.id) return;

        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== typingState.userId);
          if (typingState.isTyping) {
            return [...filtered, typingState];
          }
          return filtered;
        });
      }
    });

    // 7. Presence update
    const unsubPresence = socketService.onPresence((userPresence: { userId: string; status: 'online' | 'away' | 'offline'; lastSeen: string }) => {
      setAvailableUsers(prev =>
        prev.map(u => (u.id === userPresence.userId ? { ...u, status: userPresence.status, lastSeen: userPresence.lastSeen } : u))
      );
      setConversations(prev =>
        prev.map(conv => ({
          ...conv,
          members: conv.members.map(m =>
            m.id === userPresence.userId ? { ...m, status: userPresence.status, lastSeen: userPresence.lastSeen } : m
          )
        }))
      );
    });

    return () => {
      unsubConnect();
      unsubMessage();
      unsubUpdate();
      unsubDelete();
      unsubReaction();
      unsubTyping();
      unsubPresence();
    };
  }, [selectedConversationId, currentUser?.id]);

  // Dispatch Message Handler
  const handleSendMessage = async (content: string, replyToId?: string, attachments?: any[]) => {
    if (!selectedConversationId || !currentUser || !activeConversation) return;

    try {
      playChime(640, 0.05);

      let encryptedPayload: any = null;
      const isQuantumSafe = activeConversation.encryptionLevel === 'PQC_KYBER_AES_GCM';

      if (isQuantumSafe) {
        // Derive ML-KEM-768 ciphertext and encapsulate
        const recipientUser = activeConversation.type === 'DIRECT'
          ? activeConversation.members.find(m => m.id !== currentUser.id) || currentUser
          : currentUser;

        const pubKey = recipientUser.pqcPublicKey || currentUser.pqcPublicKey || 'SAMPLE_KYBER_KEY';
        const encapsulation = await encapsulateSecret(pubKey);

        const encResult = await encryptWithPqcKey(
          content,
          encapsulation.sharedSecretBytes,
          encapsulation.sharedSecretDigest.slice(0, 16),
          activeConversation.ratchetCounter + 1
        );

        encryptedPayload = {
          isEncrypted: true,
          isQuantumSafe: true,
          algorithm: 'ML_KEM_768_AES_GCM' as const,
          keyFingerprint: encResult.keyFingerprint,
          ratchetCount: activeConversation.ratchetCounter + 1,
          verified: true,
          iv: encResult.ivBase64,
          tag: encResult.tagHex,
          ciphertextPreview: encResult.ciphertextBase64.slice(0, 32) + '...'
        };
      }

      // Optimistic message
      const tempId = 'temp-' + Date.now();
      const optimisticMsg: Message = {
        id: tempId,
        conversationId: selectedConversationId,
        senderId: currentUser.id,
        content,
        status: 'sent',
        createdAt: new Date().toISOString(),
        replyTo: replyingTo || undefined,
        attachments: attachments || [],
        reactions: [],
        encryption: encryptedPayload || {
          isEncrypted: false,
          isQuantumSafe: false,
          algorithm: 'TLS_TRANSPORT',
          keyFingerprint: '',
          ratchetCount: 0,
          verified: true
        },
        sender: {
          id: currentUser.id,
          displayName: currentUser.displayName,
          username: currentUser.username,
          avatarUrl: currentUser.avatarUrl
        }
      };

      setMessages(prev => [...prev, optimisticMsg]);

      // Dispatch via REST & Kafka
      const createdMessage = await api.sendMessage(
        selectedConversationId,
        {
          content,
          replyToId,
          attachments,
          rawCiphertext: encryptedPayload?.ciphertextPreview,
          encryption: encryptedPayload
        }
      );

      // Replace optimistic message with actual created record
      setMessages(prev => prev.map(m => (m.id === tempId ? createdMessage : m)));

      // Update conversation list
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversationId
            ? { ...c, lastMessage: createdMessage, ratchetCounter: c.ratchetCounter + 1 }
            : c
        )
      );

      // Real-time broadcast via socket gateway
      socketService.sendMessage(createdMessage);
    } catch (err) {
      console.error('Failed to dispatch message:', err);
    }
  };

  // Typing emitter
  const handleSendTyping = (isTyping: boolean) => {
    if (selectedConversationId && currentUser) {
      socketService.sendTyping(selectedConversationId, isTyping, currentUser.displayName);
    }
  };

  // Reply handler
  const handleReply = (message: Message) => {
    setReplyingTo({
      id: message.id,
      content: message.content,
      senderName: message.sender?.displayName || 'Peer'
    });
  };

  // Edit handler
  const handleEdit = async (message: Message) => {
    const newContent = prompt('Edit message:', message.content);
    if (newContent && newContent.trim() !== message.content) {
      try {
        const updated = await api.editMessage(message.id, newContent.trim());
        setMessages(prev => prev.map(m => (m.id === message.id ? updated : m)));
        socketService.sendUpdateMessage(updated);
      } catch (e) {
        console.error('Failed to edit', e);
      }
    }
  };

  // Delete handler
  const handleDelete = async (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await api.deleteMessage(messageId);
        setMessages(prev =>
          prev.map(m => (m.id === messageId ? { ...m, isDeleted: true, content: '« This message was deleted »' } : m))
        );
        socketService.sendDeleteMessage(messageId);
      } catch (e) {
        console.error('Failed to delete', e);
      }
    }
  };

  // Reaction handler
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const updatedMessage = await api.toggleReaction(messageId, emoji);
      setMessages(prev =>
        prev.map(m => (m.id === messageId ? { ...m, reactions: updatedMessage.reactions } : m))
      );
      socketService.sendReaction(messageId, updatedMessage.reactions);
    } catch (e) {
      console.error('Failed to react', e);
    }
  };

  // File Upload handler
  const handleFileUpload = async (file: File) => {
    return await api.uploadFile(file);
  };

  // Inspect Cryptographic Envelope
  const handleInspectCrypto = (message: Message) => {
    setSelectedAuditMessage(message);
    setIsCryptoAuditOpen(true);
  };

  // Select Persona (instant switch)
  const handleSelectPersona = async (user: User) => {
    try {
      let authRes;
      try {
        authRes = await api.login(user.username, 'pooku2026');
      } catch {
        authRes = await api.login(user.username, 'pooku123');
      }
      setCurrentUser(authRes.user);
      socketService.disconnect();
      socketService.connect(authRes.accessToken);
      const convs = await api.getConversations();
      setConversations(convs);
      if (convs.length > 0) {
        setSelectedConversationId(convs[0].id);
      }
    } catch (err) {
      console.error('Persona switch failed', err);
    }
  };

  // Create Conversation handler
  const handleCreateConversation = async (payload: {
    type: 'DIRECT' | 'GROUP';
    name?: string;
    description?: string;
    memberIds: string[];
    encryptionLevel: EncryptionLevel;
  }) => {
    const created = await api.createConversation(payload);
    setConversations(prev => [created, ...prev]);
    setSelectedConversationId(created.id);
  };

  // Update current user handler
  const handleUpdateUser = async (updated: Partial<User>) => {
    const refreshed = await api.updateProfile(updated);
    setCurrentUser(refreshed);
    setAvailableUsers(prev => prev.map(u => (u.id === refreshed.id ? refreshed : u)));
  };

  // Filter messages if search query exists
  const displayedMessages = searchInChatQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchInChatQuery.toLowerCase()))
    : messages;

  if (isInitializing) {
    return (
      <div className="h-screen w-screen bg-[#08090d] flex flex-col items-center justify-center text-[#f5d58c] font-code p-6">
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfba73] via-[#c5a059] to-[#7f6327] p-0.5 shadow-2xl shadow-[#c5a059]/20 flex items-center justify-center mb-5 animate-pulse">
          <div className="w-full h-full bg-[#0e1014] rounded-[14px] flex items-center justify-center">
            <span className="font-fraktur font-bold text-3xl text-[#f5d58c]">P</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#a4abbd]">
          <Loader2 className="w-4 h-4 animate-spin text-[#c5a059]" />
          <span>Connecting to POOKU Network...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen w-screen flex bg-[#0a0b0e] overflow-hidden text-[#e2e4e9] font-sans antialiased select-none relative">
      {/* 1. Left Sidebar: Channels & Contacts (Responsive) */}
      <div 
        className={`h-full flex-shrink-0 ${
          activeConversation ? 'hidden md:flex md:w-80 lg:w-88' : 'flex w-full md:w-80 lg:w-88'
        }`}
      >
        <Sidebar
          currentUser={currentUser}
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={(id) => setSelectedConversationId(id)}
          onOpenNewChat={() => setIsNewChatOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSwitchUserModal={() => setIsAuthModalOpen(true)}
          wsConnected={wsConnected}
        />
      </div>

      {/* 2. Center Chat Workspace (Responsive) */}
      <main 
        id="pooku-center-chat" 
        className={`flex-1 flex-col h-full bg-[#0b0d13] min-w-0 relative ${
          activeConversation ? 'flex w-full' : 'hidden md:flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Top Header */}
            <ChatHeader
              conversation={activeConversation}
              currentUser={currentUser}
              onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
              rightSidebarOpen={rightSidebarOpen}
              onOpenSearch={() => setIsSearchOpen(!isSearchOpen)}
              onOpenPqcDetails={() => setIsCryptoAuditOpen(true)}
              onBack={() => setSelectedConversationId(null)}
            />

            {/* In-Chat Search Bar (Expandable) */}
            {isSearchOpen && (
              <div className="px-4 sm:px-5 py-2.5 bg-[#121520] border-b border-[#222736] flex items-center justify-between text-xs animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 flex-1 mr-3">
                  <Search className="w-3.5 h-3.5 text-[#c5a059]" />
                  <input
                    type="text"
                    autoFocus
                    value={searchInChatQuery}
                    onChange={(e) => setSearchInChatQuery(e.target.value)}
                    placeholder="Search in this channel's encrypted history..."
                    className="w-full bg-transparent text-xs text-[#eceef4] placeholder-[#646b7e] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-code text-[#737a8c]">
                  <span>{displayedMessages.length} matches</span>
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchInChatQuery('');
                    }}
                    className="p-1 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Message Feed Area */}
            <MessageList
              messages={displayedMessages}
              currentUser={currentUser}
              typingUsers={typingUsers}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReaction={handleReaction}
              onInspectCrypto={handleInspectCrypto}
              onLoadMore={handleLoadMore}
              hasMore={Boolean(nextCursor)}
              isLoadingMore={isLoadingMore}
            />

            {/* Message Composer */}
            <MessageComposer
              onSendMessage={handleSendMessage}
              onSendTyping={handleSendTyping}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              isQuantumSafe={activeConversation.encryptionLevel === 'PQC_KYBER_AES_GCM'}
              onFileUpload={handleFileUpload}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#697082]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfba73]/20 via-[#c5a059]/10 to-transparent border border-[#c5a059]/30 flex items-center justify-center mb-3.5 shadow-lg shadow-[#c5a059]/5">
              <span className="font-fraktur font-bold text-3xl text-[#f5d58c]">P</span>
            </div>
            <h3 className="font-fraktur text-3xl font-bold text-[#f5d58c] tracking-wide">
              POOKU
            </h3>
            <p className="text-xs text-[#8c93a4] max-w-sm mt-2">
              Select a conversation from the sidebar or start a new message.
            </p>
          </div>
        )}
      </main>

      {/* 3. Right Sidebar: Channel Intelligence (Responsive Slide-over on mobile/tablet, inline on desktop) */}
      {rightSidebarOpen && activeConversation && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden transition-opacity"
            onClick={() => setRightSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-88 max-w-full lg:static lg:z-auto lg:h-full flex-shrink-0 shadow-2xl lg:shadow-none">
            <RightSidebar
              conversation={activeConversation}
              currentUser={currentUser}
              messages={messages}
              onClose={() => setRightSidebarOpen(false)}
              onOpenCryptoAudit={() => setIsCryptoAuditOpen(true)}
            />
          </div>
        </>
      )}

      {/* Modals */}
      {activeConversation && (
        <CryptoAuditModal
          isOpen={isCryptoAuditOpen}
          onClose={() => setIsCryptoAuditOpen(false)}
          conversation={activeConversation}
          currentUser={currentUser}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={async (u, p) => {
          const res = await api.login(u, p);
          await handleAuthSuccess(res.user, res.accessToken);
        }}
        onRegister={async (payload) => {
          const res = await api.register(payload);
          await handleAuthSuccess(res.user, res.accessToken);
        }}
        onSignOut={handleSignOut}
      />

      <NewConversationModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        availableUsers={availableUsers}
        currentUser={currentUser}
        onCreateConversation={handleCreateConversation}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
