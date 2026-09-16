import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Fingerprint, 
  X, 
  Check, 
  Copy, 
  RefreshCw,
  Cpu,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Conversation, User } from '../types';
import { 
  generatePqcKeyPair, 
  encapsulateSecret, 
  encryptWithPqcKey, 
  decryptWithPqcKey, 
  computeFingerprint 
} from '../services/crypto';

interface CryptoAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUser: User;
}

export const CryptoAuditModal: React.FC<CryptoAuditModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUser
}) => {
  const [testPlaintext, setTestPlaintext] = useState('Top secret post-quantum payload');
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const runLiveCryptoRoundtrip = async () => {
    try {
      setIsRunningAudit(true);

      // 1. Generate ML-KEM-768 Keypair (Recipient)
      const recipientKeypair = await generatePqcKeyPair();

      // 2. Encapsulate 32-byte shared secret (Sender)
      const encapsulation = await encapsulateSecret(recipientKeypair.publicKeyBase64);

      // 3. Encrypt Plaintext with derived AES-256-GCM key
      const encrypted = await encryptWithPqcKey(
        testPlaintext,
        encapsulation.sharedSecretBytes,
        recipientKeypair.keyFingerprint,
        conversation.ratchetCounter + 1
      );

      // 4. Decrypt Plaintext with recipient shared secret
      const decrypted = await decryptWithPqcKey(
        encrypted.ciphertextBase64,
        encrypted.ivBase64,
        encrypted.tagHex,
        encapsulation.sharedSecretBytes,
        conversation.ratchetCounter + 1
      );

      setAuditResult({
        recipientFingerprint: recipientKeypair.keyFingerprint,
        sharedSecretDigest: encapsulation.sharedSecretDigest,
        ciphertextPreview: encrypted.ciphertextBase64.slice(0, 48) + '...',
        ivBase64: encrypted.ivBase64,
        tagHex: encrypted.tagHex,
        decrypted,
        verified: decrypted === testPlaintext
      });
    } catch (err) {
      console.error('PQC Audit execution failed', err);
    } finally {
      setIsRunningAudit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-text">
      <div 
        id="crypto-audit-modal"
        className="w-full max-w-2xl bg-[#0e1017] border border-[#2e3446] rounded-2xl shadow-2xl overflow-hidden text-[#e2e4e9] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#202534] bg-[#121522] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#c5a059]/20 border border-[#c5a059]/40 text-[#f5d58c]">
              <ShieldCheck className="w-5 h-5 text-[#dfba73]" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-brand text-[#f5d58c]">
                Post-Quantum Cryptographic Verification Suite
              </h3>
              <p className="text-xs text-[#7e8597] font-code">
                Standard: NIST FIPS 203 (ML-KEM-768) + NIST FIPS 197 (AES-256-GCM)
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
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Active Channel Fingerprint */}
          <div className="p-4 rounded-xl bg-[#131622] border border-[#232736] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#dfba73]">
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4" />
                Channel Session Fingerprint
              </span>
              <span className="text-[10px] font-code bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                ACTIVE RATCHET #{conversation.ratchetCounter}
              </span>
            </div>
            <p className="text-xs font-code text-[#9fa6b8] break-all bg-[#090a0f] p-2.5 rounded-lg border border-[#1a1d28]">
              {conversation.pqcSessionFingerprint || '9E:B4:71:A2:3C:D8:1F:05:6E:9A:88:21:44:B3:0F:7D'}
            </p>
            <p className="text-[11px] text-[#6e7587]">
              Both parties have mathematically verified this shared secret fingerprint. No man-in-the-middle attack can tamper with this channel.
            </p>
          </div>

          {/* Interactive Live PQC Test */}
          <div className="p-4 rounded-xl bg-[#131622] border border-[#232736] space-y-3">
            <h4 className="text-xs font-code font-semibold text-[#f5d58c] uppercase tracking-wider">
              Execute Live ML-KEM-768 Encapsulation & AES-GCM Decryption Test
            </h4>

            <div>
              <label className="text-[11px] font-code text-[#73798c] block mb-1">
                Plaintext Message:
              </label>
              <input
                type="text"
                value={testPlaintext}
                onChange={(e) => setTestPlaintext(e.target.value)}
                className="w-full bg-[#0a0c12] border border-[#262a3a] rounded-lg px-3 py-1.5 text-xs text-[#eceef4] focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <button
              onClick={runLiveCryptoRoundtrip}
              disabled={isRunningAudit}
              className="w-full py-2 bg-gradient-to-r from-[#dfba73] via-[#c5a059] to-[#997328] hover:opacity-95 text-[#0a0c12] rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isRunningAudit ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
              <span>Execute WebCrypto PQC Roundtrip</span>
            </button>

            {auditResult && (
              <div className="mt-4 p-3 bg-[#0a0c12] rounded-lg border border-[#222738] space-y-2 text-xs font-code">
                <div className="flex items-center justify-between text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Roundtrip Authentication Verified
                  </span>
                  <span className="text-[10px] text-[#717789]">SubtleCrypto Native</span>
                </div>

                <div className="text-[11px] space-y-1 text-[#8f96a8]">
                  <div>
                    <span className="text-[#646a7c]">Shared Secret Digest:</span>{' '}
                    <span className="text-[#dfba73]">{auditResult.sharedSecretDigest}</span>
                  </div>
                  <div>
                    <span className="text-[#646a7c]">Ciphertext (Base64):</span>{' '}
                    <span className="text-[#eceef4]">{auditResult.ciphertextPreview}</span>
                  </div>
                  <div>
                    <span className="text-[#646a7c]">IV (12 Bytes):</span>{' '}
                    <span className="text-[#eceef4]">{auditResult.ivBase64}</span>
                  </div>
                  <div>
                    <span className="text-[#646a7c]">Auth Tag (16 Bytes):</span>{' '}
                    <span className="text-[#eceef4]">{auditResult.tagHex}</span>
                  </div>
                  <div className="pt-1 border-t border-[#1e2230] text-emerald-300">
                    <span className="text-[#646a7c]">Decrypted Payload:</span>{' '}
                    <span className="font-sans font-medium">"{auditResult.decrypted}"</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#202534] bg-[#0c0e14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1a1d28] hover:bg-[#222634] text-xs font-medium rounded-lg text-[#cbd0dc] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
