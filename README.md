# Read It To Me

A free Chrome extension that reads whatever is on your screen out loud, in a natural,
human-sounding voice — no account, no API key, no subscription, nothing sent anywhere.

<img src="store/assets/icon-128.png" width="72" alt="">

## What it does

- **Reads the page.** Pulls the article text out of the page and skips the nav, ads and footers.
- **Reads only what you select.** Highlight anything, right-click → *Read this out loud*.
- **Starts where you are.** Read from the top of the screen, or click a paragraph to start there.
- **Follows along.** Highlights the sentence being spoken and scrolls with it.
- **Natural voices.** Ranks every voice on your machine by how human it sounds and picks the best
  one by default — the neural voices (Siri/Premium on macOS, *Natural* on Windows, Google's network
  voices everywhere) instead of the classic robotic ones.
- **Full control.** Speed, pitch, volume, skip forward/back a sentence, pause and resume.
- **Keyboard.** `Alt`+`R` read · `Alt`+`P` pause/resume · `Alt`+`S` stop.

## Why the voices are free

Speech comes from `chrome.tts`, Chrome's built-in speech engine. That gives us two sets of voices
at no cost:

1. **Your operating system's voices**, including the free neural ones — Apple's Premium/Enhanced
   voices (the Siri voices) and Microsoft's *Natural* voices.
2. **Chrome's own network voices** (listed as *Google …*).

The extension scores them (`scoreVoice` in [`extension/background.js`](extension/background.js))
and puts the human-sounding ones first, so a good voice is chosen for you out of the box. There is
no paid cloud TTS service in the loop, so there is nothing to bill and no key to leak.

To unlock the very best voices, open the extension's options page and follow the one-time,
free download steps for your OS.

## Install from source

1. `git clone https://github.com/yonnytan/readItToMe.git`
2. Visit `chrome://extensions`, turn on **Developer mode**.
3. **Load unpacked** → select the `extension/` folder.

## Build the store package

```bash
./scripts/build.sh
```

Produces `dist/read-it-to-me-<version>.zip`, the file you upload to the Chrome Web Store.

## Layout

```
extension/
  manifest.json          Manifest V3
  background.js          service worker: owns playback, voices, shortcuts, menus
  content/reader.js      extracts sentences, highlights the one being read
  popup/                 toolbar UI
  options/               settings + how to install better free voices
store/                   everything the Chrome Web Store submission needs
scripts/                 icon generator, zip builder
```

## Privacy

Nothing is collected. Page text goes straight to Chrome's speech engine and is never stored or
transmitted by this extension. See [PRIVACY.md](PRIVACY.md).

## Licence

[MIT](LICENSE)
