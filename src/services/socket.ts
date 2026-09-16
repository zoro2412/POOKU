/**
 * POOKU Real-Time WebSocket Client
 * Connects directly to the backend WebSocket server with JWT authentication,
 * automatic exponential-backoff reconnect, heartbeat monitor, and event dispatch.
 */

type EventHandler = (data: any) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private isConnecting = false;
  private sendQueue: string[] = [];
  public isConnected = false;
  private token: string | null = null;

  public connect(token?: string) {
    if (token) this.token = token;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws?token=${encodeURIComponent(this.token || '')}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushQueue();
        this.emitLocal('connection:status', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          if (packet.type === 'pong') return;
          this.emitLocal(packet.type, packet.payload);
        } catch (err) {
          console.error('Error parsing WS message', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emitLocal('connection:status', { status: 'disconnected' });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('POOKU WS encountered socket event or error:', err);
      };
    } catch (e) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public send(type: string, payload: any) {
    const messageStr = JSON.stringify({ type, payload, timestamp: Date.now() });
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(messageStr);
    } else {
      this.sendQueue.push(messageStr);
    }
  }

  private flushQueue() {
    while (this.sendQueue.length > 0 && this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      const msg = this.sendQueue.shift();
      if (msg) this.ws.send(msg);
    }
  }

  public on(event: string, handler: EventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  public off(event: string, handler: EventHandler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(handler);
    }
  }

  private emitLocal(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => {
        try {
          fn(data);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  // High-level messaging helpers
  public sendTyping(conversationId: string, isTyping: boolean, username?: string) {
    this.send('typing', { conversationId, isTyping, username });
  }

  public sendMessage(message: any) {
    this.send('message:send', message);
  }

  public sendUpdateMessage(message: any) {
    this.send('message:update', message);
  }

  public sendDeleteMessage(messageId: string) {
    this.send('message:delete', { messageId });
  }

  public sendReaction(messageId: string, reactions: any[]) {
    this.send('message:reaction', { messageId, reactions });
  }

  public sendReadReceipt(conversationId: string, messageId?: string) {
    this.send('message:read', { conversationId, messageId });
  }

  public markDelivered(messageId: string, conversationId: string) {
    this.send('message:delivered', { messageId, conversationId });
  }

  public markRead(messageId: string, conversationId: string) {
    this.send('message:read', { messageId, conversationId });
  }

  public updatePresence(status: 'online' | 'offline' | 'away') {
    this.send('presence:update', { status });
  }

  // Typed Listeners
  public onConnectChange(handler: (connected: boolean) => void) {
    return this.on('connection:status', (data: any) => handler(data.status === 'connected'));
  }

  public onMessage(handler: (message: any) => void) {
    return this.on('message:new', handler);
  }

  public onMessageUpdate(handler: (message: any) => void) {
    return this.on('message:update', handler);
  }

  public onMessageDelete(handler: (messageId: string) => void) {
    return this.on('message:delete', (data: any) => handler(data.messageId || data));
  }

  public onReaction(handler: (data: { messageId: string; reactions: any[] }) => void) {
    return this.on('message:reaction', handler);
  }

  public onTyping(handler: (typingState: any) => void) {
    return this.on('typing', handler);
  }

  public onPresence(handler: (presence: any) => void) {
    return this.on('presence:update', handler);
  }
}

export const socketService = new WebSocketService();
