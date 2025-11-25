
export interface Book {
  id: string; // API compatible ID (e.g., 'romans')
  name: string;
  testament: 'Old' | 'New';
  themeColor: string; // e.g., 'from-red-900 to-orange-900'
  chapterCount: number;
}

export interface Chapter {
  bookId: string;
  chapterNumber: number;
  content: string; // Combined text
  verses: Verse[];
  reference: string;
}

export interface Verse {
  number: number;
  text: string;
}

export interface Tab {
  id: string;
  type: 'reader' | 'context' | 'map' | 'study';
  title: string;
  data?: any; // Flexible data based on type
  active: boolean;
}

export enum ViewMode {
  HOME = 'HOME',
  READ = 'READ',
  LISTEN = 'LISTEN',
  FOCUS_SETUP = 'FOCUS_SETUP',
  FOCUS_SESSION = 'FOCUS_SESSION',
  SESSION_SUMMARY = 'SESSION_SUMMARY',
  GROUP_STUDY = 'GROUP_STUDY',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export interface AIResponse {
  text: string;
  isLoading: boolean;
}

export interface RecordedSession {
  id: string;
  title: string;
  url: string;
  date: Date;
  duration: string;
  type: 'screen' | 'camera';
}
