export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'online' | 'offline' | 'away';
export type EncryptionLevel = 'TLS_ONLY' | 'AES_GCM' | 'PQC_KYBER_AES_GCM';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastSeen: string;
  pqcPublicKey: string; // Base64 encoded Kyber-768 public key
  bio?: string;
  department?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'audio' | 'archive';
  size: number;
  url: string;
  mimeType: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ReplyReference {
  id: string;
  content: string;
  senderName: string;
}

export interface EncryptionMetadata {
  isEncrypted: boolean;
  isQuantumSafe: boolean;
  algorithm: 'TLS_TRANSPORT' | 'AES_256_GCM' | 'ML_KEM_768_AES_GCM';
  keyFingerprint: string;
  ratchetCount: number;
  verified: boolean;
  iv?: string;
  tag?: string;
  ciphertextPreview?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string;
  };
  content: string;
  rawCiphertext?: string;
  encryption: EncryptionMetadata;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  replyTo?: ReplyReference;
  reactions: Reaction[];
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string;
  avatarUrl?: string;
  description?: string;
  memberIds: string[];
  members: User[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  encryptionLevel: EncryptionLevel;
  pqcSessionFingerprint?: string;
  ratchetCounter: number;
}

export interface TypingState {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

// Architecture & Telemetry Types
export interface KafkaTopicMetric {
  topic: string;
  partitions: number;
  messagesCount: number;
  consumerLag: number;
  activeConsumers: number;
}

export interface PostgresQueryLog {
  id: string;
  timestamp: string;
  sql: string;
  durationMs: number;
  rowsAffected: number;
  indexUsed: string;
  isCursorPagination: boolean;
}

export interface RedisStateMetric {
  connectedClients: number;
  usedMemoryKb: number;
  keysCount: number;
  hitRatePercent: number;
  presenceKeysCount: number;
  ttlSecondsDefault: number;
}

export interface ArchitectureEventTrace {
  id: string;
  timestamp: string;
  correlationId: string;
  eventType: 'MESSAGE_FLOW' | 'PRESENCE_FLOW' | 'AUTH_FLOW' | 'PQC_HANDSHAKE';
  summary: string;
  steps: {
    node: string;
    action: string;
    timeMs: number;
    status: 'success' | 'processing' | 'retry' | 'failure';
    details?: string;
  }[];
}

export interface SystemMetrics {
  uptimeSeconds: number;
  activeWsConnections: number;
  messagesProcessedTotal: number;
  kafkaMetrics: KafkaTopicMetric[];
  redisMetrics: RedisStateMetric;
  recentQueries: PostgresQueryLog[];
  recentTraces: ArchitectureEventTrace[];
}
