# Manual test pass before uploading

Load `extension/` unpacked at `chrome://extensions` (Developer mode on), then walk this list. Any
failure here is much cheaper to fix now than after a review cycle.

1. **Reads a page.** Open a long article. Click the toolbar icon → *Read this page*. Audio starts
   within a second, nav/footer text is not read, the spoken sentence is highlighted in amber, and
   the page scrolls to keep it in view.
2. **Survives an idle worker.** Let it read continuously for two minutes without touching anything.
   It must not stop between sentences (this is the MV3 service-worker keepalive).
3. **Selection.** Select two paragraphs → right-click → *Read this out loud*. Only the selection is
   read.
4. **From the top of the screen.** Scroll halfway down, open the popup, click *From the top of the
   screen*. Reading starts from the first sentence visible, not from the top of the article.
5. **Click to start.** Popup → *Click a paragraph to start there*; the cursor becomes a crosshair;
   click a paragraph well down the page; reading starts there.
6. **Transport.** Pause, resume, skip forward, skip back, stop — each takes effect immediately, and
   the highlight clears on stop.
7. **Settings persist.** Change voice, speed, pitch and volume; close and reopen the popup; the
   values are still there and the next read uses them.
8. **Preview.** *Hear this voice* speaks a sample in the selected voice at the current speed.
9. **Shortcuts.** `Alt`+`R`, `Alt`+`P`, `Alt`+`S` behave as labelled.
10. **Restricted pages.** On `chrome://extensions` the popup shows the "Chrome blocks extensions
    here" message rather than failing silently.
11. **Tab changes.** Navigating or closing the tab being read stops the audio.
12. **Console.** No errors in the page console, the popup console, or the service-worker console
    (`chrome://extensions` → *service worker*).
