# Chrome Web Store listing — copy/paste sheet

Everything below is written to fit the Developer Dashboard's field limits. Paste as-is.

---

## Store listing tab

### Item name (max 75 characters — this is 45)

```
Read It To Me — Natural Text to Speech
```

### Summary / short description (max 132 characters — this is 118)

```
Listen to any page in a natural, human-sounding voice. Free, private, no account, no API key, no subscription.
```

### Detailed description (max 16,000 characters)

```
Read It To Me reads whatever is on your screen out loud, in a voice that actually sounds human.

Click once and the page is read to you — hands free, eyes free. Perfect for long articles, research papers, documentation, newsletters, or any time reading on a screen is tiring.

WHY IT SOUNDS HUMAN
Most free readers hand you the same flat, robotic voice. Read It To Me looks at every voice available on your computer and in Chrome, scores them for how natural they sound, and picks the best one for you automatically — the modern neural voices (Premium and Enhanced voices on macOS, Natural voices on Windows, and Google's network voices everywhere else) instead of the old synthetic ones. It also breaks the page into sentences so the pauses and rhythm land where a person would put them.

The options page shows you how to download your operating system's best voices — free, one time, a couple of clicks.

WHAT YOU CAN DO
• Read the whole page — the article text, without the menus, ads and footers
• Read just what you selected — highlight, right-click, "Read this out loud"
• Start from the top of what's on screen, or click any paragraph to start there
• Follow along — the sentence being spoken is highlighted and the page scrolls with it
• Skip a sentence forward or back, pause, resume, stop
• Set speed, pitch and volume, and hear a preview before you commit
• Keyboard shortcuts: Alt+R to read, Alt+P to pause or resume, Alt+S to stop

FREE, AND ACTUALLY FREE
No account. No sign-in. No API key. No trial. No paid tier. No ads. Speech comes from the engine already built into Chrome and your operating system, so there is no cloud bill behind it and nothing to upsell you.

PRIVATE BY DESIGN
Read It To Me collects nothing. No analytics, no tracking, no telemetry. The text of a page is passed straight to Chrome's speech engine and discarded when reading stops — it is never stored and never sent to the developer. The extension asks for no host permissions at all, so it has no standing access to any website; it can only touch a page in the moment you ask it to read that page. Your voice and speed settings sync through your own Chrome profile.

If you pick one of Chrome's "Google" network voices, Chrome itself sends the text to Google to be synthesised. Choose a voice installed on your own computer instead and everything stays offline.

OPEN SOURCE
Every line is public and auditable: https://github.com/yonnytan/readItToMe

A note on where it works: Chrome does not allow any extension to run on chrome:// pages, the Chrome Web Store, or the built-in PDF viewer, so reading is unavailable there.
```

### Category

`Accessibility`

### Language

`English (United States)`

---

## Graphic assets tab

| Asset | Requirement | File |
| --- | --- | --- |
| Store icon | 128×128 PNG | `store/assets/icon-128.png` |
| Screenshots (1–5) | 1280×800 PNG | `store/assets/screenshot-1.png` … |
| Small promo tile (optional) | 440×280 PNG | `store/assets/promo-440x280.png` |
| Marquee promo tile (optional) | 1400×560 PNG | `store/assets/promo-1400x560.png` |

---

## Privacy practices tab

### Single purpose description

```
Read It To Me has one purpose: to read the text of the web page the user is on out loud using Chrome's text-to-speech engine, with controls for the voice, speed, pitch and volume.
```

### Permission justifications

**tts**
```
Speaking text aloud is the extension's entire function. The tts permission is used to send the page text the user asked to have read to Chrome's built-in speech engine, and to list the available voices so the user can choose one.
```

**activeTab**
```
The extension needs the text of the page the user is currently looking at in order to read it aloud. activeTab is used so this access is granted only in the moment the user invokes the extension — by clicking its toolbar button, pressing its keyboard shortcut, or choosing its right-click menu item — instead of requesting standing access to websites.
```

**scripting**
```
Used to inject the reader script into the active tab on demand, only after the user invokes the extension. That script finds the readable text, splits it into sentences, and highlights the sentence currently being spoken so the user can follow along. No script is injected on page load and none runs on pages the user has not asked to have read.
```

**storage**
```
Used to save the user's own preferences — chosen voice, speed, pitch, volume, whether to highlight the current sentence, and whether to auto-scroll — so they persist between sessions. No page content and no personal data is stored.
```

**contextMenus**
```
Used to add "Read this out loud" and "Read this page out loud" items to the right-click menu, which is how many users prefer to start reading a selection.
```

**Remote code**: No, the extension does not use remote code. All logic ships in the package.

### Data usage disclosures

Tick **nothing** in the data-collection checklist, then check all three certification boxes:

- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

### Privacy policy URL

```
https://github.com/yonnytan/readItToMe/blob/main/PRIVACY.md
```

---

## Distribution tab

- **Visibility:** Public
- **Distribution:** All regions
- **Pricing:** Free (there is no paid option to configure — the store does not charge for the item and the extension contains no in-app purchases)
- **Contains ads:** No
