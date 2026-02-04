# Dangerous Writing

A VS Code/Cursor extension that forces you to keep writing. Set a timer or word count goal, and if you stop typing for too long, all your session text gets deleted.

Inspired by [The Most Dangerous Writing App](https://www.squibler.io/dangerous-writing-prompt-app).

## Features

- **Timer Mode**: Write for a set number of minutes
- **Word Count Mode**: Write until you reach a target word count
- **Inactivity Warning**: Visual warning in the status bar when you stop typing
- **Automatic Deletion**: If you don't resume typing, your session text is deleted
- **Preserves Existing Text**: Only deletes text written during the session, not pre-existing content

## Installation

### From VSIX file

1. Download the latest `.vsix` file from the [Releases](https://github.com/karthiktadepalli1/dangerous-writing/releases) page
2. Install via command line:
   ```bash
   # For Cursor
   cursor --install-extension dangerous-writing-0.1.0.vsix

   # For VS Code
   code --install-extension dangerous-writing-0.1.0.vsix
   ```
   Or in the editor: `Cmd+Shift+P` (or `Ctrl+Shift+P`) → "Extensions: Install from VSIX..."

### Build from source

```bash
git clone https://github.com/karthiktadepalli1/dangerous-writing.git
cd dangerous-writing
npm install
npm run build
npx vsce package --allow-missing-repository
cursor --install-extension dangerous-writing-0.1.0.vsix
```

## Usage

1. Open any file in VS Code/Cursor
2. Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
3. Run one of:
   - **"Dangerous Writing: Start Timer Session"** - Write for X minutes
   - **"Dangerous Writing: Start Word Count Session"** - Write until X words
4. Enter your target (minutes or word count)
5. Start writing and don't stop!

The status bar shows your progress:
- Timer mode: `⏱ 4:32 remaining | 156 words`
- Word count mode: `✏ 144/300 words | 2:15 elapsed`
- Warning state: `⚠ KEEP TYPING! 5s...` (flashing)

## Configuration

In your VS Code/Cursor settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `dangerousWriting.inactivityThreshold` | 5 | Seconds of inactivity before warning appears |
| `dangerousWriting.deleteCountdown` | 5 | Seconds shown in warning before text is deleted |

## How It Works

1. When you start a session, the extension records the current document length
2. Every second, it checks if you've been typing
3. After 5 seconds of inactivity, a warning appears with a countdown
4. If you still don't type for another 5 seconds, all text written during the session is deleted
5. When you reach your goal (time or word count), the session ends quietly and your text is preserved

## License

MIT
