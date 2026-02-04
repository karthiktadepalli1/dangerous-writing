export type SessionMode = 'timer' | 'wordCount';

export type SessionState = 'active' | 'warning' | 'stopped';

export interface SessionConfig {
  mode: SessionMode;
  target: number; // minutes for timer mode, word count for wordCount mode
  inactivityThreshold: number; // seconds before warning
  deleteCountdown: number; // seconds in warning before deletion
}

export interface SessionStats {
  startTime: number;
  startWordCount: number;
  currentWordCount: number;
  timeElapsed: number; // seconds
  timeRemaining: number; // seconds (for timer mode)
  wordsRemaining: number; // (for wordCount mode)
}
