import { User, Conversation, Message, SystemMetrics, AuthSession } from '../types';

const API_BASE = '/api';

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('pooku_access_token');
    this.refreshToken = localStorage.getItem('pooku_refresh_token');
  }

  public setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('pooku_access_token', access);
    localStorage.setItem('pooku_refresh_token', refresh);
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('pooku_access_token');
    localStorage.removeItem('pooku_refresh_token');
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  private generateCorrelationId(): string {
    return 'req-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const correlationId = this.generateCorrelationId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      ...(options.headers as Record<string, string> || {})
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401 && this.refreshToken && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      // Attempt token refresh
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers
        });
        if (!retryResponse.ok) {
          throw new Error(await retryResponse.text() || `Request failed with status ${retryResponse.status}`);
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      let errMessage = `Request failed: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errMessage = errorJson.message || errorJson.error || errMessage;
      } catch {
        // use default message
      }
      throw new Error(errMessage);
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      if (res.ok) {
        const data = await res.json();
        this.setTokens(data.accessToken, data.refreshToken || this.refreshToken!);
        return true;
      }
      this.clearTokens();
      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  // Auth endpoints
  public async login(username: string, password: string): Promise<AuthSession> {
    const data = await this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  public async quickLogin(): Promise<AuthSession> {
    const data = await this.request<AuthSession>('/auth/quick', {
      method: 'POST'
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  public async register(payload: { username: string; displayName: string; email: string; password: string; role?: string }): Promise<AuthSession> {
    const data = await this.request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    this.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  public async logout(): Promise<{ status: string }> {
    try {
      const res = await this.request<{ status: string }>('/auth/logout', {
        method: 'POST'
      });
      this.clearTokens();
      return res;
    } catch {
      this.clearTokens();
      return { status: 'logged_out' };
    }
  }

  public async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me');
  }

  public async updateProfile(updated: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
  }

  public async markAsRead(conversationId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/conversations/${conversationId}/read`, {
      method: 'POST'
    });
  }

  public async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  // Conversations endpoints
  public async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/conversations');
  }

  public async createConversation(payload: {
    type: 'DIRECT' | 'GROUP';
    name?: string;
    memberIds: string[];
    encryptionLevel?: 'TLS_ONLY' | 'AES_GCM' | 'PQC_KYBER_AES_GCM';
  }): Promise<Conversation> {
    return this.request<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/conversations/${id}`);
  }

  // Messages endpoints
  public async getMessages(conversationId: string, limit = 50, beforeTimestamp?: string): Promise<{ messages: Message[]; hasMore: boolean; nextCursor?: string }> {
    let url = `/conversations/${conversationId}/messages?limit=${limit}`;
    if (beforeTimestamp) {
      url += `&cursor=${encodeURIComponent(beforeTimestamp)}`;
    }
    return this.request<{ messages: Message[]; hasMore: boolean; nextCursor?: string }>(url);
  }

  public async sendMessage(conversationId: string, payload: {
    content: string;
    rawCiphertext?: string;
    encryption: any;
    replyToId?: string;
    attachments?: any[];
  }): Promise<Message> {
    return this.request<Message>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async editMessage(messageId: string, content: string): Promise<Message> {
    return this.request<Message>(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }

  public async deleteMessage(messageId: string): Promise<{ status: string; id: string }> {
    return this.request<{ status: string; id: string }>(`/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  public async toggleReaction(messageId: string, emoji: string): Promise<Message> {
    return this.request<Message>(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
  }

  // File Upload endpoint
  public async uploadFile(file: File): Promise<{ url: string; name: string; size: number; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await this.request<{ url: string; name: string; size: number; mimeType: string }>('/files/upload', {
            method: 'POST',
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              mimeType: file.type || 'application/octet-stream',
              dataUrl: reader.result as string
            })
          });
          resolve(res);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // System Observability & Diagnostics
  public async getObservabilityMetrics(): Promise<SystemMetrics> {
    return this.request<SystemMetrics>('/observability/metrics');
  }

  public async getArchitectureReference(): Promise<{
    springBootStructure: any;
    sqlSchema: string;
    dockerCompose: string;
    learningModules: any[];
  }> {
    return this.request('/architecture/reference');
  }
}

export const api = new ApiService();
