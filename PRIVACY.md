# Privacy Policy — Read It To Me

_Last updated: 3 September 2026_

**Read It To Me does not collect, store, sell, or transmit any personal data.**

## What the extension touches

- **Page text.** When you ask the extension to read (by clicking its button, using a keyboard
  shortcut, or using the right-click menu), it reads the text of that page in your browser and
  passes it to Chrome's own built-in speech engine (`chrome.tts`) to be spoken. The text is held in
  memory only while it is being read and is discarded when reading stops. It is never written to
  disk and never sent to any server operated by the developer or by any third party.
- **Your settings.** Your chosen voice, speed, pitch, volume, highlight and scroll preferences are
  saved with `chrome.storage.sync`, which stores them in your own Google Chrome profile. The
  developer has no access to them.

## What the extension does not do

- No analytics, telemetry, tracking pixels, or crash reporting.
- No advertising and no advertising identifiers.
- No accounts, sign-in, or payment.
- No remote code: all code that runs is contained in the published package.
- No selling or sharing of data with anyone, for any purpose.

## A note on Chrome's own voices

Some voices Chrome offers are *network* voices provided by Google. If you select one of those,
Chrome — not this extension — sends the text to Google to be synthesised, under
[Google's Privacy Policy](https://policies.google.com/privacy). Choosing a voice installed on your
own computer (macOS, Windows, ChromeOS or Linux system voices) keeps everything fully offline.

## Permissions and why they are needed

| Permission | Why |
| --- | --- |
| `tts` | To speak text using Chrome's speech engine. This is the extension's entire purpose. |
| `activeTab` | To read the text of the tab you are on, only after you invoke the extension. |
| `scripting` | To inject the reader script into that tab on demand, so it can find the text and highlight the sentence being spoken. |
| `storage` | To remember your voice and playback preferences. |
| `contextMenus` | To add the "Read this out loud" right-click item. |

The extension requests no host permissions, so it has no standing access to any website; it can
only touch a page in the moment you ask it to read that page.

## Children

The extension is suitable for all ages and collects no data from anyone, including children.

## Changes

Any change to this policy will be published in this file in the public repository at
<https://github.com/yonnytan/readItToMe>.

## Contact

Questions: open an issue at <https://github.com/yonnytan/readItToMe/issues>.
