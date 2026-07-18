/* ===============  VoiceifyNow — shared script  =============== */

/* ---------- Theme toggle ---------- */
(function initTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const stored = localStorage.getItem('vfy-theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = stored || (prefersLight ? 'light' : 'dark');

  applyTheme(initial);

  toggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('vfy-theme', next);
  });

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      if (toggle) toggle.textContent = '☀️';
    } else {
      root.removeAttribute('data-theme');
      if (toggle) toggle.textContent = '🌙';
    }
  }
})();

/* ---------- Mobile nav ---------- */
(function initNav() {
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
})();

/* ---------- Quick phrase grid (home page only) ---------- */
const phraseGrid = document.getElementById('phraseGrid');
const phrases = [
  { icon: '💧', text: "I'm thirsty" },
  { icon: '🍽️', text: "I'm hungry" },
  { icon: '😴', text: "I'm tired" },
  { icon: '🤕', text: "I'm hurt" },
  { icon: '😊', text: "I'm happy" },
  { icon: '😠', text: "I'm angry" },
  { icon: '😢', text: "I'm sad" },
  { icon: '😨', text: "I'm scared" },
  { icon: '🚪', text: "I want to go outside" },
  { icon: '🏠', text: "I want to go home" },
  { icon: '🏫', text: "I want to go to school" },
  { icon: '👵', text: "I want to visit grandma" },
];

if (phraseGrid) {
  phrases.forEach(({ icon, text }) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'phrase-card';
    card.innerHTML = `<span class="icon" aria-hidden="true">${icon}</span><span class="label">${text}</span>`;
    card.addEventListener('click', () => {
      if (textArea) textArea.value = text;
      speakCurrentText();
      card.classList.add('active');
      setTimeout(() => card.classList.remove('active'), 700);
    });
    phraseGrid.appendChild(card);
  });
}

/* ---------- Speech synthesis (home page) ---------- */
const voicesSelect = document.getElementById('voices');
const languageSelect = document.getElementById('language');
const textArea = document.getElementById('text');
const readBtn = document.getElementById('read');
const stopBtn = document.getElementById('stop');
const downloadBtn = document.getElementById('downloadAudio');
const statusNote = document.getElementById('statusNote');
const heroWave = document.getElementById('heroWave');
const autoTranslateCheckbox = document.getElementById('autoTranslate');

let allVoices = [];

const DEFAULT_STATUS = 'Typing in a different script (e.g. Hindi/Devanagari) is spoken as-is. English text is translated first if "Translate from English" is on.';

// Unicode-range based script detection — lets us tell whether the text the
// user already typed is in the target language's script, so we don't
// mistakenly run it through English→X translation and mangle it.
const SCRIPT_RANGES = {
  hi: /[\u0900-\u097F]/,        // Devanagari
  ja: /[\u3040-\u30FF\u4E00-\u9FFF]/, // Hiragana/Katakana/Kanji
};

function textMatchesScript(text, langCode) {
  const pattern = SCRIPT_RANGES[langCode];
  return pattern ? pattern.test(text) : false;
}

function loadVoices() {
  if (!voicesSelect) return;
  allVoices = speechSynthesis.getVoices();
  if (!allVoices.length) return;
  refreshVoiceOptions();
}

function refreshVoiceOptions() {
  if (!voicesSelect || !allVoices.length) return;
  const targetLang = languageSelect?.value || 'en';
  const matching = allVoices
    .map((voice, i) => ({ voice, i }))
    .filter(({ voice }) => voice.lang.toLowerCase().startsWith(targetLang));

  const list = matching.length ? matching : allVoices.map((voice, i) => ({ voice, i }));

  voicesSelect.innerHTML = '';
  list.forEach(({ voice, i }) => {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    voicesSelect.appendChild(option);
  });

  if (statusNote) {
    statusNote.textContent = matching.length
      ? DEFAULT_STATUS
      : `No installed voice matches "${targetLang}" on this device/browser — using the closest available voice instead. Pronunciation may be approximate.`;
  }
}

if (voicesSelect) {
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
  loadVoices();
}

languageSelect?.addEventListener('change', refreshVoiceOptions);

async function translateText(text, targetLang) {
  if (targetLang === 'en') return text;
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch (err) {
    console.error('Translation failed, speaking original text:', err);
    return text;
  }
}

async function resolveSpokenText(rawText, targetLang) {
  // Already written in the target script (e.g. Hindi typed directly)? Speak
  // it as-is — running it through English translation would mangle it.
  if (textMatchesScript(rawText, targetLang)) return rawText;

  // English target, or the "translate from English" toggle is off? Speak as typed.
  if (targetLang === 'en' || (autoTranslateCheckbox && !autoTranslateCheckbox.checked)) {
    return rawText;
  }

  return translateText(rawText, targetLang);
}

async function speakCurrentText() {
  if (!textArea || !textArea.value.trim()) return;
  readBtn && (readBtn.disabled = true);
  if (statusNote) statusNote.textContent = 'Preparing speech…';

  const langOption = languageSelect?.selectedOptions?.[0];
  const targetLang = languageSelect?.value || 'en';
  const ttsLang = langOption?.dataset?.tts || 'en-US';

  const spokenText = await resolveSpokenText(textArea.value.trim(), targetLang);

  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.lang = ttsLang;

  const chosenVoice = allVoices[voicesSelect?.value];
  if (chosenVoice) utterance.voice = chosenVoice;

  utterance.onstart = () => heroWave?.classList.add('speaking');
  utterance.onend = () => {
    heroWave?.classList.remove('speaking');
    if (readBtn) readBtn.disabled = false;
    if (statusNote) statusNote.textContent = DEFAULT_STATUS;
  };
  utterance.onerror = () => {
    heroWave?.classList.remove('speaking');
    if (readBtn) readBtn.disabled = false;
    if (statusNote) statusNote.textContent = 'Playback failed — this browser may not support that language/voice combination.';
  };

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

readBtn?.addEventListener('click', speakCurrentText);

stopBtn?.addEventListener('click', () => {
  speechSynthesis.cancel();
  heroWave?.classList.remove('speaking');
  if (readBtn) readBtn.disabled = false;
});

/* ---------- Downloadable audio via meSpeak (offline, client-side) ----------
   The native Web Speech API used above cannot export its audio — this is a
   browser platform limitation, not something VoiceifyNow can work around.
   For a downloadable file we use meSpeak.js instead, a separate, fully
   client-side synthesis engine that returns real WAV audio bytes. Voice
   quality differs from the live preview above. */
let meSpeakReady = false;
if (window.meSpeak) {
  meSpeak.loadConfig('https://cdn.jsdelivr.net/npm/mespeak@2.0.11/src/mespeak_config.json');
  meSpeak.loadVoice('https://cdn.jsdelivr.net/npm/mespeak@2.0.11/voices/en/en-us.json', () => {
    meSpeakReady = true;
  });
}

downloadBtn?.addEventListener('click', async () => {
  if (!textArea || !textArea.value.trim()) return;
  if (!window.meSpeak || !meSpeakReady) {
    if (statusNote) statusNote.textContent = 'Audio engine still loading — try again in a second.';
    return;
  }
  downloadBtn.disabled = true;
  const original = downloadBtn.textContent;
  downloadBtn.textContent = 'Generating…';

  const targetLang = languageSelect?.value || 'en';
  const spokenText = await resolveSpokenText(textArea.value.trim(), targetLang);

  const audioData = meSpeak.speak(spokenText, { rawdata: 'array' });
  if (audioData) {
    const blob = new Blob([new Uint8Array(audioData)], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voicifynow-speech.wav';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  downloadBtn.textContent = original;
  downloadBtn.disabled = false;
});