// Types for the application
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  genre: StoryGenre;
  length: StoryLength;
  prompt: string;
  creatorId: string;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  wordCount: number;
  estimatedReadingTime: number;
  views: number;
  likes: number;
  audioUrl?: string;
  hasAudio: boolean;
  hasStorybook: boolean;
  storybookId?: string;
}

export interface Storybook {
  id: string;
  storyId: string;
  title: string;
  pages: StorybookPage[];
  creatorId: string;
  createdAt: Date;
  totalDuration: number;
  pdfUrl?: string;
  animationData?: AnimationSequence[];
}

export interface StorybookPage {
  id: string;
  pageNumber: number;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  animationElements?: InteractiveElement[];
}

export interface InteractiveElement {
  id: string;
  type: 'character' | 'object' | 'magical-element' | 'background';
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl?: string;
  animation?: AnimationConfig;
  tooltip?: string;
  interactions?: ElementInteraction[];
}

export interface AnimationSequence {
  sceneId: string;
  triggerType: 'page-load' | 'text-reveal' | 'user-interaction' | 'time-based';
  triggerDelay: number;
  animations: AnimationConfig[];
  audioSync?: AudioCue;
}

export interface AnimationConfig {
  element: string;
  type: 'fadeIn' | 'slideIn' | 'scale' | 'rotate' | 'bounce' | 'particles' | 'shimmer';
  duration: number;
  delay: number;
  properties: {
    from: Record<string, any>;
    to: Record<string, any>;
  };
}

export interface AudioCue {
  audioId: string;
  timestamp: number;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface ElementInteraction {
  type: 'click' | 'hover' | 'drag';
  action: string;
  parameters?: Record<string, any>;
}

export type StoryGenre = 
  | 'fantasy' 
  | 'adventure' 
  | 'mystery' 
  | 'romance' 
  | 'sci-fi' 
  | 'horror' 
  | 'comedy' 
  | 'drama' 
  | 'thriller';

export type StoryLength = 'short' | 'medium' | 'long' | 'very long';

export interface AudioSettings {
  voice: string;
  pitch: number;
  speed: number;
  volume: number;
  voiceType?: 'male' | 'female' | 'child' | 'elderly';
}

export interface AIProvider {
  name: string;
  type: string;
  isHealthy: boolean;
  responseTime: number;
  errorRate: number;
  lastChecked: Date;
  quality: number;
}

export interface StoryCreationRequest {
  prompt: string;
  genre: StoryGenre;
  length: StoryLength;
  audioSettings?: AudioSettings;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}