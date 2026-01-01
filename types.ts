
export interface CinematicLayer {
  name: string;
  role: string;
  intensity: number;
}

export interface AnalysisResult {
  mood: string;
  bpm: number;
  energy: number;
  cinematicLayers: CinematicLayer[];
  report: string;
}

export interface VideoFile {
  file: File;
  previewUrl: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  MASTERING = 'MASTERING',
  COMPLETE = 'COMPLETE'
}
