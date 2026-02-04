import * as vscode from 'vscode';
import { DangerousWritingSession, startSession } from './session';

let currentSession: DangerousWritingSession | undefined;

export function activate(context: vscode.ExtensionContext) {
  const startTimerCommand = vscode.commands.registerCommand(
    'dangerous-writing.startTimerSession',
    async () => {
      if (currentSession) {
        const choice = await vscode.window.showWarningMessage(
          'A session is already active. Stop it and start a new one?',
          'Yes',
          'No'
        );
        if (choice !== 'Yes') {
          return;
        }
        currentSession.stop();
        currentSession = undefined;
      }

      currentSession = await startSession('timer');
    }
  );

  const startWordCountCommand = vscode.commands.registerCommand(
    'dangerous-writing.startWordCountSession',
    async () => {
      if (currentSession) {
        const choice = await vscode.window.showWarningMessage(
          'A session is already active. Stop it and start a new one?',
          'Yes',
          'No'
        );
        if (choice !== 'Yes') {
          return;
        }
        currentSession.stop();
        currentSession = undefined;
      }

      currentSession = await startSession('wordCount');
    }
  );

  const stopCommand = vscode.commands.registerCommand(
    'dangerous-writing.stopSession',
    () => {
      if (currentSession) {
        currentSession.stop();
        currentSession = undefined;
        vscode.window.showInformationMessage('Dangerous writing session stopped.');
      } else {
        vscode.window.showInformationMessage('No active session to stop.');
      }
    }
  );

  context.subscriptions.push(startTimerCommand, startWordCountCommand, stopCommand);
}

export function deactivate() {
  if (currentSession) {
    currentSession.stop();
    currentSession = undefined;
  }
}
