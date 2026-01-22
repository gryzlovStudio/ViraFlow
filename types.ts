
export type ProcessingStatus = 'idle' | 'uploading' | 'transcribing' | 'generating' | 'ready' | 'error';

export interface GeneratedContent {
  title: string;
  description: string;
  tags: string[];
  searchTags: string[];
}

export interface VideoState {
  name: string;
  size: number;
  type: string;
  previewUrl: string | null;
  transcription: string | null;
  result: GeneratedContent | null;
}

export interface AppState {
  status: ProcessingStatus;
  progress: number;
  error?: string;
}
