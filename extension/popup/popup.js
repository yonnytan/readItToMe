/* Read It To Me — popup controls. All playback lives in the worker, so the
   popup only sends intents and renders whatever state comes back. */

const DEFAULTS = {
  voiceName: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  highlight: true,
  autoScroll: true
};

const $ = (id) => document.getElementById(id);
const send = (message) =>
  new Promise((resolve) => chrome.runtime.sendMessage(message, (r) => {
    void chrome.runtime.lastError;
    resolve(r || {});
  }));

function render(state) {
  const playing = !!state.playing;
  $('transport').hidden = !playing;
  $('toggle').textContent = state.paused ? 'Resume' : 'Pause';
  $('play').textContent = playing ? 'Restart from the top' : 'Read this page';
  $('now').textContent = playing ? state.text || '' : '';

  const status = $('status');
  status.classList.toggle('error', !!state.error);
  if (state.error) status.textContent = state.error;
  else if (playing) status.textContent = `Sentence ${state.index + 1} of ${state.total}`;
  else status.textContent = 'Alt+R reads · Alt+P pauses · Alt+S stops';
}

async function loadVoices(selected) {
  const { voices = [] } = await send({ type: 'RIT_GET_VOICES' });
  const select = $('voice');
  select.innerHTML = '';

  if (!voices.length) {
    select.append(new Option('No voices installed', ''));
    return;
  }

  const natural = voices.filter((v) => v.natural);
  const rest = voices.filter((v) => !v.natural);
  const addGroup = (label, list) => {
    if (!list.length) return;
    const group = document.createElement('optgroup');
    group.label = label;
    for (const voice of list) {
      const option = new Option(`${voice.voiceName}${voice.lang ? ` (${voice.lang})` : ''}`, voice.voiceName);
      group.append(option);
    }
    select.append(group);
  };
  addGroup('Most natural', natural);
  addGroup('Other voices', rest);

  select.value = selected && voices.some((v) => v.voiceName === selected) ? selected : voices[0].voiceName;
}

async function save(patch) {
  await chrome.storage.sync.set(patch);
}

function bindSlider(id, valueId, format, key) {
  const input = $(id);
  input.addEventListener('input', () => {
    $(valueId).textContent = format(Number(input.value));
  });
  input.addEventListener('change', () => save({ [key]: Number(input.value) }));
}

async function init() {
  const settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(DEFAULTS)) };

  $('rate').value = settings.rate;
  $('pitch').value = settings.pitch;
  $('volume').value = settings.volume;
  $('rateValue').textContent = `${settings.rate.toFixed(2).replace(/0$/, '')}×`;
  $('pitchValue').textContent = settings.pitch.toFixed(2).replace(/0$/, '');
  $('volumeValue').textContent = `${Math.round(settings.volume * 100)}%`;
  $('highlight').checked = settings.highlight;
  $('autoScroll').checked = settings.autoScroll;

  await loadVoices(settings.voiceName);
  render(await send({ type: 'RIT_GET_STATE' }));

  $('play').addEventListener('click', async () => render(await send({ type: 'RIT_READ', mode: 'auto' })));
  $('selection').addEventListener('click', async () => render(await send({ type: 'RIT_READ', mode: 'selection' })));
  $('visible').addEventListener('click', async () => render(await send({ type: 'RIT_READ', mode: 'visible' })));
  $('stop').addEventListener('click', async () => render(await send({ type: 'RIT_STOP' })));
  $('prev').addEventListener('click', async () => render(await send({ type: 'RIT_SKIP', delta: -1 })));
  $('next').addEventListener('click', async () => render(await send({ type: 'RIT_SKIP', delta: 1 })));
  $('toggle').addEventListener('click', async () => {
    const paused = $('toggle').textContent === 'Resume';
    render(await send({ type: paused ? 'RIT_RESUME' : 'RIT_PAUSE' }));
  });

  $('pick').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    try {
      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content/reader.css'] });
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/reader.js'] });
      chrome.tabs.sendMessage(tab.id, { type: 'RIT_PICK' }, () => void chrome.runtime.lastError);
      window.close();
    } catch (e) {
      render({ error: 'This page cannot be read (Chrome blocks extensions here).' });
    }
  });

  $('voice').addEventListener('change', () => save({ voiceName: $('voice').value }));
  $('preview').addEventListener('click', () =>
    send({
      type: 'RIT_PREVIEW',
      voiceName: $('voice').value,
      rate: Number($('rate').value),
      pitch: Number($('pitch').value),
      volume: Number($('volume').value)
    })
  );

  bindSlider('rate', 'rateValue', (v) => `${v.toFixed(2).replace(/0$/, '')}×`, 'rate');
  bindSlider('pitch', 'pitchValue', (v) => v.toFixed(2).replace(/0$/, ''), 'pitch');
  bindSlider('volume', 'volumeValue', (v) => `${Math.round(v * 100)}%`, 'volume');

  $('highlight').addEventListener('change', () => save({ highlight: $('highlight').checked }));
  $('autoScroll').addEventListener('change', () => save({ autoScroll: $('autoScroll').checked }));
  $('options').addEventListener('click', (event) => {
    event.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message && message.type === 'RIT_STATE') render(message.state);
  });
}

init();
