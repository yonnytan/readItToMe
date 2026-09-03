/* Stubs the extension APIs so the REAL popup/options UI can be rendered in a
   plain browser tab for store screenshots. Not shipped in the extension. */
const DEMO_VOICES = [
  { voiceName: 'Ava (Premium)', lang: 'en-US', remote: false, natural: true },
  { voiceName: 'Zoe (Premium)', lang: 'en-US', remote: false, natural: true },
  { voiceName: 'Evan (Enhanced)', lang: 'en-US', remote: false, natural: true },
  { voiceName: 'Google US English', lang: 'en-US', remote: true, natural: true },
  { voiceName: 'Google UK English Female', lang: 'en-GB', remote: true, natural: true },
  { voiceName: 'Samantha', lang: 'en-US', remote: false, natural: false },
  { voiceName: 'Daniel', lang: 'en-GB', remote: false, natural: false }
];

const DEMO_SETTINGS = {
  voiceName: 'Ava (Premium)',
  rate: 1.1,
  pitch: 1.0,
  volume: 0.9,
  highlight: true,
  autoScroll: true
};

const DEMO_STATE = {
  playing: true,
  paused: false,
  index: 11,
  total: 86,
  text: 'The voices your computer already ships with are the same neural voices Siri uses.'
};

// Scenes override the "now reading" line via the query string.
const PARAMS = new URLSearchParams(location.search);
if (PARAMS.get('text')) DEMO_STATE.text = PARAMS.get('text');
if (PARAMS.get('index')) DEMO_STATE.index = Number(PARAMS.get('index'));
if (PARAMS.get('total')) DEMO_STATE.total = Number(PARAMS.get('total'));
if (PARAMS.get('voice')) DEMO_SETTINGS.voiceName = PARAMS.get('voice');

window.chrome = {
  runtime: {
    lastError: undefined,
    sendMessage(message, callback) {
      const reply =
        message && message.type === 'RIT_GET_VOICES' ? { voices: DEMO_VOICES } : DEMO_STATE;
      if (callback) setTimeout(() => callback(reply), 0);
    },
    onMessage: { addListener() {} },
    openOptionsPage() {}
  },
  storage: {
    sync: {
      get: async (defaults) => ({ ...defaults, ...DEMO_SETTINGS }),
      set: async () => {}
    }
  },
  tabs: { query: async () => [{ id: 1 }] },
  scripting: { insertCSS: async () => {}, executeScript: async () => {} }
};
