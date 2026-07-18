# VoiceifyNow

A browser-based Text-to-Speech (TTS) tool. Type text, pick a voice and language, and hear it read aloud — with quick one-tap phrases, live translation, and downloadable audio.

**[Live demo →](#)** *(add your GitHub Pages link here once deployed)*

## Features

- 🔊 **Natural speech** using the browser's built-in Web Speech API — pick from any voice installed on your system
- 🌐 **8 languages** — translates your text (via the free [MyMemory API](https://mymemory.translated.net/)) before speaking it
- ⚡ **Quick phrases** — one-tap common phrases, useful for AAC / fast hands-free communication
- ⬇️ **Downloadable audio** — export speech as a `.wav` file using [meSpeak.js](https://www.masswerk.at/mespeak/), a fully offline synthesis engine
- 🌗 **Dark / light theme**, saved to your browser
- 📱 Fully responsive, no build step, no backend, no API keys required

## Why two speech engines?

The browser's native Speech API (used for the "Speak" button) sounds great but — by design — never exposes its audio for you to save. There's no workaround for this; it's a platform limitation across all browsers. So "Download audio" uses a second, fully offline engine (meSpeak.js) that generates real audio bytes instead. It sounds more robotic than the live preview — that trade-off is what makes a truly key-free, backend-free download possible.

## Project structure

```
voicifynow/
├── index.html      # Home page — live demo + quick phrases
├── about.html       # About the project + team
├── contact.html     # Team contact info
├── style.css        # Shared design system (colors, type, layout)
├── script.js         # Theme toggle, speech, translation, audio export
└── README.md
```

## Running locally

No build tools needed — it's static HTML/CSS/JS.

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly by double-clicking also works in most browsers, though some browsers restrict `fetch` on the `file://` protocol — a local server avoids that.)

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages**.
3. Under **Source**, choose the `main` branch and `/ (root)` folder.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## Browser support

Requires a browser with the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) (Chrome, Edge, Safari — all current versions). Available voices vary by OS and browser.

## Credits

Built by students of JSS Academy of Technical Education, Noida.
