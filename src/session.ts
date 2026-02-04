import * as vscode from 'vscode';
import { SessionConfig, SessionMode, SessionState } from './types';
import { StatusBarManager } from './statusBar';

export class DangerousWritingSession {
  private editor: vscode.TextEditor;
  private config: SessionConfig;
  private statusBar: StatusBarManager;
  private state: SessionState = 'active';

  private startTime: number = 0;
  private startWordCount: number = 0;
  private startTextLength: number = 0; // Track where the original text ended
  private lastActivityTime: number = 0;

  private mainInterval: ReturnType<typeof setInterval> | undefined;
  private changeListener: vscode.Disposable | undefined;

  private warningCountdown: number = 0;
  private isInWarning: boolean = false;

  constructor(editor: vscode.TextEditor, config: SessionConfig) {
    this.editor = editor;
    this.config = config;
    this.statusBar = new StatusBarManager();
  }

  start(): void {
    this.startTime = Date.now();
    this.lastActivityTime = Date.now();
    this.startWordCount = this.getWordCount();
    this.startTextLength = this.editor.document.getText().length;
    this.state = 'active';

    this.setupChangeListener();
    this.startMainLoop();
    this.updateStatusBar();
  }

  stop(): void {
    this.state = 'stopped';
    this.cleanup();
  }

  private cleanup(): void {
    if (this.mainInterval) {
      clearInterval(this.mainInterval);
      this.mainInterval = undefined;
    }
    if (this.changeListener) {
      this.changeListener.dispose();
      this.changeListener = undefined;
    }
    this.statusBar.dispose();
  }

  private setupChangeListener(): void {
    this.changeListener = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document !== this.editor.document) {
        return;
      }

      // User is typing - reset inactivity
      this.lastActivityTime = Date.now();

      // Exit warning state if we were in it
      if (this.isInWarning) {
        this.isInWarning = false;
        this.state = 'active';
        this.warningCountdown = 0;
      }

      // Check if goal reached
      if (this.checkGoalReached()) {
        this.onGoalReached();
      }
    });
  }

  private startMainLoop(): void {
    this.mainInterval = setInterval(() => {
      if (this.state === 'stopped') {
        return;
      }

      const now = Date.now();
      const inactivitySeconds = Math.floor((now - this.lastActivityTime) / 1000);

      // Check for inactivity
      if (inactivitySeconds >= this.config.inactivityThreshold) {
        if (!this.isInWarning) {
          // Enter warning state
          this.isInWarning = true;
          this.state = 'warning';
          this.warningCountdown = this.config.deleteCountdown;
        } else {
          // Already in warning - decrement countdown
          this.warningCountdown--;
          if (this.warningCountdown <= 0) {
            this.deleteSessionText();
            return;
          }
        }
      }

      // Check timer mode completion
      if (this.config.mode === 'timer') {
        const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
        const targetSeconds = this.config.target * 60;
        if (elapsedSeconds >= targetSeconds) {
          this.onGoalReached();
          return;
        }
      }

      this.updateStatusBar();
    }, 1000);
  }

  private updateStatusBar(): void {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.startTime) / 1000);
    const currentWordCount = this.getWordCount();
    const wordsWritten = currentWordCount - this.startWordCount;

    if (this.config.mode === 'timer') {
      const targetSeconds = this.config.target * 60;
      const timeRemaining = Math.max(0, targetSeconds - elapsedSeconds);
      this.statusBar.update(
        this.config.mode,
        this.state,
        timeRemaining,
        0,
        currentWordCount,
        this.isInWarning ? this.warningCountdown : undefined
      );
    } else {
      const wordsRemaining = Math.max(0, this.config.target - wordsWritten);
      this.statusBar.update(
        this.config.mode,
        this.state,
        elapsedSeconds, // Pass elapsed time for wordCount mode
        wordsRemaining,
        wordsWritten,
        this.isInWarning ? this.warningCountdown : undefined
      );
    }
  }

  private getWordCount(): number {
    const text = this.editor.document.getText();
    if (!text.trim()) {
      return 0;
    }
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private checkGoalReached(): boolean {
    if (this.config.mode === 'wordCount') {
      const currentWordCount = this.getWordCount();
      const wordsWritten = currentWordCount - this.startWordCount;
      return wordsWritten >= this.config.target;
    }
    // Timer mode is checked in the main loop
    return false;
  }

  private onGoalReached(): void {
    this.stop();
    // Session ends quietly as per user preference
  }

  private async deleteSessionText(): Promise<void> {
    this.state = 'stopped';

    const document = this.editor.document;
    const currentLength = document.getText().length;

    // Only delete text written after the session started
    if (currentLength > this.startTextLength) {
      const deleteRange = new vscode.Range(
        document.positionAt(this.startTextLength),
        document.positionAt(currentLength)
      );

      await this.editor.edit((editBuilder) => {
        editBuilder.delete(deleteRange);
      });

      vscode.window.showErrorMessage('Your session text has been deleted. You stopped typing!');
    } else {
      vscode.window.showErrorMessage('Session ended - no new text was written.');
    }

    this.cleanup();
  }
}

export async function startSession(mode: SessionMode): Promise<DangerousWritingSession | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor. Open a file first.');
    return undefined;
  }

  // Get configuration
  const config = vscode.workspace.getConfiguration('dangerousWriting');
  const inactivityThreshold = config.get<number>('inactivityThreshold', 5);
  const deleteCountdown = config.get<number>('deleteCountdown', 5);

  // Prompt for target
  let target: number;

  if (mode === 'timer') {
    const input = await vscode.window.showInputBox({
      prompt: 'Enter session duration in minutes',
      placeHolder: '5',
      validateInput: (value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          return 'Please enter a positive number';
        }
        if (num > 180) {
          return 'Maximum duration is 180 minutes (3 hours)';
        }
        return null;
      }
    });

    if (!input) {
      return undefined; // User cancelled
    }
    target = parseFloat(input);
  } else {
    const input = await vscode.window.showInputBox({
      prompt: 'Enter target word count',
      placeHolder: '300',
      validateInput: (value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
          return 'Please enter a positive number';
        }
        if (num > 10000) {
          return 'Maximum word count is 10,000';
        }
        return null;
      }
    });

    if (!input) {
      return undefined; // User cancelled
    }
    target = parseInt(input, 10);
  }

  const sessionConfig: SessionConfig = {
    mode,
    target,
    inactivityThreshold,
    deleteCountdown
  };

  const session = new DangerousWritingSession(editor, sessionConfig);
  session.start();

  const modeLabel = mode === 'timer' ? `${target} minute` : `${target} word`;
  vscode.window.showInformationMessage(
    `Dangerous writing session started! ${modeLabel} goal. Keep typing or lose everything!`
  );

  return session;
}
