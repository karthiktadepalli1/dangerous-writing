import * as vscode from 'vscode';
import { SessionMode, SessionState } from './types';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private warningFlashInterval: ReturnType<typeof setInterval> | undefined;
  private isFlashOn: boolean = false;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'dangerous-writing.stopSession';
    this.statusBarItem.show();
  }

  update(
    mode: SessionMode,
    state: SessionState,
    timeRemaining: number,
    wordsRemaining: number,
    currentWordCount: number,
    warningCountdown?: number
  ): void {
    if (state === 'warning' && warningCountdown !== undefined) {
      this.showWarning(warningCountdown);
      return;
    }

    this.stopWarningFlash();

    if (mode === 'timer') {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      this.statusBarItem.text = `$(clock) ${timeStr} remaining | ${currentWordCount} words`;
      this.statusBarItem.backgroundColor = undefined;
      this.statusBarItem.tooltip = 'Dangerous Writing: Click to stop session';
    } else {
      const timeElapsed = Math.abs(timeRemaining); // In wordCount mode, we track elapsed time
      const minutes = Math.floor(timeElapsed / 60);
      const seconds = timeElapsed % 60;
      const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      this.statusBarItem.text = `$(edit) ${currentWordCount}/${currentWordCount + wordsRemaining} words | ${timeStr} elapsed`;
      this.statusBarItem.backgroundColor = undefined;
      this.statusBarItem.tooltip = 'Dangerous Writing: Click to stop session';
    }
  }

  private showWarning(countdown: number): void {
    if (!this.warningFlashInterval) {
      this.startWarningFlash();
    }

    const baseText = `$(warning) KEEP TYPING! ${countdown}s...`;
    this.statusBarItem.text = baseText;
    this.statusBarItem.tooltip = 'Your text will be deleted if you stop typing!';
  }

  private startWarningFlash(): void {
    this.warningFlashInterval = setInterval(() => {
      this.isFlashOn = !this.isFlashOn;
      this.statusBarItem.backgroundColor = this.isFlashOn
        ? new vscode.ThemeColor('statusBarItem.errorBackground')
        : new vscode.ThemeColor('statusBarItem.warningBackground');
    }, 500);
  }

  private stopWarningFlash(): void {
    if (this.warningFlashInterval) {
      clearInterval(this.warningFlashInterval);
      this.warningFlashInterval = undefined;
    }
    this.statusBarItem.backgroundColor = undefined;
    this.isFlashOn = false;
  }

  hide(): void {
    this.stopWarningFlash();
    this.statusBarItem.hide();
  }

  dispose(): void {
    this.stopWarningFlash();
    this.statusBarItem.dispose();
  }
}
