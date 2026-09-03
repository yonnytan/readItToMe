/* Read It To Me — options page. Same controls as the popup, minus transport. */

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

async function loadVoices(selected) {
  const { voices = [] } = await send({ type: 'RIT_GET_VOICES' });
  const select = $('voice');
  select.innerHTML = '';
  if (!voices.length) {
    select.append(new Option('No voices installed', ''));
    return;
  }
  const addGroup = (label, list) => {
    if (!list.length) return;
    const group = document.createElement('optgroup');
    group.label = label;
    for (const voice of list) {
      group.append(new Option(`${voice.voiceName}${voice.lang ? ` (${voice.lang})` : ''}`, voice.voiceName));
    }
    select.append(group);
  };
  addGroup('Most natural', voices.filter((v) => v.natural));
  addGroup('Other voices', voices.filter((v) => !v.natural));
  select.value = selected && voices.some((v) => v.voiceName === selected) ? selected : voices[0].voiceName;
}

function bindSlider(id, valueId, format, key) {
  const input = $(id);
  input.addEventListener('input', () => {
    $(valueId).textContent = format(Number(input.value));
  });
  input.addEventListener('change', () => chrome.storage.sync.set({ [key]: Number(input.value) }));
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

  $('voice').addEventListener('change', () => chrome.storage.sync.set({ voiceName: $('voice').value }));
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
  $('highlight').addEventListener('change', () => chrome.storage.sync.set({ highlight: $('highlight').checked }));
  $('autoScroll').addEventListener('change', () => chrome.storage.sync.set({ autoScroll: $('autoScroll').checked }));
}

init();
