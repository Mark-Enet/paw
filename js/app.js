
const h = React.createElement;

const SAMPLE_JSON = `{
  "store": {
    "name": "Northwind Traders",
    "established": 1998,
    "open": true,
    "location": { "city": "Seattle", "zip": "98101", "coords": [47.6062, -122.3321] },
    "departments": [
      { "id": "d1", "title": "Beverages", "products": 24, "featured": null },
      { "id": "d2", "title": "Produce", "products": 51, "featured": true }
    ],
    "tags": ["retail", "wholesale", "organic"]
  },
  "generatedAt": "2026-07-02T09:30:00Z"
}`;

const SAMPLE_DIFF_A = SAMPLE_JSON;
const SAMPLE_DIFF_B = `{
  "store": {
    "name": "Northwind Traders",
    "established": 1998,
    "open": false,
    "location": { "city": "Portland", "zip": "97201", "coords": [45.5152, -122.6784] },
    "departments": [
      { "id": "d1", "title": "Beverages", "products": 30, "featured": true },
      { "id": "d2", "title": "Produce", "products": 51, "featured": true },
      { "id": "d3", "title": "Bakery", "products": 12, "featured": null }
    ],
    "tags": ["retail", "organic", "local"]
  },
  "generatedAt": "2026-07-02T14:05:00Z"
}`;

function tokens(dir, theme) {
  const dark = theme === 'dark';
  const syn = dark
    ? { key:'#7db4ff', string:'#8fe0ad', number:'#f2b47a', bool:'#c9a6ff', nul:'#c9a6ff', punct:'#8b93a7', tag:'#ff90ae', attr:'#f2b47a' }
    : { key:'#2f6fd6', string:'#0a7d54', number:'#b5570f', bool:'#8a3ffc', nul:'#8a3ffc', punct:'#9096ac', tag:'#c1436d', attr:'#b5570f' };
  const match = dark ? { bg:'rgba(255,205,90,.24)', active:'rgba(255,205,90,.55)' } : { bg:'#ffe6a0', active:'#ffc93c' };
  const sem = dark
    ? { ok:'#4fd18b', warn:'#f2b47a', err:'#ff6b6b', okW:'rgba(79,209,139,.14)', errW:'rgba(255,107,107,.14)', warnW:'rgba(242,180,122,.14)', add:'rgba(79,209,139,.15)', del:'rgba(255,107,107,.15)' }
    : { ok:'#0a7d54', warn:'#b5570f', err:'#d23b3b', okW:'rgba(10,125,84,.09)', errW:'rgba(210,59,59,.08)', warnW:'rgba(181,87,15,.08)', add:'rgba(10,125,84,.1)', del:'rgba(210,59,59,.09)' };
  let c;
  if (dir === 'slate') {
    c = dark
      ? { bg:'#0b1016', panel:'#111a22', panel2:'#0d141b', elev:'#16212b', border:'#1e2b36', borderStrong:'#2b3a48', text:'#e6edf3', textDim:'#8fa0ae', textFaint:'#5b6b78', accent:'#2dd4bf', accentWeak:'rgba(45,212,191,.13)', accentContrast:'#04201c', radius:'8px', radiusSm:'6px', shadow:'0 1px 2px rgba(0,0,0,.4)' }
      : { bg:'#eef1f4', panel:'#ffffff', panel2:'#e8ecf1', elev:'#ffffff', border:'#d7dde4', borderStrong:'#c3ccd6', text:'#16202b', textDim:'#4d5b6a', textFaint:'#8a97a4', accent:'#0e9f96', accentWeak:'rgba(14,159,150,.11)', accentContrast:'#ffffff', radius:'8px', radiusSm:'6px', shadow:'0 1px 2px rgba(20,30,40,.06)' };
    c.fontUi = "'IBM Plex Sans', system-ui, sans-serif"; c.fontMono = "'IBM Plex Mono', ui-monospace, monospace";
  } else if (dir === 'paper') {
    c = dark
      ? { bg:'#161310', panel:'#211d16', panel2:'#191510', elev:'#26211a', border:'#332c22', borderStrong:'#453b2c', text:'#f2ece0', textDim:'#b0a693', textFaint:'#786e5c', accent:'#ef8a52', accentWeak:'rgba(239,138,82,.14)', accentContrast:'#2a1400', radius:'11px', radiusSm:'8px', shadow:'0 2px 8px rgba(0,0,0,.35)' }
      : { bg:'#f6f3ec', panel:'#fffdf8', panel2:'#f0ece1', elev:'#fffdf8', border:'#e6ddce', borderStrong:'#d8ccb6', text:'#241f18', textDim:'#6b6152', textFaint:'#9a8f7c', accent:'#d9713b', accentWeak:'rgba(217,113,59,.11)', accentContrast:'#ffffff', radius:'11px', radiusSm:'8px', shadow:'0 2px 6px rgba(80,60,30,.06), 0 12px 28px rgba(80,60,30,.06)' };
    c.fontUi = "'Space Grotesk', system-ui, sans-serif"; c.fontMono = "'Space Mono', ui-monospace, monospace";
  } else {
    c = dark
      ? { bg:'#0e0f17', panel:'#171927', panel2:'#12131f', elev:'#1d2032', border:'#272b3f', borderStrong:'#363b54', text:'#e9ecf7', textDim:'#9aa0bd', textFaint:'#656b88', accent:'#8b7cff', accentWeak:'rgba(139,124,255,.16)', accentContrast:'#ffffff', radius:'13px', radiusSm:'9px', shadow:'0 2px 6px rgba(0,0,0,.3), 0 16px 40px rgba(0,0,0,.35)' }
      : { bg:'#f5f6fb', panel:'#ffffff', panel2:'#eef0f7', elev:'#ffffff', border:'#e6e8f1', borderStrong:'#d5d9e6', text:'#1b1e2b', textDim:'#565d73', textFaint:'#9096ac', accent:'#6d5efc', accentWeak:'rgba(109,94,252,.11)', accentContrast:'#ffffff', radius:'13px', radiusSm:'9px', shadow:'0 2px 6px rgba(20,22,40,.04), 0 14px 34px rgba(20,22,40,.07)' };
    c.fontUi = "'Plus Jakarta Sans', system-ui, sans-serif"; c.fontMono = "'JetBrains Mono', ui-monospace, monospace";
  }
  return Object.assign(c, { syn, match, sem });
}

const IDENT = /^[A-Za-z_$][\w$]*$/;
const LS_KEY = 'refract.studio.v2';
const ROW_H = 22;
const TABLE_ROW_H = 34;
const TABLE_ROW_MIN_H = TABLE_ROW_H - 2;
const TABLE_COLS = 'minmax(240px,2.2fr) minmax(120px,1.1fr) minmax(180px,1.4fr) minmax(74px,.6fr) auto';
const INDEXED_SEG_RE = /\[\d+\]/;
const TABLE_JSON_MAX_DEPTH = 2;
const TABLE_XML_MIN_SUITABLE_ROWS = 1;
const MAX_PERSIST = 500000;

function b64encode(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64decode(str) { return decodeURIComponent(escape(atob(str))); }
function loadPersisted() {
  let data = {};
  try { const raw = localStorage.getItem(LS_KEY); if (raw) data = JSON.parse(raw) || {}; } catch (e) {}
  try { const hsh = (location.hash || '').replace(/^#/, ''); if (hsh.indexOf('d=') === 0) { const d = JSON.parse(b64decode(hsh.slice(2))); if (d && typeof d === 'object') data = Object.assign({}, data, d); } } catch (e) {}
  if (data && typeof data.input === 'string' && data.input.length > MAX_PERSIST) delete data.input;
  return data;
}

class Component extends DCLogic {
  constructor(props) {
    super(props);
    const P = loadPersisted();
    this.state = {
      mode: P.mode || 'format',
      theme: P.theme || props.theme || 'light',
      direction: P.direction || props.direction || 'aurora',
      input: P.input != null ? P.input : SAMPLE_JSON,
      docInput: P.input != null ? P.input : SAMPLE_JSON,
      indent: P.indent || '2',
      view: P.view || 'tree',
      collapsed: new Set(),
      search: '',
      searchMode: P.searchMode || 'highlight',
      explorerMode: P.explorerMode || 'search',
      matchIndex: 0,
      query: '',
      copied: null,
      dragging: false,
      diffA: P.diffA != null ? P.diffA : SAMPLE_DIFF_A,
      diffB: P.diffB != null ? P.diffB : SAMPLE_DIFF_B,
      scrollTop: 0,
      viewportH: 600,
      showHelp: false,
      shareMsg: null,
    };
    this.editorRef = React.createRef();
    this.highlightRef = React.createRef();
    this.gutterRef = React.createRef();
    this.fileRef = React.createRef();
    this.treeScrollRef = React.createRef();
    this.dropRef = React.createRef();
    this.activeMatchRef = React.createRef();
    this._lastMatch = -1;
    this._copyTimer = null;
    this._model = null;
    this._activeRowIndex = -1;
    this._tableCache = null;
    this._raf = null;
    this._persistTimer = null;
    this._shareTimer = null;
    this._docTimer = null;
    this._onKey = this.handleKey.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keydown', this._onKey, true);
    this._onResize = () => { const b = this.treeScrollRef.current; if (b && b.clientHeight) this.setState({ viewportH: b.clientHeight }); };
    window.addEventListener('resize', this._onResize);
    const b = this.treeScrollRef.current; if (b && b.clientHeight) this.setState({ viewportH: b.clientHeight });
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this._onKey, true);
    window.removeEventListener('resize', this._onResize);
    clearTimeout(this._persistTimer); clearTimeout(this._copyTimer); clearTimeout(this._shareTimer); clearTimeout(this._docTimer);
  }

  componentDidUpdate(prevProps, prevState) {
    const box = this.treeScrollRef.current;
    if (box && box.clientHeight && Math.abs(box.clientHeight - this.state.viewportH) > 2) { this.setState({ viewportH: box.clientHeight }); return; }
    if (this._lastMatch !== this.state.matchIndex) {
      this._lastMatch = this.state.matchIndex;
      if (this._activeRowIndex >= 0 && box) {
        const target = Math.max(0, this._activeRowIndex * ROW_H - box.clientHeight / 2 + ROW_H);
        box.scrollTop = target; this.setState({ scrollTop: target });
      }
    }
    if (prevState && (prevState.input !== this.state.input || prevState.theme !== this.state.theme || prevState.direction !== this.state.direction || prevState.mode !== this.state.mode || prevState.view !== this.state.view || prevState.indent !== this.state.indent || prevState.searchMode !== this.state.searchMode || prevState.explorerMode !== this.state.explorerMode || prevState.diffA !== this.state.diffA || prevState.diffB !== this.state.diffB)) {
      this.schedulePersist();
    }
  }

  schedulePersist() {
    clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => {
      const S = this.state;
      const data = { mode: S.mode, theme: S.theme, direction: S.direction, indent: S.indent, view: S.view, searchMode: S.searchMode, explorerMode: S.explorerMode, diffA: S.diffA, diffB: S.diffB };
      if (S.input.length <= MAX_PERSIST) data.input = S.input;
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) {}
    }, 350);
  }

  handleKey(e) {
    const k = e.key, mod = e.metaKey || e.ctrlKey;
    const tag = (e.target && e.target.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable);
    const isSearch = e.target && e.target.getAttribute && e.target.getAttribute('data-rf-search') != null;
    if (isSearch) {
      if (k === 'Enter') { e.preventDefault(); this.setState(s => ({ matchIndex: s.matchIndex + (e.shiftKey ? -1 : 1) })); return; }
      if (k === 'Escape') { e.target.blur(); return; }
    }
    if (mod) {
      if (k === 'f' || k === 'F') { e.preventDefault(); this.setState({ mode: 'format', explorerMode: 'search' }); const i = document.querySelector('[data-rf-search]'); if (i) { i.focus(); if (i.select) i.select(); } return; }
      if (k === 'Enter') { e.preventDefault(); this.reformat(false); return; }
      if (k === '\\') { e.preventDefault(); this.reformat(true); return; }
      if (k === 's' || k === 'S') { e.preventDefault(); this.doShare(); return; }
      if (k === 'e' || k === 'E') { e.preventDefault(); this.toggleAll(); return; }
      if (k === 'j' || k === 'J') { e.preventDefault(); this.setState({ theme: this.state.theme === 'dark' ? 'light' : 'dark' }); return; }
      return;
    }
    if (!typing) {
      if (k === '?') this.setState(s => ({ showHelp: !s.showHelp }));
      else if (k === 'Escape' && this.state.showHelp) this.setState({ showHelp: false });
    }
  }

  toggleAll() {
    const m = this.buildModel();
    if (this.state.collapsed.size > 0) this.setState({ collapsed: new Set() });
    else this.setState({ collapsed: new Set(this.allContainerPaths(m.node).filter(p => m.node && p !== m.node.path)) });
  }

  doShare() {
    const S = this.state;
    const data = { theme: S.theme, direction: S.direction, view: S.view, indent: S.indent, mode: S.mode, input: S.input };
    try {
      const hash = 'd=' + b64encode(JSON.stringify(data));
      const url = location.origin + location.pathname + location.search + '#' + hash;
      location.hash = hash;
      if (navigator.clipboard) navigator.clipboard.writeText(url);
      this.flashShare('Link copied \u2713');
    } catch (e) { this.flashShare('Link too large'); }
  }

  flashShare(msg) { clearTimeout(this._shareTimer); this.setState({ shareMsg: msg }); this._shareTimer = setTimeout(() => this.setState({ shareMsg: null }), 1800); }

  // ---------- parsing ----------
  detect(text) {
    const t = (text || '').trim();
    if (!t) return 'empty';
    if (t[0] === '<') return 'xml';
    if (t[0] === '{' || t[0] === '[') return 'json';
    return 'json';
  }

  parse(text) {
    const fmt = this.detect(text);
    if (fmt === 'empty') return { format: 'empty', ok: false, empty: true };
    if (fmt === 'xml') return this.parseXML(text);
    return this.parseJSON(text);
  }

  parseJSON(text) {
    try {
      const value = JSON.parse(text);
      return { format: 'json', ok: true, value };
    } catch (e) {
      let msg = e.message, pos = null, line = null, col = null;
      const pm = msg.match(/position (\d+)/);
      if (pm) pos = +pm[1];
      const lc = msg.match(/line (\d+) column (\d+)/);
      if (lc) { line = +lc[1]; col = +lc[2]; }
      else if (pos != null) {
        const up = text.slice(0, pos);
        line = up.split('\n').length;
        col = pos - up.lastIndexOf('\n');
      }
      msg = msg.replace(/ in JSON at position \d+.*/, '').replace(/^JSON\.parse: /, '');
      return { format: 'json', ok: false, error: { message: msg, line, col, pos } };
    }
  }

  parseXML(text) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const perr = doc.querySelector('parsererror');
    if (perr) {
      const raw = perr.textContent || 'Malformed XML';
      let line = null, col = null;
      const lm = raw.match(/line[^\d]*(\d+)/i); if (lm) line = +lm[1];
      const cm = raw.match(/column[^\d]*(\d+)/i); if (cm) col = +cm[1];
      let message = raw.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 2).join(' ');
      message = message.replace(/This page contains the following errors:?/i, '').replace(/Below is a rendering.*$/i, '').trim() || 'Malformed XML';
      return { format: 'xml', ok: false, error: { message, line, col } };
    }
    return { format: 'xml', ok: true, doc };
  }

  // ---------- node model ----------
  jsonType(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v; // object, string, number, boolean
  }

  buildJson(key, value, path, jpath) {
    const t = this.jsonType(value);
    if (t === 'object' || t === 'array') {
      const children = [];
      if (t === 'array') {
        value.forEach((v, i) => children.push(this.buildJson(i, v, path + '/' + i, jpath + '[' + i + ']')));
      } else {
        Object.keys(value).forEach(k => {
          const acc = IDENT.test(k) ? '.' + k : "['" + k + "']";
          children.push(this.buildJson(k, value[k], path + '/' + k, jpath + acc));
        });
      }
      return { kind: t, key, path, jpath, children, count: children.length, raw: value };
    }
    const disp = t === 'string' ? value : String(value);
    return { kind: 'leaf', vType: t, key, path, jpath, disp, copyText: t === 'string' ? value : String(value) };
  }

  buildXmlNode(el, path, jpath) {
    const name = el.nodeName;
    const children = [];
    for (const a of Array.from(el.attributes || [])) {
      children.push({ kind: 'leaf', vType: 'attr', key: '@' + a.name, path: path + '/@' + a.name, jpath: jpath + '/@' + a.name, disp: a.value, copyText: a.value });
    }
    const elems = Array.from(el.children);
    const text = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (elems.length === 0) {
      if ((el.attributes || []).length === 0) {
        return { kind: 'leaf', vType: this.xmlLeafType(text), key: name, path, jpath, disp: text, copyText: text };
      }
      if (text) children.push({ kind: 'leaf', vType: 'text', key: '#text', path: path + '/#text', jpath: jpath + '/text()', disp: text, copyText: text });
    } else {
      const counts = {};
      elems.forEach(c => { counts[c.nodeName] = (counts[c.nodeName] || 0) + 1; });
      const seen = {};
      elems.forEach(c => {
        seen[c.nodeName] = (seen[c.nodeName] || 0) + 1;
        const idx = counts[c.nodeName] > 1 ? '[' + seen[c.nodeName] + ']' : '';
        children.push(this.buildXmlNode(c, path + '/' + c.nodeName + idx, jpath + '/' + c.nodeName + idx));
      });
      if (text) children.push({ kind: 'leaf', vType: 'text', key: '#text', path: path + '/#text', jpath: jpath + '/text()', disp: text, copyText: text });
    }
    return { kind: 'element', key: name, path, jpath, children, count: children.length, el: el };
  }

  xmlLeafType(t) {
    if (t === '') return 'null';
    if (/^-?\d+(\.\d+)?$/.test(t)) return 'number';
    if (t === 'true' || t === 'false') return 'boolean';
    return 'string';
  }

  rootNode(parsed) {
    if (!parsed.ok) return null;
    if (parsed.format === 'json') return this.buildJson('root', parsed.value, '/root', '$');
    const de = parsed.doc.documentElement;
    return this.buildXmlNode(de, '/' + de.nodeName, '/' + de.nodeName);
  }

  // ---------- stats ----------
  stats(node, text) {
    let nodes = 0, depth = 0, obj = 0, arr = 0, leaf = 0;
    const walk = (n, d) => {
      nodes++; if (d > depth) depth = d;
      if (n.kind === 'leaf') { leaf++; return; }
      if (n.kind === 'array') arr++; else obj++;
      n.children.forEach(c => walk(c, d + 1));
    };
    if (node) walk(node, 0);
    const bytes = new TextEncoder().encode(text || '').length;
    return { nodes, depth, obj, arr, leaf, bytes };
  }

  // ---------- collect matches (pre-order) ----------
  collectMatches(node, term) {
    const hits = [];
    if (!node || !term) return hits;
    const low = term.toLowerCase();
    const walk = (n) => {
      const keyStr = n.key != null ? String(n.key) : '';
      if (keyStr.toLowerCase().includes(low)) hits.push(n.path + '#k');
      if (n.kind === 'leaf' && n.disp != null && String(n.disp).toLowerCase().includes(low)) hits.push(n.path + '#v');
      if (n.children) n.children.forEach(walk);
    };
    walk(node);
    return hits;
  }

  keepSet(node, term) {
    const keep = new Set();
    if (!node || !term) return keep;
    const low = term.toLowerCase();
    const walk = (n, anc) => {
      const chain = anc.concat(n.path);
      const keyStr = n.key != null ? String(n.key).toLowerCase() : '';
      const valMatch = n.kind === 'leaf' && n.disp != null && String(n.disp).toLowerCase().includes(low);
      if (keyStr.includes(low) || valMatch) chain.forEach(p => keep.add(p));
      if (n.children) n.children.forEach(c => walk(c, chain));
    };
    walk(node, []);
    return keep;
  }

  // ---------- highlight substrings ----------
  hl(str, ctx, nodePath, part) {
    const s = String(str);
    if (!ctx.term) return s;
    const low = s.toLowerCase(), t = ctx.term.toLowerCase();
    const out = []; let i = 0, k = 0;
    while (true) {
      const idx = low.indexOf(t, i);
      if (idx === -1) { out.push(s.slice(i)); break; }
      if (idx > i) out.push(s.slice(i, idx));
      const isActive = ctx.activePath === nodePath + '#' + part;
      out.push(h('span', {
        key: 'm' + k++,
        ref: isActive ? this.activeMatchRef : null,
        style: { background: isActive ? ctx.tok.match.active : ctx.tok.match.bg, borderRadius: '2px', color: 'var(--text)', boxShadow: isActive ? '0 0 0 1px ' + ctx.tok.accent : 'none' }
      }, s.slice(idx, idx + t.length)));
      i = idx + t.length;
    }
    return out;
  }

  // ---------- tree render ----------
  renderTree(node, ctx) {
    if (!node) return null;
    return h('div', { style: { paddingBottom: '2px' } }, this.renderNode(node, ctx, 0, true));
  }

  valColor(vType, tok) {
    return { string: tok.syn.string, number: tok.syn.number, boolean: tok.syn.bool, null: tok.syn.nul, attr: tok.syn.attr, text: tok.text }[vType] || tok.text;
  }

  renderNode(n, ctx, depth, isLast) {
    const tok = ctx.tok;
    if (ctx.filter && ctx.keep.size && !ctx.keep.has(n.path)) return null;
    const pad = { paddingLeft: (depth * 15 + 8) + 'px' };
    const isContainer = n.kind !== 'leaf';
    const collapsed = ctx.collapsed.has(n.path);
    const keyEl = n.key != null && !(ctx.parentArray)
      ? h('span', { style: { color: n.vType === 'attr' ? tok.syn.attr : tok.syn.key } }, this.hl(n.key, ctx, n.path, 'k'), h('span', { style: { color: tok.syn.punct } }, ': '))
      : (ctx.parentArray ? h('span', { style: { color: tok.textFaint, marginRight: '6px' } }, n.key + ':') : null);

    const acts = h('span', { className: 'rf-acts', style: { display: 'inline-flex', gap: '4px', marginLeft: '10px', verticalAlign: 'middle' } },
      this.miniBtn('path', n, ctx), this.miniBtn('value', n, ctx));

    if (!isContainer) {
      const isStr = n.vType === 'string';
      const dispVal = n.vType === 'null' ? 'null' : n.disp;
      const row = h('div', { className: 'rf-row', key: n.path, style: Object.assign({ display: 'flex', alignItems: 'baseline', borderRadius: '5px', paddingTop: '1px', paddingBottom: '1px', paddingRight: '6px' }, pad) },
        h('span', { style: { width: '13px', flex: '0 0 auto' } }),
        h('span', { style: { minWidth: 0 } },
          keyEl,
          h('span', { style: { color: this.valColor(n.vType, tok), wordBreak: 'break-word', whiteSpace: 'pre-wrap' } },
            isStr ? h('span', { style: { color: tok.syn.punct } }, '"') : null,
            this.hl(dispVal, ctx, n.path, 'v'),
            isStr ? h('span', { style: { color: tok.syn.punct } }, '"') : null
          ),
          acts
        )
      );
      return row;
    }

    const open = n.kind === 'array' ? '[' : '{';
    const close = n.kind === 'array' ? ']' : '}';
    const header = h('div', { className: 'rf-row', key: n.path + '#h', onClick: () => this.toggle(n.path), style: Object.assign({ display: 'flex', alignItems: 'baseline', cursor: 'pointer', borderRadius: '5px', paddingTop: '1px', paddingBottom: '1px', paddingRight: '6px', userSelect: 'none' }, pad) },
      h('span', { className: 'rf-node-toggle', style: { width: '13px', flex: '0 0 auto', display: 'inline-block', color: tok.textFaint, transform: collapsed ? 'rotate(-90deg)' : 'none', fontSize: '10px', lineHeight: '20px' } }, '▼'),
      h('span', { style: { minWidth: 0 } },
        keyEl,
        h('span', { style: { color: tok.syn.punct } }, open),
        collapsed ? h('span', { style: { color: tok.textFaint, fontStyle: 'italic', margin: '0 4px' } }, n.count + (n.kind === 'array' ? ' items' : ' keys')) : null,
        collapsed ? h('span', { style: { color: tok.syn.punct } }, close) : null,
        acts
      )
    );
    if (collapsed) return header;
    const kids = n.children.map((c, i) => this.renderNode(c, Object.assign({}, ctx, { parentArray: n.kind === 'array' }), depth + 1, i === n.children.length - 1)).filter(Boolean);
    return h('div', { key: n.path }, header,
      h('div', {}, kids),
      h('div', { style: Object.assign({ color: tok.syn.punct }, pad) }, h('span', { style: { width: '13px', display: 'inline-block' } }), close)
    );
  }

  miniBtn(type, n, ctx) {
    const tok = ctx.tok;
    const label = type === 'path' ? 'path' : 'value';
    const copiedKey = n.path + ':' + type;
    const isCopied = this.state.copied === copiedKey;
    return h('button', {
      onClick: (e) => { e.stopPropagation(); this.copy(type === 'path' ? n.jpath : this.nodeCopyText(n), copiedKey); },
      title: type === 'path' ? n.jpath : 'Copy value',
      style: { font: '600 9.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: isCopied ? tok.sem.ok : tok.textDim, background: isCopied ? tok.sem.okW : tok.panel2, border: '1px solid ' + tok.border, borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }
    }, isCopied ? '✓' : label);
  }

  applyInput(val, extra) {
    if (this.editorRef.current && this.editorRef.current.value !== val) this.editorRef.current.value = val;
    this.setState(Object.assign({ input: val, docInput: val }, extra || {}));
  }

  nodeCopyText(n) {
    if (n.copyText != null) return n.copyText;
    if (n.el) return n.el.outerHTML || '';
    if (n.raw !== undefined) { try { return JSON.stringify(n.raw, null, 2); } catch (e) { return String(n.raw); } }
    return '';
  }

  toggle(path) {
    this.setState(s => { const c = new Set(s.collapsed); c.has(path) ? c.delete(path) : c.add(path); return { collapsed: c }; });
  }

  allContainerPaths(node) {
    const out = [];
    const walk = n => { if (n.kind !== 'leaf') { out.push(n.path); n.children.forEach(walk); } };
    if (node) walk(node);
    return out;
  }

  copy(text, key) {
    try { navigator.clipboard.writeText(text == null ? '' : String(text)); } catch (e) {}
    clearTimeout(this._copyTimer);
    this.setState({ copied: key });
    this._copyTimer = setTimeout(() => this.setState({ copied: null }), 1100);
  }

  // ---------- formatting ----------
  indentStr() { return this.state.indent === 'tab' ? '\t' : (this.state.indent === '4' ? '    ' : '  '); }

  reformat(minify) {
    const p = this.parse(this.state.input);
    if (!p.ok) return;
    if (p.format === 'json') {
      const out = minify ? JSON.stringify(p.value) : JSON.stringify(p.value, null, this.indentStr());
      this.applyInput(out);
    } else {
      const out = minify ? this.minifyXml(this.state.input) : this.prettyXml(p.doc);
      this.applyInput(out);
    }
  }

  prettyXml(doc) {
    const ind = this.indentStr();
    const ser = (node, level) => {
      const pad = ind.repeat(level);
      if (node.nodeType === 3) { const t = node.textContent.trim(); return t ? pad + t + '\n' : ''; }
      if (node.nodeType === 8) return pad + '<!--' + node.textContent + '-->\n';
      if (node.nodeType !== 1) return '';
      let attrs = '';
      for (const a of Array.from(node.attributes)) attrs += ' ' + a.name + '="' + a.value + '"';
      const kids = Array.from(node.childNodes);
      const elemKids = kids.filter(k => k.nodeType === 1);
      const textOnly = elemKids.length === 0;
      const text = kids.filter(k => k.nodeType === 3).map(k => k.textContent).join('').trim();
      if (textOnly && text) return pad + '<' + node.nodeName + attrs + '>' + text + '</' + node.nodeName + '>\n';
      if (kids.length === 0 || (textOnly && !text)) return pad + '<' + node.nodeName + attrs + '/>\n';
      let out = pad + '<' + node.nodeName + attrs + '>\n';
      kids.forEach(k => { out += ser(k, level + 1); });
      out += pad + '</' + node.nodeName + '>\n';
      return out;
    };
    return ('<?xml version="1.0" encoding="UTF-8"?>\n' + ser(doc.documentElement, 0)).trim();
  }

  minifyXml(text) { return text.replace(/>\s+</g, '><').replace(/\s+/g, ' ').replace(/> </g, '><').trim(); }

  sortKeys() {
    const p = this.parse(this.state.input);
    if (!p.ok || p.format !== 'json') return;
    const sort = v => {
      if (Array.isArray(v)) return v.map(sort);
      if (v && typeof v === 'object') { const o = {}; Object.keys(v).sort().forEach(k => o[k] = sort(v[k])); return o; }
      return v;
    };
    const out = JSON.stringify(sort(p.value), null, this.indentStr());
    this.applyInput(out);
  }

  // ---------- convert ----------
  convert() {
    const p = this.parse(this.state.input);
    if (!p.ok) return;
    if (p.format === 'json') { const o = this.jsonToXml(p.value); this.applyInput(o); }
    else { const o = this.xmlToJson(p.doc); this.applyInput(o); }
  }

  esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  tagName(k) { const s = String(k).replace(/[^\w.-]/g, '_'); return /^[A-Za-z_]/.test(s) ? s : '_' + s; }

  jsonToXml(value) {
    const ind = this.indentStr();
    const build = (name, val, level) => {
      const pad = ind.repeat(level);
      if (Array.isArray(val)) return val.map(v => build(name, v, level)).join('');
      if (val && typeof val === 'object') {
        let out = pad + '<' + name + '>\n';
        Object.keys(val).forEach(k => { out += build(this.tagName(k), val[k], level + 1); });
        out += pad + '</' + name + '>\n';
        return out;
      }
      if (val === null) return pad + '<' + name + '/>\n';
      return pad + '<' + name + '>' + this.esc(val) + '</' + name + '>\n';
    };
    let rootName = 'root', body = value;
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 1) {
      rootName = this.tagName(Object.keys(value)[0]); body = value[Object.keys(value)[0]];
    }
    return ('<?xml version="1.0" encoding="UTF-8"?>\n' + build(rootName, body, 0)).trim();
  }

  xmlToJson(doc) {
    const conv = el => {
      const obj = {};
      let hasChild = false;
      for (const a of Array.from(el.attributes)) { obj['@' + a.name] = a.value; hasChild = true; }
      const elems = Array.from(el.children);
      const text = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
      if (elems.length === 0) {
        if (!hasChild) return text === '' ? null : this.coerce(text);
        if (text) obj['#text'] = this.coerce(text);
        return obj;
      }
      elems.forEach(c => {
        const v = conv(c);
        if (obj[c.nodeName] !== undefined) {
          if (!Array.isArray(obj[c.nodeName])) obj[c.nodeName] = [obj[c.nodeName]];
          obj[c.nodeName].push(v);
        } else obj[c.nodeName] = v;
      });
      if (text) obj['#text'] = this.coerce(text);
      return obj;
    };
    const de = doc.documentElement;
    return JSON.stringify({ [de.nodeName]: conv(de) }, null, this.indentStr());
  }

  coerce(t) {
    if (/^-?\d+$/.test(t)) return parseInt(t, 10);
    if (/^-?\d+\.\d+$/.test(t)) return parseFloat(t);
    if (t === 'true') return true; if (t === 'false') return false;
    return t;
  }

  // ---------- JSONPath ----------
  runJsonPath(value, path) {
    const p = path.trim();
    if (!p) return { ok: true, results: [] };
    try {
      let expr = p.startsWith('$') ? p.slice(1) : p;
      const toks = [];
      const re = /\.\.|\.([A-Za-z_$][\w$]*)|\[([^\]]+)\]|\.\*|\*/g;
      let m, last = 0;
      while ((m = re.exec(expr)) !== null) {
        if (m[0] === '..') toks.push({ t: 'desc' });
        else if (m[1] !== undefined) toks.push({ t: 'key', v: m[1] });
        else if (m[2] !== undefined) toks.push({ t: 'bracket', v: m[2].trim() });
        else toks.push({ t: 'wild' });
      }
      let cur = [{ path: '$', val: value }];
      for (const tk of toks) {
        const next = [];
        if (tk.t === 'desc') {
          const gather = (node) => { const stack = [node]; while (stack.length) { const x = stack.pop(); next.push(x); const v = x.val; if (Array.isArray(v)) v.forEach((e, i) => stack.push({ path: x.path + '[' + i + ']', val: e })); else if (v && typeof v === 'object') Object.keys(v).forEach(k => stack.push({ path: x.path + '.' + k, val: v[k] })); } };
          cur.forEach(gather);
          cur = next; continue;
        }
        cur.forEach(c => {
          const v = c.val;
          if (tk.t === 'key' || (tk.t === 'bracket' && /^['"]/.test(tk.v))) {
            const key = tk.t === 'key' ? tk.v : tk.v.replace(/^['"]|['"]$/g, '');
            if (v && typeof v === 'object' && !Array.isArray(v) && key in v) next.push({ path: c.path + '.' + key, val: v[key] });
          } else if (tk.t === 'wild' || (tk.t === 'bracket' && tk.v === '*')) {
            if (Array.isArray(v)) v.forEach((e, i) => next.push({ path: c.path + '[' + i + ']', val: e }));
            else if (v && typeof v === 'object') Object.keys(v).forEach(k => next.push({ path: c.path + '.' + k, val: v[k] }));
          } else if (tk.t === 'bracket') {
            const b = tk.v;
            if (/^-?\d+$/.test(b)) { const i = +b < 0 ? v.length + +b : +b; if (Array.isArray(v) && v[i] !== undefined) next.push({ path: c.path + '[' + i + ']', val: v[i] }); }
            else if (b.includes(':')) { const [a, z] = b.split(':').map(x => x.trim()); if (Array.isArray(v)) { const s = a === '' ? 0 : +a, e = z === '' ? v.length : +z; for (let i = s; i < e; i++) if (v[i] !== undefined) next.push({ path: c.path + '[' + i + ']', val: v[i] }); } }
            else if (b.includes(',')) { b.split(',').forEach(k => { k = k.trim().replace(/^['"]|['"]$/g, ''); if (v && typeof v === 'object' && k in v) next.push({ path: c.path + '.' + k, val: v[k] }); }); }
          }
        });
        cur = next;
      }
      return { ok: true, results: cur };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  runXPath(doc, path) {
    const p = path.trim();
    if (!p) return { ok: true, results: [] };
    try {
      const it = doc.evaluate(p, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const results = [];
      for (let i = 0; i < it.snapshotLength; i++) {
        const node = it.snapshotItem(i);
        results.push({ path: node.nodeName, val: node.nodeType === 1 ? node.outerHTML : node.textContent });
      }
      return { ok: true, results };
    } catch (e) { return { ok: false, error: 'Invalid XPath' }; }
  }

  // ---------- tokenizer for editor ----------
  tokenizeJSON(text, tok) {
    const re = /("(?:\\.|[^"\\])*"?)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}\[\]:,])|(\s+)|([^\s{}\[\]:,"]+)/g;
    const raw = []; let m;
    while ((m = re.exec(text)) !== null) {
      if (m[1] !== undefined) raw.push({ ty: 'str', v: m[1] });
      else if (m[2] !== undefined) raw.push({ ty: 'num', v: m[2] });
      else if (m[3] !== undefined) raw.push({ ty: m[3] === 'null' ? 'nul' : 'bool', v: m[3] });
      else if (m[4] !== undefined) raw.push({ ty: 'punct', v: m[4] });
      else if (m[5] !== undefined) raw.push({ ty: 'ws', v: m[5] });
      else raw.push({ ty: 'other', v: m[6] });
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    for (let i = 0; i < raw.length; i++) {
      if (raw[i].ty === 'str') { let j = i + 1; while (j < raw.length && raw[j].ty === 'ws') j++; if (raw[j] && raw[j].v === ':') raw[i].ty = 'key'; }
    }
    const cmap = { str: tok.syn.string, key: tok.syn.key, num: tok.syn.number, bool: tok.syn.bool, nul: tok.syn.nul, punct: tok.syn.punct, ws: tok.text, other: tok.sem.err };
    return raw.map((t, i) => t.ty === 'ws' ? t.v : h('span', { key: i, style: { color: cmap[t.ty] } }, t.v));
  }

  tokenizeXML(text, tok) {
    const out = []; let i = 0, k = 0; const re = /<[^>]*>?/g; let m; let last = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const tag = m[0];
      const tm = tag.match(/^(<\u002F?)([\w:.-]+)?([\s\S]*?)(\u002F?>?)$/);
      if (tm) {
        out.push(h('span', { key: k++, style: { color: tok.syn.punct } }, tm[1]));
        if (tm[2]) out.push(h('span', { key: k++, style: { color: tok.syn.tag } }, tm[2]));
        if (tm[3]) {
          const parts = tm[3].split(/(\s+[\w:.-]+\s*=\s*"[^"]*")/g).filter(Boolean);
          parts.forEach(pt => {
            const am = pt.match(/^(\s+)([\w:.-]+)(\s*=\s*)("[^"]*")$/);
            if (am) { out.push(am[1]); out.push(h('span', { key: k++, style: { color: tok.syn.attr } }, am[2])); out.push(h('span', { key: k++, style: { color: tok.syn.punct } }, am[3])); out.push(h('span', { key: k++, style: { color: tok.syn.string } }, am[4])); }
            else out.push(pt);
          });
        }
        out.push(h('span', { key: k++, style: { color: tok.syn.punct } }, tm[4]));
      } else out.push(tag);
      last = re.lastIndex;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }

  highlight(text, fmt, tok) {
    if (!text) return '';
    try { return fmt === 'xml' ? this.tokenizeXML(text, tok) : this.tokenizeJSON(text, tok); }
    catch (e) { return text; }
  }

  // ---------- diff ----------
  lineDiff(a, b) {
    const A = a.split('\n'), B = b.split('\n');
    const n = A.length, m = B.length;
    const dp = [];
    for (let i = 0; i <= n; i++) dp.push(new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const rows = []; let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { rows.push({ t: 'eq', l: A[i], r: B[j], ln: i + 1, rn: j + 1 }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { rows.push({ t: 'del', l: A[i], r: null, ln: i + 1, rn: null }); i++; }
      else { rows.push({ t: 'add', l: null, r: B[j], ln: null, rn: j + 1 }); j++; }
    }
    while (i < n) { rows.push({ t: 'del', l: A[i], r: null, ln: i + 1, rn: null }); i++; }
    while (j < m) { rows.push({ t: 'add', l: null, r: B[j], ln: null, rn: j + 1 }); j++; }
    return rows;
  }

  renderDiff(tok) {
    const norm = t => { const p = this.parse(t); if (p.ok && p.format === 'json') return JSON.stringify(p.value, null, 2); if (p.ok && p.format === 'xml') return this.prettyXml(p.doc); return t; };
    const a = norm(this.state.diffA), b = norm(this.state.diffB);
    const rows = this.lineDiff(a, b);
    let add = 0, del = 0;
    rows.forEach(r => { if (r.t === 'add') add++; else if (r.t === 'del') del++; });
    const gut = { display: 'inline-block', width: '42px', textAlign: 'right', paddingRight: '10px', color: tok.textFaint, userSelect: 'none', flex: '0 0 auto' };
    const cell = (side, r) => {
      const isL = side === 'l';
      const content = isL ? r.l : r.r;
      const num = isL ? r.ln : r.rn;
      let bg = 'transparent', sign = ' ';
      if (r.t === 'del') { bg = isL ? tok.sem.del : 'transparent'; sign = isL ? '-' : ''; }
      if (r.t === 'add') { bg = isL ? 'transparent' : tok.sem.add; sign = isL ? '' : '+'; }
      return h('div', { style: { display: 'flex', background: bg, minHeight: '19px' } },
        h('span', { style: gut }, num || ''),
        h('span', { style: { color: r.t === 'del' && isL ? tok.sem.err : r.t === 'add' && !isL ? tok.sem.ok : tok.textDim, whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1, paddingRight: '8px' } }, content == null ? '' : sign + ' ' + content)
      );
    };
    const body = rows.map((r, i) => h('div', { key: i, style: { display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid ' + tok.border + '55' } }, cell('l', r), cell('r', r)));
    const head = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', position: 'sticky', top: 0, background: tok.panel2, borderBottom: '1px solid ' + tok.border, font: '600 11px/1 ' + tok.fontUi, color: tok.textFaint, letterSpacing: '.04em', textTransform: 'uppercase', zIndex: 1 } },
      h('div', { style: { padding: '8px 12px', borderRight: '1px solid ' + tok.border } }, 'Version A'),
      h('div', { style: { padding: '8px 12px' } }, 'Version B'));
    return { el: h('div', { style: { font: '400 12.5px/19px ' + tok.fontMono, minWidth: 0 } }, head, body), add, del };
  }

  // ---------- handlers ----------
  loadFile(file) {
    const r = new FileReader();
    r.onload = () => { const v = String(r.result); this.applyInput(v, { collapsed: new Set(), search: '', query: '', matchIndex: 0 }); };
    r.readAsText(file);
  }

  buildModel() {
    const input = this.state.docInput;
    if (this._model && this._model.input === input) return this._model;
    const parsed = this.parse(input);
    const node = this.rootNode(parsed);
    this._model = { input, parsed, node };
    return this._model;
  }

  flatten(node, ctx) {
    const rows = [];
    const inFilter = ctx.filter && ctx.keep.size > 0;
    const walk = (n, depth, comma, arr) => {
      if (inFilter && !ctx.keep.has(n.path)) return;
      if (n.kind === 'leaf') { rows.push({ id: n.path, type: 'leaf', node: n, depth, comma, arr }); return; }
      const collapsed = !inFilter && ctx.collapsed.has(n.path);
      if (collapsed) { rows.push({ id: n.path, type: 'collapsed', node: n, depth, comma, arr }); return; }
      rows.push({ id: n.path + '#o', type: 'open', node: n, depth, comma: false, arr });
      let kids = n.children;
      if (inFilter) kids = kids.filter(c => ctx.keep.has(c.path));
      const isArr = n.kind === 'array';
      kids.forEach((c, i) => walk(c, depth + 1, i < kids.length - 1, isArr));
      rows.push({ id: n.path + '#c', type: 'close', node: n, depth, comma, arr });
    };
    if (node) walk(node, 0, false, false);
    return rows;
  }

  renderFlatRow(row, ctx) {
    const tok = ctx.tok, n = row.node;
    const base = { position: 'relative', display: 'flex', alignItems: 'center', height: ROW_H + 'px', borderRadius: '5px', paddingRight: '8px', paddingLeft: (row.depth * 15 + 10) + 'px', whiteSpace: 'nowrap', overflow: 'hidden' };
    const keyEl = row.arr
      ? h('span', { style: { color: tok.textFaint, marginRight: '7px', flex: '0 0 auto' } }, n.key + ':')
      : h('span', { style: { flex: '0 0 auto' } }, h('span', { style: { color: n.vType === 'attr' ? tok.syn.attr : tok.syn.key } }, this.hl(String(n.key), ctx, n.path, 'k')), h('span', { style: { color: tok.syn.punct } }, ': '));
    const acts = h('span', { className: 'rf-acts', style: { position: 'absolute', right: '6px', top: 0, height: ROW_H + 'px', display: 'inline-flex', alignItems: 'center', gap: '4px', paddingLeft: '16px', background: 'linear-gradient(90deg, transparent, ' + tok.panel + ' 40%)' } }, this.miniBtn('path', n, ctx), this.miniBtn('value', n, ctx));
    const tri = (open) => h('span', { style: { width: '13px', flex: '0 0 auto', display: 'inline-block', color: tok.textFaint, fontSize: '9px', lineHeight: ROW_H + 'px', transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform .1s' } }, '\u25BC');
    if (row.type === 'leaf') {
      const isStr = n.vType === 'string';
      const dv = n.vType === 'null' ? 'null' : n.disp;
      return h('div', { className: 'rf-row', style: base },
        h('span', { style: { width: '13px', flex: '0 0 auto' } }), keyEl,
        h('span', { style: { color: this.valColor(n.vType, tok), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 } },
          isStr ? h('span', { style: { color: tok.syn.punct } }, '"') : null, this.hl(String(dv), ctx, n.path, 'v'), isStr ? h('span', { style: { color: tok.syn.punct } }, '"') : null),
        row.comma ? h('span', { style: { color: tok.syn.punct, flex: '0 0 auto' } }, ',') : null, acts);
    }
    const open = n.kind === 'array' ? '[' : '{';
    const close = n.kind === 'array' ? ']' : '}';
    if (row.type === 'collapsed') {
      return h('div', { className: 'rf-row', style: Object.assign({ cursor: 'pointer', userSelect: 'none' }, base), onClick: () => this.toggle(n.path) },
        tri(false), keyEl,
        h('span', { style: { color: tok.syn.punct } }, open),
        h('span', { style: { color: tok.textFaint, fontStyle: 'italic', margin: '0 5px' } }, n.count + (n.kind === 'array' ? ' items' : ' keys')),
        h('span', { style: { color: tok.syn.punct } }, close), row.comma ? h('span', { style: { color: tok.syn.punct } }, ',') : null, acts);
    }
    if (row.type === 'open') {
      return h('div', { className: 'rf-row', style: Object.assign({ cursor: 'pointer', userSelect: 'none' }, base), onClick: () => this.toggle(n.path) },
        tri(true), keyEl, h('span', { style: { color: tok.syn.punct } }, open), acts);
    }
    return h('div', { style: base },
      h('span', { style: { width: '13px', flex: '0 0 auto' } }),
      h('span', { style: { color: tok.syn.punct } }, close + (row.comma ? ',' : '')));
  }

  tableRows(node, parsed, ctx) {
    const rows = [];
    if (!node || !parsed || !parsed.ok) return { rows, suitable: false };
    const term = (ctx.term || '').toLowerCase();
    const inFilter = ctx.filter && !!term;
    let hasArray = false, maxDepth = 0;
    const walk = (n, depth) => {
      if (!n) return;
      if (depth > maxDepth) maxDepth = depth;
      if (n.kind === 'array') hasArray = true;
      if (n.kind === 'leaf') {
        const key = n.key == null ? '' : String(n.key);
        const value = n.vType === 'null' ? 'null' : String(n.disp == null ? '' : n.disp);
        const keyMatch = term && key.toLowerCase().includes(term);
        const valMatch = term && value.toLowerCase().includes(term);
        if (inFilter && !(keyMatch || valMatch)) return;
        rows.push({ id: n.path, node: n, path: n.jpath, key, value, type: n.vType });
        return;
      }
      if (n.children) n.children.forEach(c => walk(c, depth + 1));
    };
    walk(node, 0);

    let suitable = rows.length > 0 && node.kind !== 'leaf';
    if (suitable && parsed.format === 'json') {
      const rootType = this.jsonType(parsed.value);
      if (rootType !== 'array' && rootType !== 'object') suitable = false;
      else if (!hasArray && maxDepth > TABLE_JSON_MAX_DEPTH) suitable = false;
    }
    if (suitable && parsed.format === 'xml') {
      const hasIndexedPath = rows.some(r => INDEXED_SEG_RE.test(r.path));
      if (!hasIndexedPath && rows.length <= TABLE_XML_MIN_SUITABLE_ROWS) suitable = false;
    }
    return { rows, suitable };
  }

  renderTableRow(row, ctx) {
    const tok = ctx.tok, n = row.node;
    const copyPathKey = n.path + ':path';
    const copyValKey = n.path + ':value';
    const pathCopied = this.state.copied === copyPathKey;
    const valCopied = this.state.copied === copyValKey;
    return h('div', { className: 'rf-table-row rf-row', style: { display: 'grid', gridTemplateColumns: TABLE_COLS, gap: '10px', alignItems: 'center', minHeight: TABLE_ROW_MIN_H + 'px', padding: '6px 10px', borderBottom: '1px solid ' + tok.border + '66' } },
      h('div', { className: 'rf-table-cell-path', title: row.path, style: { color: tok.accent, font: '600 11px/1.4 ' + tok.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, row.path),
      h('div', { className: 'rf-table-cell-key', title: row.key, style: { color: n.vType === 'attr' ? tok.syn.attr : tok.syn.key, font: '500 12px/1.4 ' + tok.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, this.hl(row.key, ctx, n.path, 'k')),
      h('div', { className: 'rf-table-cell-value', title: row.value, style: { color: this.valColor(n.vType, tok), font: '400 12px/1.4 ' + tok.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, this.hl(row.value, ctx, n.path, 'v')),
      h('div', { className: 'rf-table-cell-type', style: { color: tok.textDim, font: '600 10.5px/1 ' + tok.fontUi, textTransform: 'uppercase', letterSpacing: '.05em' } }, row.type),
      h('span', { className: 'rf-acts rf-table-acts', style: { display: 'inline-flex', gap: '4px', justifySelf: 'end' } },
        h('button', {
          onClick: (e) => { e.stopPropagation(); this.copy(row.path, copyPathKey); },
          title: row.path,
          style: { font: '600 9.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: pathCopied ? tok.sem.ok : tok.textDim, background: pathCopied ? tok.sem.okW : tok.panel2, border: '1px solid ' + tok.border, borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }
        }, pathCopied ? '✓' : 'path'),
        h('button', {
          onClick: (e) => { e.stopPropagation(); this.copy(this.nodeCopyText(n), copyValKey); },
          title: 'Copy value',
          style: { font: '600 9.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: valCopied ? tok.sem.ok : tok.textDim, background: valCopied ? tok.sem.okW : tok.panel2, border: '1px solid ' + tok.border, borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }
        }, valCopied ? '✓' : 'value')
      )
    );
  }

  windowed(rows, ctx, renderRow, rowHeight) {
    const S = this.state;
    const rh = rowHeight || ROW_H;
    const renderer = renderRow || this.renderFlatRow.bind(this);
    const vh = S.viewportH || 600, st = S.scrollTop || 0, total = rows.length, over = 8;
    const start = Math.max(0, Math.floor(st / rh) - over);
    const end = Math.min(total, Math.ceil((st + vh) / rh) + over);
    const items = [];
    for (let i = start; i < end; i++) {
      const r = rows[i];
      items.push(h('div', { key: r.id, style: { position: 'absolute', top: (i * rh) + 'px', left: 0, right: 0 } }, renderer(r, ctx)));
    }
    return h('div', { style: { position: 'relative', height: (total * rh) + 'px', minWidth: '100%' } }, items);
  }

  renderVals() {
    const S = this.state;
    const dir = S.direction, theme = S.theme;
    const tok = tokens(dir, theme);
    const showLN = this.props.showLineNumbers !== false;

    const themeVars = {
      '--bg': tok.bg, '--panel': tok.panel, '--panel-2': tok.panel2, '--elev': tok.elev,
      '--border': tok.border, '--border-strong': tok.borderStrong, '--text': tok.text, '--text-dim': tok.textDim,
      '--text-faint': tok.textFaint, '--accent': tok.accent, '--accent-weak': tok.accentWeak, '--accent-contrast': tok.accentContrast,
      '--radius': tok.radius, '--radius-sm': tok.radiusSm, '--shadow': tok.shadow, '--font-ui': tok.fontUi, '--font-mono': tok.fontMono,
      background: 'var(--bg)', color: 'var(--text)', width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: tok.fontUi, transition: 'background .2s, color .2s',
    };

    const seg = (active) => ({ height: '26px', padding: '0 11px', border: 'none', borderRadius: '7px', cursor: 'pointer', font: '600 12px/1 ' + tok.fontUi, background: active ? tok.panel : 'transparent', color: active ? tok.accent : tok.textDim, boxShadow: active ? '0 1px 3px rgba(0,0,0,.12)' : 'none', transition: 'all .12s' });
    const segFlat = (active) => ({ height: '26px', padding: '0 11px', border: 'none', borderRadius: '6px', cursor: 'pointer', font: '600 12px/1 ' + tok.fontUi, background: active ? tok.accent : 'transparent', color: active ? tok.accentContrast : tok.textDim, transition: 'all .12s' });
    const btnStyle = { display: 'inline-flex', alignItems: 'center', gap: '6px', height: '30px', padding: '0 11px', borderRadius: tok.radiusSm, border: '1px solid ' + tok.border, background: tok.elev, color: tok.text, font: '500 12.5px/1 ' + tok.fontUi, cursor: 'pointer', whiteSpace: 'nowrap' };
    const btnHover = { background: tok.panel2, borderColor: tok.borderStrong };
    const btnGhost = Object.assign({}, btnStyle, { border: '1px solid transparent', background: 'transparent', color: tok.textDim });
    const navBtnStyle = { width: '22px', height: '22px', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', border: '1px solid ' + tok.border, background: tok.elev, color: tok.textDim, cursor: 'pointer', font: '600 13px/1 ' + tok.fontUi };

    // parse current (memoized on input)
    const model = this.buildModel();
    const parsed = model.parsed;
    const node = model.node;
    const isJson = parsed.format === 'json';
    const isXml = parsed.format === 'xml';
    const heavy = S.input.length > 120000;

    // status
    let statusText, statusColor, statusDot, statusDotHalo, hasError = false, errorLine = null;
    if (parsed.empty) { statusText = 'Empty — paste or load a document'; statusColor = tok.textFaint; statusDot = tok.textFaint; statusDotHalo = 'transparent'; }
    else if (parsed.ok) { statusText = 'Valid ' + parsed.format.toUpperCase(); statusColor = tok.sem.ok; statusDot = tok.sem.ok; statusDotHalo = tok.sem.okW; }
    else { hasError = true; errorLine = parsed.error.line; const loc = parsed.error.line ? ' (line ' + parsed.error.line + (parsed.error.col ? ', col ' + parsed.error.col : '') + ')' : ''; statusText = parsed.error.message + loc; statusColor = tok.sem.err; statusDot = tok.sem.err; statusDotHalo = tok.sem.errW; }
    if (heavy && !parsed.empty && !hasError) statusText += ' \u00b7 large-file mode';

    // search context (cached on input+term)
    const savedTerm = S.search.trim();
    const term = S.explorerMode === 'search' ? savedTerm : '';
    if (!this._matchCache || this._matchCache.input !== S.docInput || this._matchCache.term !== term) {
      this._matchCache = { input: S.docInput, term, matches: term ? this.collectMatches(node, term) : [] };
    }
    const matches = this._matchCache.matches;
    const activePath = matches.length ? matches[((S.matchIndex % matches.length) + matches.length) % matches.length] : null;
    const ctx = { tok, term, activePath };
    const matchLabel = matches.length ? (((S.matchIndex % matches.length) + matches.length) % matches.length + 1) + '/' + matches.length : '0/0';

    // query
    const savedQuery = S.query.trim();
    const query = S.explorerMode === 'query' ? savedQuery : '';
    let explorerEl, queryStat = '', queryStatOk = true;
    if (query) {
      const qr = isXml ? this.runXPath(parsed.doc, query) : this.runJsonPath(parsed.ok ? parsed.value : {}, query);
      if (!qr.ok) { queryStat = 'error'; queryStatOk = false; explorerEl = h('div', { style: { padding: '24px', color: tok.sem.err, font: '500 13px/1.5 ' + tok.fontUi } }, 'Query error: ' + (qr.error || 'invalid')); }
      else {
        queryStat = qr.results.length + (qr.results.length === 1 ? ' match' : ' matches');
        if (!qr.results.length) explorerEl = h('div', { style: { padding: '24px', color: tok.textFaint, font: '500 13px/1.5 ' + tok.fontUi } }, 'No matches for this query.');
        else explorerEl = h('div', { style: { padding: '4px 6px' } }, qr.results.map((r, i) => h('div', { key: i, style: { padding: '9px 10px', borderRadius: '8px', marginBottom: '4px', background: tok.panel2, border: '1px solid ' + tok.border } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '5px' } },
            h('span', { style: { font: '600 11px/1.3 ' + tok.fontMono, color: tok.accent, wordBreak: 'break-all' } }, r.path),
            h('button', { onClick: () => this.copy(typeof r.val === 'object' ? JSON.stringify(r.val, null, 2) : String(r.val), 'q' + i), style: { font: '600 9.5px/1 ' + tok.fontUi, textTransform: 'uppercase', color: this.state.copied === 'q' + i ? tok.sem.ok : tok.textDim, background: tok.elev, border: '1px solid ' + tok.border, borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', flex: '0 0 auto' } }, this.state.copied === 'q' + i ? '✓' : 'copy')),
          h('div', { style: { font: '400 12px/1.5 ' + tok.fontMono, color: tok.text, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '160px', overflow: 'auto' } }, typeof r.val === 'object' ? JSON.stringify(r.val, null, 2) : String(r.val)))));
      }
    } else if (S.view === 'raw') {
      const src = parsed.empty ? '' : S.input;
      const lines = src.split('\n');
      explorerEl = h('div', { style: { display: 'flex', minWidth: 0 } },
        showLN ? h('pre', { style: { margin: 0, padding: '4px 10px 4px 0', textAlign: 'right', color: tok.textFaint, font: '400 13px/20px ' + tok.fontMono, borderRight: '1px solid ' + tok.border, flex: '0 0 auto' } }, lines.map((_, i) => (i + 1)).join('\n')) : null,
        h('pre', { style: { margin: 0, padding: '4px 0 4px 12px', font: '400 13px/20px ' + tok.fontMono, whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1, minWidth: 0 } }, src.length <= 60000 ? this.highlight(src, parsed.format, tok) : src));
    } else if (S.view === 'table') {
      const filter = S.searchMode === 'filter';
      if (!this._tableCache || this._tableCache.input !== S.docInput || this._tableCache.term !== term || this._tableCache.mode !== S.searchMode) {
        this._tableCache = { input: S.docInput, term, mode: S.searchMode, res: this.tableRows(node, parsed, { term, filter }) };
      }
      const table = this._tableCache.res;
      const rows = table.rows;
      this._activeRowIndex = -1;
      if (activePath) { const np = activePath.replace(/#[kv]$/, ''); this._activeRowIndex = rows.findIndex(r => r.node.path === np); }
      if (!table.suitable) {
        explorerEl = h('div', { style: { padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' } },
          h('div', { style: { color: tok.textFaint, font: '500 13px/1.6 ' + tok.fontUi } }, 'This document structure is not suitable for table view.'),
          h('button', { style: btnStyle, onClick: () => this.setState({ view: 'tree' }) }, 'Switch to Tree'));
      } else if (!rows.length) {
        explorerEl = h('div', { style: { padding: '24px', color: tok.textFaint, font: '500 13px/1.5 ' + tok.fontUi } }, 'No table rows match the current filter.');
      } else {
        explorerEl = h('div', { className: 'rf-table', style: { minWidth: 0 } },
          h('div', { className: 'rf-table-head', style: { position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: TABLE_COLS, gap: '10px', padding: '8px 10px', borderBottom: '1px solid ' + tok.border, background: tok.panel2, color: tok.textFaint, font: '700 10.5px/1 ' + tok.fontUi, letterSpacing: '.06em', textTransform: 'uppercase' } },
            h('span', {}, 'Path'),
            h('span', {}, 'Key'),
            h('span', {}, 'Value'),
            h('span', {}, 'Type'),
            h('span', { style: { justifySelf: 'end' } }, 'Copy')
          ),
          this.windowed(rows, ctx, this.renderTableRow.bind(this), TABLE_ROW_H)
        );
      }
    } else if (!node) {
      explorerEl = h('div', { style: { padding: '28px 24px', color: tok.textFaint, font: '500 13px/1.6 ' + tok.fontUi } }, parsed.empty ? 'Nothing to explore yet. Paste JSON or XML, drop a file, or load the sample to build an interactive tree.' : h('span', {}, h('span', { style: { color: tok.sem.err, fontWeight: 700 } }, 'Can\u2019t build tree. '), 'Fix the ' + (parsed.format || '').toUpperCase() + ' error on the left \u2014 the tree updates live once it\u2019s valid.'));
    } else {
      const filter = S.searchMode === 'filter';
      if (!this._flatCache || this._flatCache.input !== S.docInput || this._flatCache.collapsed !== S.collapsed || this._flatCache.term !== term || this._flatCache.mode !== S.searchMode) {
        const keep = (term && filter) ? this.keepSet(node, term) : new Set();
        this._flatCache = { input: S.docInput, collapsed: S.collapsed, term, mode: S.searchMode, rows: this.flatten(node, { filter, keep, collapsed: S.collapsed }) };
      }
      const rows = this._flatCache.rows;
      this._activeRowIndex = -1;
      if (activePath) { const np = activePath.replace(/#[kv]$/, ''); this._activeRowIndex = rows.findIndex(r => r.node.path === np && r.type !== 'close'); }
      explorerEl = this.windowed(rows, ctx);
    }

    // stats (cached on input)
    if (!this._statsCache || this._statsCache.input !== S.docInput) this._statsCache = { input: S.docInput, st: this.stats(node, S.docInput) };
    const st = this._statsCache.st;
    const chip = (label, val, color) => h('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '999px', background: tok.elev, border: '1px solid ' + tok.border, whiteSpace: 'nowrap', flex: '0 0 auto' } },
      h('span', { style: { font: '500 11px/1 ' + tok.fontUi, color: tok.textFaint } }, label),
      h('span', { style: { font: '700 11.5px/1 ' + tok.fontMono, color: color || tok.text } }, val));
    const fmtBytes = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
    const statsEl = node ? [
      chip('Type', (parsed.format || '').toUpperCase(), tok.accent),
      chip('Nodes', st.nodes),
      chip('Depth', st.depth),
      chip('Objects', st.obj),
      chip('Arrays', st.arr),
      chip('Values', st.leaf),
      chip('Size', fmtBytes(st.bytes)),
    ] : [h('span', { key: 'e', style: { font: '500 12px/1 ' + tok.fontUi, color: tok.textFaint } }, 'Stats appear here once the document is valid.')];

    // editor highlight + gutter
    const hlEditor = S.input.length <= 30000;
    const highlightEl = hlEditor ? this.highlight(S.input, parsed.format, tok) : null;
    const tabSize = (S.indent === '4' || S.indent === 'tab') ? 4 : 2;
    const taStyle = { position: 'absolute', inset: 0, margin: 0, padding: '12px 14px', font: '400 13px/20px ' + tok.fontMono, whiteSpace: 'pre', overflow: 'auto', resize: 'none', border: 0, outline: 'none', background: 'transparent', color: hlEditor ? 'transparent' : tok.text, caretColor: tok.accent, tabSize };
    if (!this._gutterCache || this._gutterCache.input !== S.input) { const lc = S.input.split('\n').length; let g = ''; for (let i = 1; i <= lc; i++) g += i + (i < lc ? '\n' : ''); this._gutterCache = { input: S.input, text: g }; }
    const gutterText = this._gutterCache.text;

    // badges + labels
    const badgeMap = { json: tok.accent, xml: tok.syn.tag, empty: tok.textFaint };
    const badgeColor = badgeMap[parsed.format] || tok.textFaint;
    const badgeStyle = { display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px', borderRadius: '5px', font: '700 10px/1 ' + tok.fontMono, letterSpacing: '.06em', color: badgeColor, background: 'transparent', border: '1px solid ' + badgeColor + '66' };

    // diff
    const diff = S.mode === 'diff' ? this.renderDiff(tok) : { el: null, add: 0, del: 0 };
    const diffSummary = (diff.add || diff.del) ? '+' + diff.add + '  −' + diff.del : 'Identical';
    const diffSummaryStyle = { font: '600 12px/1 ' + tok.fontMono, color: (diff.add || diff.del) ? tok.text : tok.sem.ok, padding: '0 4px' };

    return {
      themeVars,
      isFormat: S.mode === 'format', isDiff: S.mode === 'diff',
      tabFormatStyle: seg(S.mode === 'format'), tabDiffStyle: seg(S.mode === 'diff'),
      onFormat: () => this.setState({ mode: 'format' }), onDiff: () => this.setState({ mode: 'diff' }),
      dirAuroraStyle: seg(dir === 'aurora'), dirSlateStyle: seg(dir === 'slate'), dirPaperStyle: seg(dir === 'paper'),
      onDirAurora: () => this.setState({ direction: 'aurora' }), onDirSlate: () => this.setState({ direction: 'slate' }), onDirPaper: () => this.setState({ direction: 'paper' }),
      onThemeToggle: () => this.setState({ theme: theme === 'dark' ? 'light' : 'dark' }),
      themeLabel: theme === 'dark' ? 'Dark' : 'Light', themeDotBg: theme === 'dark' ? tok.text : 'transparent',

      btnStyle, btnHover, btnGhost, navBtnStyle,
      formatBadge: parsed.format === 'empty' ? 'EMPTY' : parsed.format.toUpperCase(), badgeStyle,
      input: S.input, onInput: (e) => { const val = e.target.value; if (val.length <= 30000) this.setState({ input: val }); clearTimeout(this._docTimer); this._docTimer = setTimeout(() => this.setState({ input: val, docInput: val }), 160); },
      onEditorScroll: (e) => { const t = e.target; if (this.highlightRef.current) { this.highlightRef.current.scrollTop = t.scrollTop; this.highlightRef.current.scrollLeft = t.scrollLeft; } if (this.gutterRef.current) this.gutterRef.current.scrollTop = t.scrollTop; },
      editorRef: this.editorRef, highlightRef: this.highlightRef, gutterRef: this.gutterRef, fileRef: this.fileRef, dropRef: this.dropRef, treeScrollRef: this.treeScrollRef,
      highlightEl, gutterText, taStyle,
      gutterWrapStyle: { flex: '0 0 auto', width: showLN ? '52px' : '0', overflow: 'hidden', borderRight: showLN ? '1px solid ' + tok.border : 'none', background: tok.panel2, display: showLN ? 'block' : 'none' },
      indent: S.indent, onIndentChange: (e) => this.setState({ indent: e.target.value }),
      onBeautify: () => this.reformat(false), onMinify: () => this.reformat(true), onSort: () => this.sortKeys(),
      onConvert: () => this.convert(), convertLabel: isXml ? 'To JSON' : 'To XML',
      onUploadClick: () => this.fileRef.current && this.fileRef.current.click(),
      onUpload: (e) => { const f = e.target.files && e.target.files[0]; if (f) this.loadFile(f); e.target.value = ''; },
      onSample: () => { const v = isXml ? this.jsonToXml(JSON.parse(SAMPLE_JSON)) : SAMPLE_JSON; this.applyInput(v, { collapsed: new Set(), search: '', query: '', matchIndex: 0 }); },
      onCopySource: () => this.copy(S.input, '__src'), copyLabel: S.copied === '__src' ? 'Copied ✓' : 'Copy',
      onDownload: () => { const blob = new Blob([S.input], { type: isXml ? 'text/xml' : 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'document.' + (isXml ? 'xml' : 'json'); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); },
      onClear: () => this.applyInput('', { collapsed: new Set(), search: '', query: '' }),
      onDragOver: (e) => { e.preventDefault(); if (!S.dragging) this.setState({ dragging: true }); },
      onDragLeave: (e) => { e.preventDefault(); this.setState({ dragging: false }); },
      onDrop: (e) => { e.preventDefault(); this.setState({ dragging: false }); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) this.loadFile(f); },
      dropOverlayStyle: { position: 'absolute', inset: 0, display: S.dragging ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', background: tok.accentWeak, border: '2px dashed ' + tok.accent, borderRadius: '8px', color: tok.accent, font: '700 15px/1 ' + tok.fontUi, pointerEvents: 'none', zIndex: 3, backdropFilter: 'blur(1px)' },

      onTreeScroll: (e) => { const top = e.target.scrollTop; if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = null; this.setState({ scrollTop: top }); }); },
      onShare: () => this.doShare(), shareLabel: S.shareMsg || 'Share link',
      onToggleHelp: () => this.setState(s => ({ showHelp: !s.showHelp })), showHelp: S.showHelp, stop: (e) => e.stopPropagation(),

      statusBarStyle: { display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderTop: '1px solid ' + tok.border, background: hasError ? tok.sem.errW : (parsed.ok ? tok.sem.okW : tok.panel2) },
      statusText, statusColor, statusDot, statusDotHalo, hasError, errorLine,
      onJumpError: () => { const ta = this.editorRef.current; if (ta && errorLine) { const line = errorLine; const upto = S.input.split('\n').slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0); ta.focus(); ta.setSelectionRange(upto, upto); const lh = 20; ta.scrollTop = Math.max(0, (line - 3) * lh); if (this.highlightRef.current) this.highlightRef.current.scrollTop = ta.scrollTop; if (this.gutterRef.current) this.gutterRef.current.scrollTop = ta.scrollTop; } },

      view: S.view, isTreeView: S.view === 'tree', viewTreeStyle: segFlat(S.view === 'tree'), viewRawStyle: segFlat(S.view === 'raw'), viewTableStyle: segFlat(S.view === 'table'),
      onViewTree: () => this.setState({ view: 'tree' }), onViewRaw: () => this.setState({ view: 'raw' }), onViewTable: () => this.setState({ view: 'table' }),
      onExpandAll: () => this.setState({ collapsed: new Set() }),
      onCollapseAll: () => this.setState({ collapsed: new Set(this.allContainerPaths(node).filter(p => p !== '/root' && node && p !== node.path)) }),

      search: S.search, onSearch: (e) => this.setState({ search: e.target.value, matchIndex: 0 }), hasSearch: !!savedTerm,
      onClearSearch: () => this.setState({ search: '', matchIndex: 0 }),
      matchLabel, onPrevMatch: () => this.setState(s => ({ matchIndex: s.matchIndex - 1 })), onNextMatch: () => this.setState(s => ({ matchIndex: s.matchIndex + 1 })),
      searchMode: S.searchMode, modeHiStyle: seg(S.searchMode === 'highlight'), modeFilStyle: seg(S.searchMode === 'filter'),
      onModeHighlight: () => this.setState({ searchMode: 'highlight' }), onModeFilter: () => this.setState({ searchMode: 'filter' }),
      explorerMode: S.explorerMode, isSearchToolbarMode: S.explorerMode === 'search', isQueryToolbarMode: S.explorerMode === 'query',
      toolbarSearchStyle: seg(S.explorerMode === 'search'), toolbarQueryStyle: seg(S.explorerMode === 'query'),
      onToolbarSearchMode: () => this.setState({ explorerMode: 'search' }), onToolbarQueryMode: () => this.setState({ explorerMode: 'query' }),

      query: S.query, onQuery: (e) => this.setState({ query: e.target.value }), hasQuery: !!savedQuery,
      queryPrefix: isXml ? 'XPath' : '$', queryPlaceholder: isXml ? "//department[@id='d2']  or  //title" : "$.store.departments[*].title",
      queryStat, queryStatStyle: { font: '600 11px/1 ' + tok.fontMono, color: queryStatOk ? tok.textDim : tok.sem.err, whiteSpace: 'nowrap' },
      onClearQuery: () => this.setState({ query: '' }),

      explorerEl, statsEl,

      diffA: S.diffA, diffB: S.diffB,
      onDiffAChange: (e) => this.setState({ diffA: e.target.value }), onDiffBChange: (e) => this.setState({ diffB: e.target.value }),
      onDiffBeautify: () => { const nb = t => { const p = this.parse(t); return p.ok && p.format === 'json' ? JSON.stringify(p.value, null, 2) : (p.ok && p.format === 'xml' ? this.prettyXml(p.doc) : t); }; this.setState({ diffA: nb(S.diffA), diffB: nb(S.diffB) }); },
      onDiffSwap: () => this.setState({ diffA: S.diffB, diffB: S.diffA }),
      onDiffSample: () => this.setState({ diffA: SAMPLE_DIFF_A, diffB: SAMPLE_DIFF_B }),
      diffEl: diff.el, diffSummary, diffSummaryStyle,

      // Icon React elements (from js/icons.js via window.PAW_ICONS)
      ...(window.PAW_ICONS ? (function(ic) { return {
        iconSun: ic.sun(),
        iconWand: ic.wand(),
        iconMinify: ic.minify(),
        iconSortKeys: ic.sortKeys(),
        iconSwap: ic.swap(),
        iconUpload: ic.upload(),
        iconFileDoc: ic.fileDoc(),
        iconCopy: ic.copy(),
        iconShare: ic.share(),
        iconDownload: ic.download(),
        iconTrash: ic.trash(),
        iconTree: ic.tree(),
        iconTable: ic.table(),
        iconCode: ic.code(),
        iconExpand: ic.expand(),
        iconCollapse: ic.collapse(),
        iconPencil: ic.pencil(),
        iconFilter: ic.filter(),
        iconDiffFile: ic.diffFile(),
      }; })(window.PAW_ICONS) : {}),
    };
  }
}
