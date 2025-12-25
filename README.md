# Pomodoro Timer - Chrome Extension

A beautiful and functional Pomodoro timer extension for Chrome to boost your productivity.

## Features

✨ **Timer Management**
- Customizable work and break durations
- Clean, intuitive UI with a circular progress indicator
- Start, pause, and reset controls
- Easy switching between work and break sessions

📊 **Statistics Tracking**
- Track completed pomodoros
- Monitor total work and break time
- Daily statistics overview

⚙️ **Settings**
- Sound notifications when sessions complete
- Desktop notifications
- Auto-start break after work sessions complete
- Customizable timer durations (1-60 minutes for work, 1-30 minutes for breaks)

🎨 **Design**
- Modern, clean interface
- Orange theme (hex: #ff8c42)
- Responsive layout
- Smooth animations and transitions

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked" and select the extension folder
5. The Pomodoro Timer extension will appear in your Chrome toolbar

## Usage

1. **Set Duration**: Use the dropdowns to set your preferred work and break times
2. **Start Timer**: Click the play button to start the session
3. **Pause/Resume**: Use the pause button to pause, click play to resume
4. **Reset**: Click the reset button to return to the original duration
5. **View Stats**: Click the statistics tab to see your daily progress
6. **Adjust Settings**: Click the settings tab to customize notifications and behaviors

## Default Settings

- **Work Duration**: 20 minutes
- **Break Duration**: 5 minutes
- **Sound Notifications**: Enabled
- **Desktop Notifications**: Enabled
- **Auto-start Break**: Enabled

## Files Structure

```
├── manifest.json          # Extension configuration
├── popup.html            # UI markup
├── popup.css             # Styling
├── popup.js              # Timer logic and functionality
├── background.js         # Background service worker
├── icons/
│   ├── icon-16.svg      # 16px icon
│   ├── icon-32.svg      # 32px icon
│   ├── icon-48.svg      # 48px icon
│   └── icon-128.svg     # 128px icon
└── README.md             # This file
```

## How It Works

The extension stores your settings and statistics in Chrome's sync storage, so your data persists across sessions and syncs across your Chrome devices.

### Timer States
1. **Work Session**: Focus time (default 20 minutes)
2. **Break Session**: Rest time (default 5 minutes)

When a session ends:
- A sound plays (if enabled)
- A desktop notification appears (if enabled)
- For work sessions: automatically switches to break and can auto-start if enabled
- For break sessions: automatically switches to work

## Tips for Productivity

- Use the Pomodoro Technique: 25 minutes focused work + 5 minutes break
- Take longer breaks (15-30 minutes) after every 4 pomodoros
- Keep your phone away during work sessions
- Use the break time to stretch and rest your eyes
- Track your sessions to see your productivity patterns

## Technical Details

- **Manifest Version**: 3 (Chrome Extension Manifest V3)
- **Permissions Used**: notifications, storage
- **Storage**: Uses Chrome Sync Storage for cross-device sync
- **Audio**: Web Audio API for notifications
- **No External Dependencies**: Pure vanilla JavaScript

## Troubleshooting

**Extension not loading?**
- Make sure you're in Developer mode in Chrome
- Check that all required files are present
- Try disabling and re-enabling the extension

**Notifications not working?**
- Verify notifications are enabled in Chrome settings
- Check the extension settings tab
- Allow notifications when prompted by Chrome

**Data not syncing?**
- Make sure you're signed into Chrome
- Check Chrome's sync settings
- Local storage persists even without sync

## License

Free to use and modify for personal use.

## Contributing

Feel free to fork and improve this extension!
