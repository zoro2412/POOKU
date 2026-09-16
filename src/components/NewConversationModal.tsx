import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  User as UserIcon, 
  ShieldCheck, 
  Lock, 
  X, 
  Check, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { User, EncryptionLevel } from '../types';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableUsers: User[];
  currentUser: User;
  onCreateConversation: (payload: {
    type: 'DIRECT' | 'GROUP';
    name?: string;
    description?: string;
    memberIds: string[];
    encryptionLevel: EncryptionLevel;
  }) => Promise<void>;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
  availableUsers,
  currentUser,
  onCreateConversation
}) => {
  const [convType, setConvType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [encryptionLevel, setEncryptionLevel] = useState<EncryptionLevel>('PQC_KYBER_AES_GCM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const otherUsers = availableUsers.filter(u => u.id !== currentUser.id);

  const toggleMember = (id: string) => {
    if (convType === 'DIRECT') {
      setSelectedMemberIds([id]);
    } else {
      setSelectedMemberIds(prev =>
        prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
      );
    }
  };

  const handleCreate = async () => {
    if (selectedMemberIds.length === 0) return;
    if (convType === 'GROUP' && !name.trim()) return;

    try {
      setIsSubmitting(true);
      const chosenName = convType === 'GROUP' 
        ? name.trim() 
        : otherUsers.find(u => u.id === selectedMemberIds[0])?.displayName || 'Direct Channel';

      await onCreateConversation({
        type: convType,
        name: chosenName,
        description: description.trim() || undefined,
        memberIds: [currentUser.id, ...selectedMemberIds],
        encryptionLevel
      });

      onClose();
    } catch (err) {
      console.error('Failed to create channel', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-text">
      <div 
        id="new-conversation-modal"
        className="w-full max-w-lg bg-[#0e1017] border border-[#2e3446] rounded-2xl shadow-2xl overflow-hidden text-[#e2e4e9] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#202534] bg-[#121522] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#f5d58c]">
              <Plus className="w-5 h-5 text-[#dfba73]" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-brand text-[#f5d58c]">
                Open Secure Communication Channel
              </h3>
              <p className="text-xs text-[#7e8597] font-code">
                Select network peers to establish an encrypted session
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

        {/* Channel Type Selector */}
        <div className="flex border-b border-[#1c202d] bg-[#0c0e14] text-xs font-code">
          <button
            onClick={() => {
              setConvType('DIRECT');
              setSelectedMemberIds([]);
            }}
            className={`flex-1 py-3 text-center transition-all ${
              convType === 'DIRECT'
                ? 'text-[#f5d58c] border-b-2 border-[#c5a059] bg-[#141722]'
                : 'text-[#7d8495] hover:text-[#d0d5e2]'
            }`}
          >
            Direct Peer Channel
          </button>
          <button
            onClick={() => {
              setConvType('GROUP');
              setSelectedMemberIds([]);
            }}
            className={`flex-1 py-3 text-center transition-all ${
              convType === 'GROUP'
                ? 'text-[#f5d58c] border-b-2 border-[#c5a059] bg-[#141722]'
                : 'text-[#7d8495] hover:text-[#d0d5e2]'
            }`}
          >
            Multi-Peer Group Channel
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {convType === 'GROUP' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-code text-[#73798c] mb-1">
                  Group Channel Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Team Discussion"
                  className="w-full bg-[#12141c] border border-[#242836] rounded-lg px-3 py-2 text-xs text-[#e2e4e9] focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-code text-[#73798c] mb-1">
                  Purpose / Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Secure team communications and project updates"
                  className="w-full bg-[#12141c] border border-[#242836] rounded-lg px-3 py-2 text-xs text-[#e2e4e9] focus:outline-none focus:border-[#c5a059]"
                />
              </div>
            </div>
          )}

          {/* Select Members */}
          <div>
            <label className="block text-[11px] font-code text-[#73798c] mb-2">
              Select Network Participants ({selectedMemberIds.length} chosen)
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {otherUsers.map((user) => {
                const isSelected = selectedMemberIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#181c28] border-[#c5a059]/50'
                        : 'bg-[#12141c] border-[#222634] hover:bg-[#151822]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatarUrl}
                        alt={user.displayName}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-[#2f3444]"
                      />
                      <div>
                        <span className="text-xs font-semibold text-[#f0f2f5] block">
                          {user.displayName}
                        </span>
                        <span className="text-[10px] text-[#6d7486] font-code">
                          @{user.username} · {user.role}
                        </span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      isSelected
                        ? 'bg-[#c5a059] border-[#c5a059] text-black'
                        : 'border-[#33384a]'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#202534] bg-[#0c0e14] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#171a24] hover:bg-[#202432] text-xs font-medium rounded-lg text-[#b0b6c6] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedMemberIds.length === 0 || (convType === 'GROUP' && !name.trim()) || isSubmitting}
            className="px-5 py-2 bg-gradient-to-r from-[#dfba73] via-[#c5a059] to-[#9c752b] hover:opacity-95 text-[#0a0c12] rounded-lg text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>Establish Channel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
