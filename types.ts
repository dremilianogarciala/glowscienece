
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  IMAGE_STUDIO = 'IMAGE_STUDIO',
  CALENDAR = 'CALENDAR',
  CHANNELS = 'CHANNELS',
  AGENT_BUILDER = 'AGENT_BUILDER',
  UNIFIED_INBOX = 'UNIFIED_INBOX',
  VOICE_STUDIO = 'VOICE_STUDIO',
  AGENT_NETWORK = 'AGENT_NETWORK',
  AGENT_MANAGEMENT = 'AGENT_MANAGEMENT',
  CHAT_IA = 'CHAT_IA',
  SETTINGS = 'SETTINGS'
}

export type AgentType = 'GENERAL' | 'MARKETING' | 'VOICE' | 'ORCHESTRATOR' | 'SALES' | 'AGENDA';

export interface VoiceSettings {
  voiceName: 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';
  speed: number;
  pitch: number;
  isPrimary?: boolean; 
  requiredData?: string[];
}

export interface AgendaSettings {
  googleCalendarId: string;
  googleApiKey: string;
  autoReportTime: string;
  reportPhoneNumber: string;
  calendarSyncEnabled: boolean;
}

export interface MarketingSettings {
  defaultBatchSize?: number;
  autoPostEnabled?: boolean;
}

export interface MarketingAsset {
  id: string;
  url: string;
  prompt: string;
  type: 'IMAGE' | 'VIDEO';
  createdAt: Date;
  agentName: string;
  scheduledFor?: Date;
  targetPlatform?: 'instagram' | 'tiktok' | 'whatsapp' | 'facebook';
  caption?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  type: AgentType;
  systemPrompt: string;
  knowledgeBase: string[];
  knowledgeContent: string;
  enableKnowledgeBase: boolean;
  allowWebSearch: boolean;
  webSearchQueryTemplate?: string;
  avatarColor: string;
  strictMode: boolean; 
  constraints: string[]; 
  triggers: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isRouter: boolean;
  handoffInstructions: string; 
  voiceConfig?: VoiceSettings;
  agendaConfig?: AgendaSettings;
  marketingConfig?: MarketingSettings;
}

export interface ChannelConfig {
  id: string;
  name: string;
  icon?: any; 
  platformId: 'whatsapp' | 'instagram' | 'messenger';
  color: string;
  connected: boolean;
  desc: string;
  credentials?: {
    accessToken?: string;
    accountId?: string;
    webhookVerifyToken?: string;
    webhookCallbackUrl?: string;
    method: 'OAUTH' | 'WEBHOOK' | 'API_TOKEN';
  }
}

export interface UnifiedMessage {
  id: string;
  contactName: string;
  lastMessage: string;
  timestamp: Date;
  platform: 'whatsapp' | 'instagram' | 'messenger';
  unread: boolean;
  avatar: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  platform?: 'whatsapp' | 'instagram' | 'messenger';
  agentName?: string;
  mediaUrl?: string; // Support for showing generated images in chat
}

export interface Appointment {
  id: string;
  time: string;
  title: string;
  client: string;
  platform: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  dueTime: string;
  completed: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  agentSource?: string;
}

export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
