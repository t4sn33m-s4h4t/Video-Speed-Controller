# ⚡ Video Speed Controller

> A lightweight Chrome/Edge extension to control HTML5 video playback speed on **any website** — with keyboard shortcuts, a clean on-screen overlay, and a settings popup.

![Chrome](https://img.shields.io/badge/Chrome-supported-4285F4?logo=googlechrome&logoColor=white)
![Edge](https://img.shields.io/badge/Edge-supported-0078D7?logo=microsoftedge&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📥 Download & Install

### Direct Download

1. **[⬇ Download the latest ZIP](https://github.com/YOUR_USERNAME/video-speed-controller/releases/latest/download/video-speed-controller.zip)**
2. Unzip the file
3. Open Chrome → go to `chrome://extensions/`  
   *(Edge: `edge://extensions/`)*
4. Enable **Developer mode** (toggle in the top-right corner)
5. Click **"Load unpacked"** and select the unzipped `video-speed-controller` folder
6. Done! Reload any page with a video.

 
## ✨ Features

| Feature | Details |
|---|---|
| ⌨️ Keyboard shortcuts | `Shift+Z` slower · `Shift+X` faster · `Shift+R` reset |
| 🎛 On-screen overlay | `−` · speed display · `+` · reset — floats near video controls |
| 🏷 Speed badge | Flashes top-left on the video whenever speed changes |
| 💾 Persistent speed | Remembers your last speed across page reloads and sessions |
| ⚙️ Adjustable step | Choose 0.1x / 0.25x / 0.5x / 1x per keypress in settings |
| 🌐 Works everywhere | YouTube, Netflix, Twitch, Vimeo, and any HTML5 `<video>` |
| 🚀 Speed range | 0.25x → 16x |

---

## 🎮 How to Use

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Shift` + `Z` | Decrease speed by current step |
| `Shift` + `X` | Increase speed by current step |
| `Shift` + `R` | Reset speed to 1x |

### On-Screen Overlay

A **`− [speed] + ↺`** bar appears near the bottom of every video automatically. It stays semi-transparent (40% opacity) so it doesn't block the video, and becomes fully visible on hover.

### Popup (toolbar icon)

Click the extension icon in your browser toolbar to open the popup:

- **Speed tab** — see current speed, adjust with `+`/`−` buttons, or pick a preset (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x, 3x...)
- **Settings tab** — choose how much each keypress changes speed (0.1x / 0.25x / 0.5x / 1x)
- **Help tab** — keyboard shortcut reference and tips

---

## 📁 File Structure

```
video-speed-controller/
├── manifest.json     # Extension config (Manifest V3)
├── content.js        # Core logic: overlay injection, keyboard, speed control
├── popup.html        # Popup UI
├── popup.js          # Popup logic
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## 🛠 Development

No build step required — it's plain HTML, CSS, and JS.

To make changes:
1. Edit the files directly
2. Go to `chrome://extensions/`
3. Click the **↻ refresh icon** on the extension card
4. Hard-refresh (`Ctrl+Shift+R`) any open tab you want to test on

---

## 🤔 Troubleshooting

**Overlay not appearing?**  
Reload the page after installing. Some video players (e.g. YouTube) load videos dynamically — the extension rescans after 0.8s and 2.5s automatically.

**Speed not changing?**  
After updating the extension, you must: (1) click ↻ refresh on the extension card in `chrome://extensions/`, then (2) hard-refresh the tab with `Ctrl+Shift+R`.

**Shortcuts not working?**  
Make sure you're not focused on an input field or the video player's own search bar.
 
 