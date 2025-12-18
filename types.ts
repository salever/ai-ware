export interface ResearchPoint {
  id: string;
  content: string;
  isEnabled: boolean;
}

export interface ResearchSection {
  id: string;
  title: string;
  description: string;
  isEnabled: boolean;
  points: ResearchPoint[];
}

export interface ResearchPlan {
  title: string;
  objective: string;
  sections: ResearchSection[];
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_PLAN = 'GENERATING_PLAN',
  REVIEWING_PLAN = 'REVIEWING_PLAN',
  RESEARCHING = 'RESEARCHING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ResearchReport {
  title: string;
  markdown: string;
  sources: { title: string; uri: string }[];
  imageUrl?: string;
  wordCount: number;
  timeElapsed: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}