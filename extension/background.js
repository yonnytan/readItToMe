/* Read It To Me — background service worker.
   Owns all playback state so audio survives popup close and tab switches. */

const DEFAULTS = {
  voiceName: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  highlight: true,
  autoScroll: true
};

// Voice names that sound synthetic or are novelty voices. Ranked last.
const LOW_QUALITY = /\b(compact|espeak|pico|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|jester|junior|organ|ralph|superstar|trinoids|whisper|wobble|zarvox|bruce|fred|kathy|princess|victoria|agnes|hysterical|pipe organ)\b/i;
// Markers vendors use for their neural / high-fidelity voices.
const HIGH_QUALITY = /\b(natural|neural|premium|enhanced|siri|studio|wavenet|journey|online)\b/i;

const state = {
  tabId: null,
  chunks: [],
  index: 0,
  playing: false,
  paused: false
};

let keepAliveTimer = null;

/* ---------------------------------------------------------------- settings */

async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}

/* ------------------------------------------------------------------ voices */

// chrome.tts merges the OS voices with Chrome's own network voices. The remote
// ones are the neural voices, so they win ties.
function scoreVoice(voice) {
  const name = voice.voiceName || '';
  let score = 0;
  if (HIGH_QUALITY.test(name)) score += 100;
  if (voice.remote) score += 60;
  if (LOW_QUALITY.test(name)) score -= 200;
  if ((voice.lang || '').startsWith(navigator.language.slice(0, 2))) score += 25;
  if ((voice.lang || '') === navigator.language) score += 15;
  if (Array.isArray(voice.eventTypes) && voice.eventTypes.includes('word')) score += 5;
  return score;
}

function listVoices() {
  return new Promise((resolve) => {
    chrome.tts.getVoices((voices) => {
      const ranked = (voices || [])
        .filter((v) => v.voiceName)
        .map((v) => ({
          voiceName: v.voiceName,
          lang: v.lang || '',
          remote: !!v.remote,
          score: scoreVoice(v),
          natural: HIGH_QUALITY.test(v.voiceName || '') || !!v.remote
        }))
        .sort((a, b) => b.score - a.score || a.voiceName.localeCompare(b.voiceName));
      resolve(ranked);
    });
  });
}

async function bestVoiceName() {
  const voices = await listVoices();
  return voices.length ? voices[0].voiceName : '';
}

/* --------------------------------------------------------------- keepalive */

// An MV3 worker is torn down after ~30s idle, which would break the callback
// that advances to the next sentence. Touching an extension API resets it.
function startKeepAlive() {
  if (keepAliveTimer) return;
  keepAliveTimer = setInterval(() => chrome.runtime.getPlatformInfo(() => {}), 20000);
}

function stopKeepAlive() {
  clearInterval(keepAliveTimer);
  keepAliveTimer = null;
}

/* --------------------------------------------------------- content scripts */

async function ensureContentScript(tabId) {
  try {
    const [alive] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!window.__readItToMe
    });
    if (alive && alive.result) return true;
  } catch (e) {
    return false; // restricted page (chrome://, Web Store, PDF viewer, ...)
  }
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ['content/reader.css'] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/reader.js'] });
    return true;
  } catch (e) {
    return false;
  }
}

function tellTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      void chrome.runtime.lastError;
      resolve(response);
    });
  });
}

/* --------------------------------------------------------------- playback */

async function speakCurrent() {
  const settings = await getSettings();
  const text = state.chunks[state.index];
  if (text === undefined) return finish();

  const voiceName = settings.voiceName || (await bestVoiceName());
  const options = {
    rate: settings.rate,
    pitch: settings.pitch,
    volume: settings.volume,
    enqueue: false,
    onEvent: (event) => {
      if (event.type === 'end') {
        if (!state.playing || state.paused) return;
        state.index += 1;
        if (state.index >= state.chunks.length) return finish();
        speakCurrent();
      } else if (event.type === 'error') {
        finish();
      }
    }
  };
  if (voiceName) options.voiceName = voiceName;

  chrome.tts.speak(text, options);
  state.playing = true;
  state.paused = false;
  startKeepAlive();

  if (settings.highlight && state.tabId !== null) {
    tellTab(state.tabId, {
      type: 'RIT_HIGHLIGHT',
      index: state.index,
      autoScroll: settings.autoScroll
    });
  }
  broadcast();
}

function finish() {
  chrome.tts.stop();
  stopKeepAlive();
  state.playing = false;
  state.paused = false;
  if (state.tabId !== null) tellTab(state.tabId, { type: 'RIT_CLEAR' });
  broadcast();
}

async function startReading(tabId, mode) {
  chrome.tts.stop();
  const injected = await ensureContentScript(tabId);
  if (!injected) {
    broadcast({ error: 'This page cannot be read (Chrome blocks extensions here). Try a normal web page.' });
    return;
  }
  const result = await tellTab(tabId, { type: 'RIT_EXTRACT', mode });
  const chunks = (result && result.chunks) || [];
  if (!chunks.length) {
    broadcast({ error: mode === 'selection' ? 'Nothing is selected.' : 'No readable text found on this page.' });
    return;
  }
  state.tabId = tabId;
  state.chunks = chunks;
  state.index = 0;
  await speakCurrent();
}

function pause() {
  if (!state.playing || state.paused) return;
  chrome.tts.pause();
  state.paused = true;
  broadcast();
}

function resume() {
  if (!state.playing || !state.paused) return;
  chrome.tts.resume();
  state.paused = false;
  broadcast();
}

function skip(delta) {
  if (!state.chunks.length) return;
  const next = state.index + delta;
  if (next < 0 || next >= state.chunks.length) return finish();
  state.index = next;
  speakCurrent();
}

/* ---------------------------------------------------------------- messaging */

function snapshot(extra) {
  return {
    playing: state.playing,
    paused: state.paused,
    index: state.index,
    total: state.chunks.length,
    text: state.chunks[state.index] || '',
    ...extra
  };
}

function broadcast(extra) {
  chrome.runtime.sendMessage({ type: 'RIT_STATE', state: snapshot(extra) }, () => {
    void chrome.runtime.lastError; // no popup open
  });
}

async function activeTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ? tab.id : null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message && message.type) {
      case 'RIT_GET_STATE':
        sendResponse(snapshot());
        break;
      case 'RIT_GET_VOICES':
        sendResponse({ voices: await listVoices() });
        break;
      case 'RIT_READ': {
        const tabId = message.tabId ?? (await activeTabId());
        if (tabId !== null) await startReading(tabId, message.mode || 'page');
        sendResponse(snapshot());
        break;
      }
      case 'RIT_PAUSE':
        pause();
        sendResponse(snapshot());
        break;
      case 'RIT_RESUME':
        resume();
        sendResponse(snapshot());
        break;
      case 'RIT_STOP':
        finish();
        sendResponse(snapshot());
        break;
      case 'RIT_SKIP':
        skip(message.delta || 1);
        sendResponse(snapshot());
        break;
      case 'RIT_PREVIEW': {
        chrome.tts.stop();
        const settings = await getSettings();
        chrome.tts.speak(
          message.text || 'This is how I will read your pages out loud.',
          {
            voiceName: message.voiceName || settings.voiceName || (await bestVoiceName()),
            rate: message.rate ?? settings.rate,
            pitch: message.pitch ?? settings.pitch,
            volume: message.volume ?? settings.volume,
            enqueue: false
          }
        );
        sendResponse({ ok: true });
        break;
      }
      case 'RIT_READ_FROM': {
        // Content script asked us to start at the paragraph the user clicked.
        const tabId = sender.tab ? sender.tab.id : await activeTabId();
        if (tabId !== null) await startReading(tabId, { from: message.chunkIndex });
        sendResponse({ ok: true });
        break;
      }
      default:
        sendResponse({ ok: false });
    }
  })();
  return true; // async response
});

/* ------------------------------------------------------- entry points */

chrome.commands.onCommand.addListener(async (command) => {
  const tabId = await activeTabId();
  if (tabId === null) return;
  if (command === 'read-page') {
    if (state.playing) finish();
    else await startReading(tabId, 'auto');
  } else if (command === 'toggle-pause') {
    state.paused ? resume() : pause();
  } else if (command === 'stop-reading') {
    finish();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'rit-read-selection',
    title: 'Read this out loud',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'rit-read-page',
    title: 'Read this page out loud',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || tab.id === undefined) return;
  if (info.menuItemId === 'rit-read-selection') await startReading(tab.id, 'selection');
  if (info.menuItemId === 'rit-read-page') await startReading(tab.id, 'page');
});

// Stop if the page we were reading goes away or navigates.
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === state.tabId && state.playing) finish();
});
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (tabId === state.tabId && info.status === 'loading' && state.playing) finish();
});
