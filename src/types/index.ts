export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  memoryUpdated?: boolean;
  memorySummary?: string;
}

export interface Suggestion {
  title: string;
  description: string;
  timeEstimate: string;
  references: string[];
}