export enum AppMode {
  HOME = 'HOME',
  TRANSLATE = 'TRANSLATE',
  PRONUNCIATION = 'PRONUNCIATION',
  SCENARIO = 'SCENARIO',
  LIVE_TUTOR = 'LIVE_TUTOR',
  MEDIA_ANALYSIS = 'MEDIA_ANALYSIS',
  CULTURE_SEARCH = 'CULTURE_SEARCH'
}

export interface PronunciationResult {
  original: string;
  phonetic_spanish: string; // e.g. "Jelou"
  translation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  audioData?: string; // Base64 audio for TTS playback
}

export interface ScenarioVideo {
  uri: string;
  expiry?: string;
}
