/* Read It To Me — page reader.
   Extracts readable sentences, hands them to the worker, and highlights the
   sentence being spoken. Injected on demand, never on page load. */

(() => {
  if (window.__readItToMe) return;
  window.__readItToMe = true;

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'TEXTAREA', 'SELECT',
    'OPTION', 'IFRAME', 'VIDEO', 'AUDIO', 'TEMPLATE'
  ]);
  const CHROME_SELECTOR =
    'nav, header, footer, aside, form, [role="navigation"], [role="banner"], ' +
    '[role="contentinfo"], [role="search"], [aria-hidden="true"], [hidden]';
  const MAX_CHUNK = 320;

  let ranges = [];       // Range per spoken chunk, same indexes as the worker's
  let offset = 0;        // index of the first chunk we handed over
  let picking = false;

  /* ------------------------------------------------------------ extraction */

  const displayCache = new WeakMap();
  function isBlock(el) {
    if (displayCache.has(el)) return displayCache.get(el);
    const display = getComputedStyle(el).display;
    const block = !(display === 'inline' || display === 'inline-block' || display === 'contents');
    displayCache.set(el, block);
    return block;
  }

  function blockOwner(node) {
    let el = node.parentElement;
    while (el && !isBlock(el)) el = el.parentElement;
    return el;
  }

  function isVisible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  }

  function readableRoot() {
    const candidates = ['article', '[role="main"]', 'main', '#content', '.post', '.article-body'];
    for (const selector of candidates) {
      const el = document.querySelector(selector);
      if (el && el.innerText && el.innerText.trim().length > 400) return el;
    }
    return document.body;
  }

  // Flattens the readable text nodes into one string plus a node/offset map,
  // so a sentence found in the string can be turned back into a DOM Range.
  function flatten(root, restrictToChrome) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (restrictToChrome && parent.closest(CHROME_SELECTOR)) return NodeFilter.FILTER_REJECT;
        if (!isVisible(parent)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let text = '';
    const map = [];
    let previousBlock = null;
    let node;
    while ((node = walker.nextNode())) {
      const owner = blockOwner(node);
      if (previousBlock && owner !== previousBlock) text += '\n';
      previousBlock = owner;
      const start = text.length;
      text += node.nodeValue;
      map.push({ node, start, end: text.length });
    }
    return { text, map };
  }

  // Sentence splitter: breaks on terminators and line breaks, then hard-wraps
  // anything still too long so no single utterance runs away.
  function splitSentences(text) {
    const spans = [];
    const pattern = /[^\n]*?(?:[.!?…]["'”’)\]]*\s+|\n+|$)/g;
    let match;
    while ((match = pattern.exec(text))) {
      if (match[0] === '') { pattern.lastIndex += 1; continue; }
      let start = match.index;
      let end = match.index + match[0].length;
      while (start < end && /\s/.test(text[start])) start += 1;
      while (end > start && /\s/.test(text[end - 1])) end -= 1;
      if (end - start < 2) continue;
      if (end - start <= MAX_CHUNK) { spans.push([start, end]); continue; }
      let cursor = start;
      while (cursor < end) {
        let stop = Math.min(cursor + MAX_CHUNK, end);
        if (stop < end) {
          const slice = text.slice(cursor, stop);
          const breakAt = Math.max(slice.lastIndexOf(', '), slice.lastIndexOf('; '), slice.lastIndexOf(' — '), slice.lastIndexOf(' '));
          if (breakAt > MAX_CHUNK * 0.4) stop = cursor + breakAt + 1;
        }
        spans.push([cursor, stop]);
        cursor = stop;
      }
    }
    return mergeAbbreviations(spans, text);
  }

  // "Dr. Smith" should not become two utterances; a break after a known
  // abbreviation or an initial is re-joined when the result is still short.
  const ABBREVIATION = /(?:^|[\s("'])(?:mr|mrs|ms|dr|prof|sr|jr|st|vs|etc|inc|ltd|co|fig|no|vol|approx|e\.g|i\.e|[a-z])\.$/i;

  function mergeAbbreviations(spans, text) {
    const merged = [];
    for (const span of spans) {
      const previous = merged[merged.length - 1];
      if (
        previous &&
        ABBREVIATION.test(text.slice(previous[0], previous[1])) &&
        span[1] - previous[0] <= MAX_CHUNK
      ) {
        previous[1] = span[1];
        continue;
      }
      merged.push([span[0], span[1]]);
    }
    return merged;
  }

  function locate(map, position) {
    let low = 0;
    let high = map.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (position < map[mid].start) high = mid - 1;
      else if (position >= map[mid].end) low = mid + 1;
      else return { node: map[mid].node, offset: position - map[mid].start };
    }
    const last = map[Math.min(low, map.length - 1)];
    return last ? { node: last.node, offset: Math.min(position - last.start, last.node.nodeValue.length) } : null;
  }

  function buildChunks(root, restrictToChrome) {
    const { text, map } = flatten(root, restrictToChrome);
    if (!map.length) return { chunks: [], ranges: [] };
    const chunks = [];
    const built = [];
    for (const [start, end] of splitSentences(text)) {
      const spoken = text.slice(start, end).replace(/\s+/g, ' ').trim();
      if (!/[\p{L}\p{N}]/u.test(spoken)) continue;
      const from = locate(map, start);
      const to = locate(map, end - 1);
      if (!from || !to) continue;
      const range = document.createRange();
      try {
        range.setStart(from.node, from.offset);
        range.setEnd(to.node, Math.min(to.offset + 1, to.node.nodeValue.length));
      } catch (e) {
        continue;
      }
      chunks.push(spoken);
      built.push(range);
    }
    return { chunks, ranges: built };
  }

  function selectionChunks() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return null;
    const range = selection.getRangeAt(0);
    const holder = range.commonAncestorContainer;
    const root = holder.nodeType === Node.ELEMENT_NODE ? holder : holder.parentElement;
    const all = buildChunks(root, false);
    const kept = { chunks: [], ranges: [] };
    for (let i = 0; i < all.ranges.length; i += 1) {
      if (range.intersectsNode(all.ranges[i].startContainer) || range.intersectsNode(all.ranges[i].endContainer)) {
        kept.chunks.push(all.chunks[i]);
        kept.ranges.push(all.ranges[i]);
      }
    }
    return kept.chunks.length ? kept : { chunks: [selection.toString().replace(/\s+/g, ' ').trim()], ranges: [range] };
  }

  function firstVisibleIndex(list) {
    for (let i = 0; i < list.length; i += 1) {
      const rect = list[i].getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) return i;
    }
    return 0;
  }

  function extract(mode) {
    let result;
    let start = 0;

    if (mode === 'selection' || (mode === 'auto' && selectionChunks())) {
      result = selectionChunks();
      if (!result) return { chunks: [] };
    } else {
      result = buildChunks(readableRoot(), true);
      if (mode === 'visible') start = firstVisibleIndex(result.ranges);
      if (mode && typeof mode === 'object' && typeof mode.from === 'number') start = mode.from;
    }

    ranges = result.ranges;
    offset = start;
    return { chunks: result.chunks.slice(start) };
  }

  /* ----------------------------------------------------------- highlighting */

  const canHighlight = typeof Highlight === 'function' && typeof CSS !== 'undefined' && CSS.highlights;

  function highlight(index, autoScroll) {
    const range = ranges[index + offset];
    if (!range) return;
    if (canHighlight) {
      try {
        CSS.highlights.set('rit-reading', new Highlight(range));
      } catch (e) {
        // Range detached by a page re-render; ignore and keep speaking.
      }
    }
    if (!autoScroll) return;
    const rect = range.getBoundingClientRect();
    if (rect.height === 0 && rect.width === 0) return;
    if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
      window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight / 3, behavior: 'smooth' });
    }
  }

  function clearHighlight() {
    if (canHighlight) CSS.highlights.delete('rit-reading');
  }

  /* ------------------------------------------------------------- pick mode */

  function chunkIndexAt(target) {
    for (let i = 0; i < ranges.length; i += 1) {
      const container = ranges[i].startContainer.parentElement;
      if (container && (container === target || container.contains(target) || target.contains(container))) return i;
    }
    return -1;
  }

  function onPickClick(event) {
    const index = chunkIndexAt(event.target);
    setPicking(false);
    if (index < 0) return;
    event.preventDefault();
    event.stopPropagation();
    chrome.runtime.sendMessage({ type: 'RIT_READ_FROM', chunkIndex: index });
  }

  function setPicking(on) {
    picking = on;
    document.documentElement.classList.toggle('rit-picking', on);
    if (on) {
      if (!ranges.length) buildChunksIntoState();
      document.addEventListener('click', onPickClick, true);
    } else {
      document.removeEventListener('click', onPickClick, true);
    }
  }

  function buildChunksIntoState() {
    const result = buildChunks(readableRoot(), true);
    ranges = result.ranges;
    offset = 0;
  }

  /* -------------------------------------------------------------- messaging */

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message && message.type) {
      case 'RIT_EXTRACT':
        sendResponse(extract(message.mode));
        break;
      case 'RIT_HIGHLIGHT':
        highlight(message.index, message.autoScroll);
        sendResponse({ ok: true });
        break;
      case 'RIT_CLEAR':
        clearHighlight();
        sendResponse({ ok: true });
        break;
      case 'RIT_PICK':
        setPicking(true);
        sendResponse({ ok: true });
        break;
      default:
        sendResponse({ ok: false });
    }
    return true;
  });
})();
