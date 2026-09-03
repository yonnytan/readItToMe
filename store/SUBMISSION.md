# Chrome Web Store submission — step by step

Everything the store asks for is already prepared in this repo. What is left are the steps that
require signing into your Google account, paying Google's one-time developer fee, and accepting
their developer agreement — those have to be done by you, from your own account.

Budget about 15 minutes. Review typically takes a few hours to a few days.

---

## 0. Before you start

| You need | Where it is |
| --- | --- |
| The upload package | `dist/read-it-to-me-1.0.0.zip` — run `./scripts/build.sh` |
| Store icon, 128×128 | `store/assets/icon-128.png` |
| Screenshots, 1280×800 | `store/assets/screenshot-1.png`, `-2.png`, `-3.png` |
| Promo tiles (optional) | `store/assets/promo-440x280.png`, `promo-1400x560.png` |
| All listing text | `store/listing.md` |
| Privacy policy URL | `https://github.com/yonnytan/readItToMe/blob/main/PRIVACY.md` |
| A one-time US$5 fee | Paid to Google with a card, once, for the developer account |

**Make the repository public first** (`gh repo edit yonnytan/readItToMe --visibility public`).
The privacy-policy URL you give Google must be publicly reachable, or the item is rejected.

> The screenshots in `store/assets/` were rendered from the extension's real popup and options UI
> on a sample article. They are accurate and usable as-is. If you prefer captures from your own
> browser, load the extension unpacked, open it on a real article, and screenshot at 1280×800 —
> just replace the files with the same names.

---

## 1. Create the developer account

1. Go to <https://chrome.google.com/webstore/devconsole>.
2. Sign in with the Google account that should own the extension. **Pick carefully** — the account
   cannot be changed later, and its name may be shown publicly as the publisher.
3. Accept the Developer Agreement.
4. Pay the one-time US$5 registration fee.
5. Under **Account**, fill in the publisher display name and a contact email, then **verify that
   email**. Unverified contact email blocks publishing.

## 2. Upload the package

1. **Items → + New Item**.
2. Drag in `dist/read-it-to-me-1.0.0.zip`.
3. Wait for the upload to be processed — the draft listing opens automatically.

## 3. Fill the Store listing tab

Copy each field from `store/listing.md`:

- **Item name**, **Summary**, **Detailed description**
- **Category:** Accessibility
- **Language:** English (United States)
- **Store icon:** `store/assets/icon-128.png`
- **Screenshots:** upload all three `screenshot-*.png`
- **Promo tiles:** optional, but they are ready — upload both
- **Official URL / homepage:** `https://github.com/yonnytan/readItToMe`
- **Support URL:** `https://github.com/yonnytan/readItToMe/issues`

## 4. Fill the Privacy tab

This is where most first submissions get rejected, so do it exactly:

1. **Single purpose** — paste the single-purpose paragraph from `store/listing.md`.
2. **Permission justifications** — paste the block for each of `tts`, `activeTab`, `scripting`,
   `storage`, `contextMenus`. Every listed permission needs one, or the form will not submit.
3. **Remote code** — select **No, I am not using remote code**.
4. **Data usage** — tick **nothing** in the collection list (the extension collects nothing), then
   tick all three certification checkboxes.
5. **Privacy policy URL** — paste the PRIVACY.md URL above.

## 5. Fill the Distribution tab

- Visibility: **Public**
- Regions: **All regions**
- No ads, no in-app purchases, free.

## 6. Submit

1. Click **Submit for review** (top right).
2. Leave **Publish automatically after review** ticked if you want it live the moment it passes.
3. The item moves to **Pending review**. Google emails the outcome to your verified address.

---

## If it comes back rejected

The rejection email always names a policy section. The likely ones here, and the fix:

- **"Request for permissions not needed"** — re-read the justifications in `store/listing.md`; the
  extension already avoids host permissions, so make sure each justification was actually pasted.
- **"Privacy policy not accessible"** — the repository is still private. Make it public.
- **"Screenshots do not demonstrate functionality"** — replace `store/assets/screenshot-*.png` with
  captures taken in your own browser with the extension loaded, then upload a new version.

Fix, bump `version` in `extension/manifest.json`, re-run `./scripts/build.sh`, upload the new zip,
and submit again.
