import React, { useState, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  X, 
  ShieldCheck, 
  Image as ImageIcon, 
  FileText, 
  Loader2,
  Sparkles,
  Lock
} from 'lucide-react';
import { ReplyReference } from '../types';

interface MessageComposerProps {
  onSendMessage: (content: string, replyToId?: string, attachments?: any[]) => Promise<void>;
  onSendTyping: (isTyping: boolean) => void;
  replyingTo?: ReplyReference | null;
  onCancelReply: () => void;
  isQuantumSafe: boolean;
  onFileUpload: (file: File) => Promise<{ url: string; name: string; size: number; mimeType: string }>;
}

const EMOJI_LIST = ['🛡️', '⚡', '🔥', '✨', '👍', '🚀', '🔑', '💻', '🔒', '💡', '✅', '🛰️'];

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onSendTyping,
  replyingTo,
  onCancelReply,
  isQuantumSafe,
  onFileUpload
}) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<any>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Typing indicator event
    onSendTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onSendTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && pendingAttachments.length === 0) || isSubmitting) return;

    try {
      setIsSubmitting(true);
      clearTimeout(typingTimerRef.current);
      onSendTyping(false);

      await onSendMessage(
        text.trim(), 
        replyingTo ? replyingTo.id : undefined,
        pendingAttachments.length > 0 ? pendingAttachments : undefined
      );

      setText('');
      setPendingAttachments([]);
      setShowEmojiPicker(false);
      if (replyingTo) onCancelReply();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadProgress(20);
      const file = files[0];
      const timer = setInterval(() => {
        setUploadProgress(prev => (prev && prev < 90 ? prev + 25 : prev));
      }, 150);

      const uploaded = await onFileUpload(file);
      clearInterval(timer);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 400);

      const isImg = file.type.startsWith('image/');
      setPendingAttachments(prev => [
        ...prev,
        {
          id: 'att-' + Math.random().toString(36).substring(2, 9),
          name: uploaded.name,
          type: isImg ? 'image' : 'document',
          size: uploaded.size,
          url: uploaded.url,
          mimeType: uploaded.mimeType
        }
      ]);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadProgress(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div id="message-composer" className="p-3 sm:p-4 border-t border-[#20222a] bg-[#0e1015]/95 backdrop-blur relative">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip,.json"
      />

      {/* Reply Banner Preview */}
      {replyingTo && (
        <div className="mb-2 p-2.5 bg-[#141720] border border-[#262b3a] rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-8 rounded bg-[#c5a059]" />
            <div className="min-w-0 text-xs">
              <span className="text-[#f5d58c] font-medium block">
                Replying to {replyingTo.senderName}
              </span>
              <p className="text-[#8e94a5] truncate line-clamp-1">{replyingTo.content}</p>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-[#6c7283] hover:text-[#e5e7eb] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {uploadProgress !== null && (
        <div className="mb-2 px-1">
          <div className="flex items-center justify-between text-[11px] font-code text-[#c5a059] mb-1">
            <span>Uploading attachment...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1 bg-[#1a1c24] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c5a059] to-[#dfba73] transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Attached Files Queue */}
      {pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {pendingAttachments.map((att, idx) => (
            <div
              key={att.id || idx}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#181b25] border border-[#2b3040] text-xs text-[#e5e7eb]"
            >
              {att.type === 'image' ? (
                <ImageIcon className="w-3.5 h-3.5 text-[#c5a059]" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-[#c5a059]" />
              )}
              <span className="truncate max-w-[140px]">{att.name}</span>
              <button
                onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                className="text-[#717788] hover:text-[#f3f4f6]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Box Card */}
      <div className="relative rounded-xl bg-[#13151d] border border-[#262a38] focus-within:border-[#c5a059]/60 transition-colors p-2 flex flex-col shadow-inner">
        <textarea
          id="input-message-text"
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type an encrypted message..."
          rows={1}
          className="w-full bg-transparent resize-none text-sm text-[#eceef3] placeholder-[#5f6577] focus:outline-none px-2 py-1 max-h-32 min-h-[38px] font-sans"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between pt-2 px-1 border-t border-[#1c1f2b] select-none">
          <div className="flex items-center gap-1">
            <button
              id="btn-composer-attachment"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-[#787f92] hover:text-[#f5d58c] hover:bg-[#1a1d28] active:scale-95 transition-all cursor-pointer"
              title="Attach Document / Media"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              id="btn-composer-emoji"
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-lg text-[#787f92] hover:text-[#f5d58c] hover:bg-[#1a1d28] active:scale-95 transition-all relative cursor-pointer"
              title="Add Reaction / Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Voice Message */}
            <button
              id="btn-composer-voice"
              type="button"
              onClick={() => setIsRecordingVoice(!isRecordingVoice)}
              className={`p-2 rounded-lg active:scale-95 transition-all cursor-pointer ${
                isRecordingVoice
                  ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                  : 'text-[#787f92] hover:text-[#f5d58c] hover:bg-[#1a1d28]'
              }`}
              title="Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-code text-[#555a6a] hidden sm:inline">
              Press Enter to send · Shift+Enter for new line
            </span>
            <button
              id="btn-composer-send"
              type="button"
              onClick={handleSend}
              disabled={(!text.trim() && pendingAttachments.length === 0) || isSubmitting}
              className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                (!text.trim() && pendingAttachments.length === 0) || isSubmitting
                  ? 'bg-[#1e222d] text-[#5b6173] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#dfba73] via-[#c5a059] to-[#a88235] text-[#0a0b0e] hover:shadow-md hover:shadow-[#c5a059]/20 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div 
          id="composer-emoji-popover"
          className="absolute bottom-20 left-6 z-40 bg-[#141720] border border-[#2e3344] rounded-xl p-2.5 shadow-2xl flex items-center gap-2"
        >
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setText(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="w-8 h-8 flex items-center justify-center hover:scale-125 transition-transform text-base"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Voice Recorder Overlay (Placeholder) */}
      {isRecordingVoice && (
        <div className="absolute inset-x-4 bottom-4 bg-[#141720] border border-rose-500/40 rounded-xl p-3 flex items-center justify-between shadow-2xl z-30">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-code text-rose-300">
              Recording 24-bit Opus Encrypted Stream... (00:04)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRecordingVoice(false)}
              className="px-2.5 py-1 text-xs text-[#a0a5b5] hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setIsRecordingVoice(false);
                onSendMessage('🎤 [Voice Message: 00:04 encrypted audio note]');
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold"
            >
              Attach Audio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
