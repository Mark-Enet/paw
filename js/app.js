
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

const SAMPLE_SANITIZE = `{
  "number": "INC0010042",
  "sys_id": "8a92cfae1b3a4a1084b1e1c4f2b3d4e5",
  "caller_id": "8a92cfae1b3a4a1084b1e1c4f2b3d4e5",
  "opened_by": "Jane Doe",
  "assigned_to": "Marcus Chen",
  "u_phone": "(555) 123-4567",
  "contact_email": "jane.doe@example.com",
  "account": "Initech Holdings",
  "correlation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "short_description": "VPN client won't connect from home office",
  "work_notes": "Escalated to network after confirming the caller's laptop (10.20.4.17) can't reach the VPN gateway. Callback number on file is (555) 987-6543. Unrelated: caller's badge 512-00-4471 was flagged at the lobby kiosk -- logging for reference only."
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

// Cross-mode hand-off destinations (Round 4). Dig/Bury are single-slot; Spot
// has two (A/B), so it needs two separate target keys even though it's one
// mode. A panel's Send-to menu offers every target whose mode isn't its own.
const HANDOFF_TARGETS = {
  dig: { label: 'Dig', mode: 'format' },
  spotA: { label: 'Spot · Version A', mode: 'diff' },
  spotB: { label: 'Spot · Version B', mode: 'diff' },
  bury: { label: 'Bury', mode: 'sanitize' },
};

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
const RECORD_ROW_H = TABLE_ROW_H;
const TABLE_COLS = 'minmax(240px,2.2fr) minmax(120px,1.1fr) minmax(180px,1.4fr) minmax(150px,1fr)';
const INDEXED_SEG_RE = /\[\d+\]/;
const TABLE_JSON_MAX_DEPTH = 2;
const TABLE_XML_MIN_SUITABLE_ROWS = 1;
const MAX_PERSIST = 500000;
const LIBRARY_NAME_MAX_LEN = 160; // formerly SOURCE_NAME_MAX_LEN; now the Save As/Rename name ceiling
const APP_META_DEFAULT = Object.freeze({
  appName: 'PAW',
  tagline: 'PAYLOAD ANALYSIS WINGMAN',
  byline: 'by Widgemo',
  version: '0.3.2',
  copyright: 'Copyright (c) 2026 Widgemo. All rights reserved.',
  feedbackUrl: 'https://github.com/widgemo/paw/issues/new/choose'
});
const REMEMBER_DEFAULT = Object.freeze({
  content: true,
  workspace: true,
  explorer: true,
  find: true,
});

function sanitizeAppMeta(raw) {
  const meta = Object.assign({}, APP_META_DEFAULT);
  if (!raw || typeof raw !== 'object') return meta;
  if (typeof raw.appName === 'string' && raw.appName.trim()) meta.appName = raw.appName.trim();
  if (typeof raw.tagline === 'string' && raw.tagline.trim()) meta.tagline = raw.tagline.trim();
  if (typeof raw.byline === 'string' && raw.byline.trim()) meta.byline = raw.byline.trim();
  if (typeof raw.version === 'string' && raw.version.trim()) meta.version = raw.version.trim();
  if (typeof raw.copyright === 'string' && raw.copyright.trim()) meta.copyright = raw.copyright.trim();
  if (typeof raw.feedbackUrl === 'string' && raw.feedbackUrl.trim()) meta.feedbackUrl = raw.feedbackUrl.trim();
  return meta;
}

function sanitizeRememberPrefs(raw) {
  const base = Object.assign({}, REMEMBER_DEFAULT);
  if (!raw || typeof raw !== 'object') return base;
  if (typeof raw.content === 'boolean') base.content = raw.content;
  if (typeof raw.workspace === 'boolean') base.workspace = raw.workspace;
  if (typeof raw.explorer === 'boolean') base.explorer = raw.explorer;
  if (typeof raw.find === 'boolean') base.find = raw.find;
  return base;
}

function utf8ToBinary(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return bin;
}

function binaryToUtf8(bin) {
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function b64urlEncode(str) {
  return btoa(utf8ToBinary(str)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(data) {
  const pad = data.length % 4;
  const norm = data.replace(/-/g, '+').replace(/_/g, '/') + (pad ? '='.repeat(4 - pad) : '');
  return binaryToUtf8(atob(norm));
}

function decodeSharePayload(data) {
  // Accept new base64url payloads and legacy base64 payloads.
  try { return b64urlDecode(data); } catch (e) {}
  return binaryToUtf8(atob(data));
}

function isApplePlatform() {
  if (typeof navigator === 'undefined') return false;
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const ua = navigator.userAgent || '';
  const s = (platform + ' ' + ua).toLowerCase();
  return /mac|iphone|ipad|ipod/.test(s);
}

// Mirrors Component#detect()'s logic (js/app.js, method body below) so a
// library record's format can be tagged from loadPersisted()/migration,
// which run before the component instance (and its `this.detect`) exists.
// Shares the same fallback-to-'json' quirk for freeform/log text on purpose
// — the two should tag identical content identically.
function detectFormatForLibrary(text) {
  const t = (text || '').trim();
  if (!t) return 'json';
  if (t[0] === '<') return 'xml';
  if (t[0] === '{' || t[0] === '[') return 'json';
  if (window.PAW_TABLE && window.PAW_TABLE.detect(t)) return 'table';
  return 'json';
}

const LIBRARY_SLOTS = ['dig', 'spotA', 'spotB', 'bury'];

function formatByteSize(b) {
  return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
}

function defaultLibraryLinks() {
  return { dig: { id: null, dirty: false }, spotA: { id: null, dirty: false }, spotB: { id: null, dirty: false }, bury: { id: null, dirty: false } };
}

function sanitizeLibraryLinks(raw) {
  const base = defaultLibraryLinks();
  if (!raw || typeof raw !== 'object') return base;
  LIBRARY_SLOTS.forEach((slot) => {
    const link = raw[slot];
    if (link && typeof link === 'object' && (typeof link.id === 'string' || link.id === null) && typeof link.dirty === 'boolean') {
      base[slot] = { id: link.id, dirty: link.dirty };
    }
  });
  return base;
}

function loadPersisted() {
  let data = {};
  try { const raw = localStorage.getItem(LS_KEY); if (raw) data = JSON.parse(raw) || {}; } catch (e) {}
  try {
    const hsh = (location.hash || '').replace(/^#/, '');
    if (hsh.indexOf('d=') === 0) {
      const d = JSON.parse(decodeSharePayload(hsh.slice(2)));
      if (d && typeof d === 'object') data = Object.assign({}, data, d);
    }
  } catch (e) {}

  // One-time upgrade: fold any pre-existing single-slot content into the
  // user's first Payload Library records before that content's own name
  // (the old, Dig-only `sourceName`) is discarded below. No-ops (returns
  // null) once the library has been created at all, so this never re-runs.
  let migratedLinks = null;
  try {
    if (window.PAW_LIBRARY) {
      migratedLinks = window.PAW_LIBRARY.migrateLegacyIfNeeded(
        { input: data.input, diffA: data.diffA, diffB: data.diffB, sourceName: data.sourceName },
        { sampleDiffA: SAMPLE_DIFF_A, sampleDiffB: SAMPLE_DIFF_B, detectFormat: detectFormatForLibrary }
      );
    }
  } catch (e) {}

  if (data && typeof data.input === 'string' && data.input.length > MAX_PERSIST) delete data.input;
  if (data && typeof data.diffA === 'string' && data.diffA.length > MAX_PERSIST) delete data.diffA;
  if (data && typeof data.diffB === 'string' && data.diffB.length > MAX_PERSIST) delete data.diffB;
  if (data && typeof data.sanitizeInput === 'string' && data.sanitizeInput.length > MAX_PERSIST) delete data.sanitizeInput;
  if (data.mode !== 'format' && data.mode !== 'diff' && data.mode !== 'sanitize') delete data.mode;
  if (data.theme !== 'light' && data.theme !== 'dark') delete data.theme;
  if (data.direction !== 'aurora' && data.direction !== 'slate' && data.direction !== 'paper') delete data.direction;
  if (data.view !== 'tree' && data.view !== 'table' && data.view !== 'raw') delete data.view;
  if (data.searchMode !== 'highlight' && data.searchMode !== 'filter') delete data.searchMode;
  if (data.explorerMode !== 'search' && data.explorerMode !== 'query') delete data.explorerMode;
  if (data.indent !== '2' && data.indent !== '4' && data.indent !== 'tab') delete data.indent;
  if (data.fullscreenPanel !== 'source' && data.fullscreenPanel !== 'explorer') delete data.fullscreenPanel;
  if (data.sanitizeFullscreenPanel !== 'input' && data.sanitizeFullscreenPanel !== 'output') delete data.sanitizeFullscreenPanel;
  if (data.diffFullscreenPanel !== 'a' && data.diffFullscreenPanel !== 'b' && data.diffFullscreenPanel !== 'result') delete data.diffFullscreenPanel;
  if (data.tableMode !== 'path' && data.tableMode !== 'record') delete data.tableMode;
  if (typeof data.tableSourcePath !== 'string') delete data.tableSourcePath;
  if (typeof data.tableHasHeaderRow !== 'boolean') delete data.tableHasHeaderRow;
  delete data.sourceName; // retired in favor of per-slot Payload Library links
  data.libraryLinks = sanitizeLibraryLinks(data.libraryLinks);
  if (migratedLinks) data.libraryLinks = Object.assign(data.libraryLinks, migratedLinks);
  data.rememberPrefs = sanitizeRememberPrefs(data.rememberPrefs);
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
      input: P.input != null ? P.input : '',
      docInput: P.input != null ? P.input : '',
      libraryLinks: P.libraryLinks || defaultLibraryLinks(),
      showLibrary: false,
      libraryOpenContext: null, // slot key when opened via a panel's "Open from Library…", else null (global browse)
      libraryFilter: '',
      libraryMenuOpen: null, // which panel's own Save/Rename/… popover is open, if any
      librarySaveAsPromptOpen: false,
      librarySaveAsName: '',
      librarySaveAsSlot: null,
      libraryRenamePromptOpen: false,
      libraryRenameId: null,
      libraryRenameName: '',
      libraryError: null,
      softWrap: !!P.softWrap,
      sanitizeScrollLock: !!P.sanitizeScrollLock,
      indent: P.indent || '2',
      showBeautifyMenu: false,
      view: P.view || 'tree',
      collapsed: new Set(),
      search: P.search || '',
      searchMode: P.searchMode || 'highlight',
      explorerMode: P.explorerMode || 'search',
      matchIndex: 0,
      query: P.query || '',
      copied: null,
      dragging: false,
      draggingSpotA: false,
      draggingSpotB: false,
      draggingBury: false,
      tableMode: P.tableMode || 'path',
      tableSourcePath: P.tableSourcePath || '/root',
      tableLevelFilter: null, // Record Table log view: 'error'|'warn'|'info'|'debug'|null
      tableStitchLogs: false, // Record Table: merge blank-level/blank-time continuation rows into the row above
      tableLogSort: null, // Record Table: 'asc'|'desc' by the guessed timestamp column, or null for document order
      tableHasHeaderRow: P.tableHasHeaderRow !== false, // global "how do I read tabular text" preference, shared by Dig/Spot/Bury via parseTable()
      diffA: P.diffA != null ? P.diffA : SAMPLE_DIFF_A,
      diffB: P.diffB != null ? P.diffB : SAMPLE_DIFF_B,
      diffAlignByKey: false, // Spot: when both sides are tabular, diff by a guessed key column instead of raw line order
      diffSuppressNoise: false, // Spot: blank out timestamps/durations/hex32-ids/GUIDs before diffing so real changes aren't buried
      scrollTop: 0,
      viewportH: 600,
      fullscreenPanel: P.fullscreenPanel || null,
      sanitizeFullscreenPanel: P.sanitizeFullscreenPanel || null,
      diffFullscreenPanel: P.diffFullscreenPanel || null,
      showHelp: false,
      showAbout: false,
      showSettings: false,
      queryDrawerCollapsed: false,
      shareMsg: null,
      appMeta: APP_META_DEFAULT,
      rememberPrefs: sanitizeRememberPrefs(P.rememberPrefs),
      sanitizeInput: P.sanitizeInput != null ? P.sanitizeInput : '',
      sanitizeProfileId: 'servicenow',
      sanitizeOverrides: {},
      sanitizeManualRules: [],
      sanitizeSelection: null,
      sanitizeAutoDetectNotice: null, // transient "this already matches rule X" message after clicking Auto-detect
      sanitizeSaveManualAsRule: false,
      showSanitizeRules: false,
      sanitizeRulesImportError: null,
      sanitizeRuleEditing: null,
      sanitizeRuleDraft: null,
      sanitizeRuleError: null,
      sanitizeExportPromptOpen: false,
      sanitizeExportName: '',
      sendMenuOpen: null,
      handoffConfirm: null,
    };
    this.editorRef = React.createRef();
    this.highlightRef = React.createRef();
    this.gutterRef = React.createRef();
    this.fileRef = React.createRef();
    this.beautifyMenuRef = React.createRef();
    this.settingsMenuRef = React.createRef();
    this.treeScrollRef = React.createRef();
    this.dropRef = React.createRef();
    this.activeMatchRef = React.createRef();
    this.sanitizeFileRef = React.createRef();
    this.sanitizeInputEditorRef = React.createRef();
    this.sanitizeInputHighlightRef = React.createRef();
    this.sanitizeOutputEditorRef = React.createRef();
    this.sanitizeOutputHighlightRef = React.createRef();
    this.diffResultRef = React.createRef();
    this.digLibMenuRef = React.createRef();
    this.spotALibMenuRef = React.createRef();
    this.spotBLibMenuRef = React.createRef();
    this.buryLibMenuRef = React.createRef();
    this.diffAFileRef = React.createRef();
    this.diffADropRef = React.createRef();
    this.diffBFileRef = React.createRef();
    this.diffBDropRef = React.createRef();
    this.buryFileRef = React.createRef();
    this.buryDropRef = React.createRef();
    this._lastMatch = -1;
    this._copyTimer = null;
    this._model = null;
    this._activeRowIndex = -1;
    this._activeRowHeight = ROW_H;
    this._tableCache = null;
    this._raf = null;
    this._persistTimer = null;
    this._shareTimer = null;
    this._docTimer = null;
    this._onPageHide = null;
    this._onKey = this.handleKey.bind(this);
    this._sanitizeMapping = null;
    this._sanitizeRun = null;
  }

  keepPaths(paths) {
    const keep = new Set();
    (paths || []).forEach((path) => {
      let cur = String(path || '').trim();
      while (cur) {
        keep.add(cur);
        const next = cur.replace(/\/[^/]+$/, '');
        if (!next || next === cur) break;
        cur = next;
      }
    });
    return keep;
  }

  keepPathsForQuery(node, queryPaths) {
    const keep = new Set();
    const matches = new Set();
    const target = new Set();
    Array.from(queryPaths || []).map((path) => String(path || '').trim()).filter(Boolean).forEach((path) => {
      target.add(path);
      const treePath = this.jsonPathToTreePath(path);
      if (treePath) target.add(treePath);
    });
    const walk = (n) => {
      if (!n) return false;
      const selfMatched = !!((n.jpath && target.has(n.jpath)) || (n.path && target.has(n.path)));
      let childMatched = false;
      if (n.children) n.children.forEach((child) => { if (walk(child)) childMatched = true; });
      if (selfMatched) matches.add(n.path);
      if (selfMatched || childMatched) keep.add(n.path);
      return selfMatched || childMatched;
    };
    walk(node);
    return { keep, matches };
  }

  componentDidMount() {
    window.addEventListener('keydown', this._onKey, true);
    this.loadAppMeta();
    this._onDocClick = (e) => {
      const beautifyWrap = this.beautifyMenuRef.current;
      if (beautifyWrap && !beautifyWrap.contains(e.target) && this.state.showBeautifyMenu) this.setState({ showBeautifyMenu: false });
      const settingsWrap = this.settingsMenuRef.current;
      if (settingsWrap && !settingsWrap.contains(e.target) && this.state.showSettings) this.setState({ showSettings: false });
      if (this.state.sendMenuOpen && !(e.target.closest && e.target.closest('.rf-send-menu-wrap'))) this.setState({ sendMenuOpen: null });
      const libMenuRefs = { dig: this.digLibMenuRef, spotA: this.spotALibMenuRef, spotB: this.spotBLibMenuRef, bury: this.buryLibMenuRef };
      if (this.state.libraryMenuOpen) {
        const wrap = libMenuRefs[this.state.libraryMenuOpen] && libMenuRefs[this.state.libraryMenuOpen].current;
        if (wrap && !wrap.contains(e.target)) this.setState({ libraryMenuOpen: null });
      }
    };
    document.addEventListener('pointerdown', this._onDocClick, true);
    this._onResize = () => { const b = this.treeScrollRef.current; if (b && b.clientHeight) this.setState({ viewportH: b.clientHeight }); };
    window.addEventListener('resize', this._onResize);
    this._onPageHide = () => this.persistNow();
    window.addEventListener('pagehide', this._onPageHide);
    const b = this.treeScrollRef.current; if (b && b.clientHeight) this.setState({ viewportH: b.clientHeight });
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this._onKey, true);
    document.removeEventListener('pointerdown', this._onDocClick, true);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pagehide', this._onPageHide);
    this.persistNow();
    clearTimeout(this._persistTimer); clearTimeout(this._copyTimer); clearTimeout(this._shareTimer); clearTimeout(this._docTimer);
  }

  componentDidUpdate(prevProps, prevState) {
    const box = this.treeScrollRef.current;
    if (box && box.clientHeight && Math.abs(box.clientHeight - this.state.viewportH) > 2) { this.setState({ viewportH: box.clientHeight }); return; }
    if (this._lastMatch !== this.state.matchIndex) {
      this._lastMatch = this.state.matchIndex;
      if (this._activeRowIndex >= 0 && box) {
        const rowH = this._activeRowHeight || ROW_H;
        const target = Math.max(0, this._activeRowIndex * rowH - box.clientHeight / 2 + rowH);
        box.scrollTop = target; this.setState({ scrollTop: target });
      } else if (this.activeMatchRef.current) {
        try { this.activeMatchRef.current.scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
      }
    }
    const rememberChanged = prevState && (
      prevState.rememberPrefs.content !== this.state.rememberPrefs.content ||
      prevState.rememberPrefs.workspace !== this.state.rememberPrefs.workspace ||
      prevState.rememberPrefs.explorer !== this.state.rememberPrefs.explorer ||
      prevState.rememberPrefs.find !== this.state.rememberPrefs.find
    );
    if (prevState && (rememberChanged || prevState.input !== this.state.input || prevState.libraryLinks !== this.state.libraryLinks || prevState.theme !== this.state.theme || prevState.direction !== this.state.direction || prevState.mode !== this.state.mode || prevState.view !== this.state.view || prevState.indent !== this.state.indent || prevState.softWrap !== this.state.softWrap || prevState.sanitizeScrollLock !== this.state.sanitizeScrollLock || prevState.searchMode !== this.state.searchMode || prevState.explorerMode !== this.state.explorerMode || prevState.search !== this.state.search || prevState.query !== this.state.query || prevState.fullscreenPanel !== this.state.fullscreenPanel || prevState.sanitizeFullscreenPanel !== this.state.sanitizeFullscreenPanel || prevState.diffFullscreenPanel !== this.state.diffFullscreenPanel || prevState.tableMode !== this.state.tableMode || prevState.tableSourcePath !== this.state.tableSourcePath || prevState.tableHasHeaderRow !== this.state.tableHasHeaderRow || prevState.diffA !== this.state.diffA || prevState.diffB !== this.state.diffB || prevState.sanitizeInput !== this.state.sanitizeInput || prevState.rememberPrefs !== this.state.rememberPrefs)) {
      this.schedulePersist();
    }
    this.syncEditorLayers();
    this.syncLayers(this.sanitizeInputEditorRef, this.sanitizeInputHighlightRef, null);
    this.syncLayers(this.sanitizeOutputEditorRef, this.sanitizeOutputHighlightRef, null);
  }

  persistNow() {
    const S = this.state;
    const remember = sanitizeRememberPrefs(S.rememberPrefs);
    const data = {
      theme: S.theme,
      direction: S.direction,
      indent: S.indent,
      softWrap: S.softWrap,
      sanitizeScrollLock: S.sanitizeScrollLock,
      tableHasHeaderRow: S.tableHasHeaderRow,
      rememberPrefs: remember,
      libraryLinks: S.libraryLinks,
    };

    if (remember.workspace) {
      data.mode = S.mode;
      data.fullscreenPanel = S.fullscreenPanel;
      data.sanitizeFullscreenPanel = S.sanitizeFullscreenPanel;
      data.diffFullscreenPanel = S.diffFullscreenPanel;
    }
    if (remember.explorer) {
      data.view = S.view;
      data.tableMode = S.tableMode;
      data.tableSourcePath = S.tableSourcePath;
    }
    if (remember.find) {
      data.searchMode = S.searchMode;
      data.explorerMode = S.explorerMode;
      data.search = S.search;
      data.query = S.query;
    }
    if (remember.content) {
      data.diffA = S.diffA;
      data.diffB = S.diffB;
      data.input = S.input;
      data.sanitizeInput = S.sanitizeInput;
    }

    if (typeof data.input === 'string' && data.input.length > MAX_PERSIST) delete data.input;
    if (typeof data.diffA === 'string' && data.diffA.length > MAX_PERSIST) delete data.diffA;
    if (typeof data.diffB === 'string' && data.diffB.length > MAX_PERSIST) delete data.diffB;
    if (typeof data.sanitizeInput === 'string' && data.sanitizeInput.length > MAX_PERSIST) delete data.sanitizeInput;

    const stripKeys = (src, keys) => {
      const out = Object.assign({}, src);
      keys.forEach((k) => { delete out[k]; });
      return out;
    };

    const attempts = [
      data,
      stripKeys(data, ['diffA', 'diffB']),
      stripKeys(data, ['input', 'diffA', 'diffB', 'sanitizeInput']),
      stripKeys(data, ['input', 'diffA', 'diffB', 'sanitizeInput', 'search', 'query'])
    ];

    for (let i = 0; i < attempts.length; i++) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(attempts[i]));
        return;
      } catch (e) {}
    }
  }

  schedulePersist() {
    clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => this.persistNow(), 220);
  }

  loadAppMeta() {
    if (typeof fetch !== 'function') return;
    fetch('version.json', { cache: 'no-store' })
      .then((resp) => {
        if (!resp.ok) throw new Error('meta-fetch-failed');
        return resp.json();
      })
      .then((meta) => this.setState({ appMeta: sanitizeAppMeta(meta) }))
      .catch(() => {});
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
      if (k === 'Escape' && this.state.fullscreenPanel) this.setState({ fullscreenPanel: null });
      else if (k === 'Escape' && this.state.sanitizeFullscreenPanel) this.setState({ sanitizeFullscreenPanel: null });
      else if (k === 'Escape' && this.state.diffFullscreenPanel) this.setState({ diffFullscreenPanel: null });
      else if (k === 'Escape' && this.state.handoffConfirm) this.setState({ handoffConfirm: null });
      else if (k === 'Escape' && this.state.sendMenuOpen) this.setState({ sendMenuOpen: null });
      else if (k === '?') this.setState(s => ({ showHelp: !s.showHelp, showAbout: false, showSettings: false }));
      else if (k === 'Escape' && this.state.showBeautifyMenu) this.setState({ showBeautifyMenu: false });
      else if (k === 'Escape' && this.state.showSettings) this.setState({ showSettings: false });
      else if (k === 'Escape' && this.state.showAbout) this.setState({ showAbout: false });
      else if (k === 'Escape' && this.state.showHelp) this.setState({ showHelp: false });
    }
  }

  toggleAll() {
    const m = this.buildModel();
    if (this.state.collapsed.size > 0) this.setState({ collapsed: new Set() });
    else this.setState({ collapsed: new Set(this.allContainerPaths(m.node).filter(p => m.node && p !== m.node.path)) });
  }

  locateNode(node, path) {
    if (!node || !path) return null;
    if (node.path === path) return node;
    if (!node.children || !node.children.length) return null;
    for (const child of node.children) {
      const found = this.locateNode(child, path);
      if (found) return found;
    }
    return null;
  }

  jsonPathToTreePath(path) {
    const src = (path || '').trim();
    if (!src || src[0] !== '$') return null;
    const segs = ['root'];
    const re = /(?:\.([A-Za-z_$][\w$]*)|\[(\d+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\])/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      if (m[1]) segs.push(m[1]);
      else if (m[2]) {
        const raw = m[2];
        if (/^\d+$/.test(raw)) segs.push(raw);
        else {
          try {
            const key = this.jsonPathUnquote(raw);
            segs.push(String(key));
          } catch (e) {
            return null;
          }
        }
      }
    }
    return '/' + segs.join('/');
  }

  focusQueryResult(path) {
    const nodePath = this.jsonPathToTreePath(path);
    if (!nodePath) return;
    const model = this.buildModel();
    const target = this.locateNode(model.node, nodePath);
    if (!target) return;
    this.setState({ view: 'tree', collapsed: new Set() });
  }

  selectTableSource(path, mode) {
    this.setState({
      tableSourcePath: path,
      view: 'table',
      tableMode: mode || this.state.tableMode,
    });
  }

  tableSourceTrail(path) {
    const safePath = (path && String(path).startsWith('/')) ? String(path) : '/root';
    const parts = safePath.split('/').filter(Boolean);
    if (!parts.length) return [{ label: 'root', path: '/root', isActive: true }];
    let acc = '';
    return parts.map((seg, idx) => {
      acc += '/' + seg;
      const isIndex = /^\d+$/.test(seg);
      return {
        label: idx === 0 ? 'root' : (isIndex ? ('[' + seg + ']') : seg),
        path: acc,
        isActive: idx === parts.length - 1,
      };
    });
  }

  renderTableSourceIndicator(sourceNode, tok) {
    const sourcePath = sourceNode && sourceNode.path ? sourceNode.path : '/root';
    const trail = this.tableSourceTrail(sourcePath);
    const trailEls = [];
    trail.forEach((part, idx) => {
      if (idx) trailEls.push(h('span', { key: part.path + '#sep', style: { color: tok.textFaint, font: '600 10px/1 ' + tok.fontUi } }, '›'));
      trailEls.push(h('button', {
        key: part.path,
        onClick: (e) => { e.stopPropagation(); this.selectTableSource(part.path); },
        title: part.path,
        style: {
          font: '600 11px/1 ' + tok.fontMono,
          color: part.isActive ? tok.accent : tok.textDim,
          background: part.isActive ? tok.accentWeak : tok.panel2,
          border: '1px solid ' + tok.border,
          borderRadius: '6px',
          padding: '3px 6px',
          cursor: 'pointer'
        }
      }, part.label));
    });
    return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' } },
      h('span', { style: { color: tok.textDim, font: '600 11px/1 ' + tok.fontUi } }, 'Source:'),
      trailEls
    );
  }

  async writeClipboard(text) {
    const value = text == null ? '' : String(text);
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (e) {}
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand && document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) { return false; }
  }

  async doShare() {
    const S = this.state;
    const data = { theme: S.theme, direction: S.direction, view: S.view, indent: S.indent, softWrap: S.softWrap, sanitizeScrollLock: S.sanitizeScrollLock, mode: S.mode, input: S.input };
    try {
      const hash = 'd=' + b64urlEncode(JSON.stringify(data));
      const url = location.origin + location.pathname + location.search + '#' + hash;
      location.hash = hash;
      const copied = await this.writeClipboard(url);
      this.flashShare(copied ? 'Link copied \u2713' : 'Link ready (copy blocked)');
    } catch (e) { this.flashShare('Link too large'); }
  }

  flashShare(msg) { clearTimeout(this._shareTimer); this.setState({ shareMsg: msg }); this._shareTimer = setTimeout(() => this.setState({ shareMsg: null }), 1800); }

  // ---------- parsing ----------
  detect(text) {
    const t = (text || '').trim();
    if (!t) return 'empty';
    if (t[0] === '<') return 'xml';
    if (t[0] === '{' || t[0] === '[') return 'json';
    if (window.PAW_TABLE && window.PAW_TABLE.detect(t)) return 'table';
    return 'json';
  }

  parse(text) {
    const fmt = this.detect(text);
    if (fmt === 'empty') return { format: 'empty', ok: false, empty: true };
    if (fmt === 'xml') return this.parseXML(text);
    if (fmt === 'table') return this.parseTable(text);
    return this.parseJSON(text);
  }

  // CSV/TSV/Markdown-table input (e.g. a ServiceNow list-view export copied
  // via snutils). Parses into the same array-of-plain-objects shape a JSON
  // array already takes, so rootNode()/buildJson() build the usual tree
  // with zero special-casing downstream.
  parseTable(text) {
    const result = window.PAW_TABLE.parse(text, { hasHeaderRow: this.state.tableHasHeaderRow !== false });
    if (!result.ok) return { format: 'table', ok: false, error: { message: result.error, line: null, col: null } };
    return result;
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
      children.push({ kind: 'leaf', vType: 'attr', key: '@' + a.name, path: path + '/@' + a.name, jpath: jpath + '/@' + a.name, disp: a.value, copyText: a.value, el });
    }
    const elems = Array.from(el.children);
    const text = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (elems.length === 0) {
      if ((el.attributes || []).length === 0) {
        return { kind: 'leaf', vType: this.xmlLeafType(text), key: name, path, jpath, disp: text, copyText: text, el };
      }
      if (text) children.push({ kind: 'leaf', vType: 'text', key: '#text', path: path + '/#text', jpath: jpath + '/text()', disp: text, copyText: text, el });
    } else {
      const grouped = {};
      const byName = {};
      elems.forEach(c => {
        if (!byName[c.nodeName]) byName[c.nodeName] = [];
        byName[c.nodeName].push(c);
      });

      elems.forEach(c => {
        const childName = c.nodeName;
        if (grouped[childName]) return;
        const group = byName[childName] || [];
        if (group.length > 1) {
          const arrChildren = group.map((itemEl, idx) => {
            const itemIdx = idx + 1;
            const itemNode = this.buildXmlNode(itemEl, path + '/' + childName + '[' + itemIdx + ']', jpath + '/' + childName + '[' + itemIdx + ']');
            // Array children use numeric keys so rendering/record mode behaves like JSON arrays.
            itemNode.key = idx;
            return itemNode;
          });
          children.push({
            kind: 'array',
            key: childName,
            path: path + '/' + childName,
            jpath: jpath + '/' + childName,
            children: arrChildren,
            count: arrChildren.length,
          });
        } else {
          children.push(this.buildXmlNode(c, path + '/' + childName, jpath + '/' + childName));
        }
        grouped[childName] = true;
      });
      if (text) children.push({ kind: 'leaf', vType: 'text', key: '#text', path: path + '/#text', jpath: jpath + '/text()', disp: text, copyText: text, el });
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
    if (parsed.format === 'json' || parsed.format === 'table') return this.buildJson('root', parsed.value, '/root', '$');
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

  collectRawMatches(text, term) {
    const hits = [];
    const src = String(text || '');
    const q = String(term || '').toLowerCase();
    if (!src || !q) return hits;
    const low = src.toLowerCase();
    let from = 0;
    while (true) {
      const idx = low.indexOf(q, from);
      if (idx === -1) break;
      hits.push({ start: idx, end: idx + q.length });
      from = idx + q.length;
      if (hits.length >= 3000) break;
    }
    return hits;
  }

  renderRawSearch(content, term, hits, activeIdx, tok) {
    const src = content;
    if (!src || !term || !hits || !hits.length) return src;

    const highlightText = (text, state) => {
      const value = String(text || '');
      if (!value) { state.offset += value.length; return value; }

      const startOffset = state.offset;
      const endOffset = startOffset + value.length;
      let cursor = 0;
      let hitIndex = state.hitIndex || 0;
      const pieces = [];

      while (hitIndex < hits.length && hits[hitIndex].end <= startOffset) hitIndex++;

      for (let i = hitIndex; i < hits.length; i++) {
        const hit = hits[i];
        if (hit.start >= endOffset) break;
        const sliceStart = Math.max(hit.start, startOffset);
        const sliceEnd = Math.min(hit.end, endOffset);
        if (sliceStart > startOffset + cursor) pieces.push(value.slice(cursor, sliceStart - startOffset));
        const isActive = i === activeIdx;
        pieces.push(h('span', {
          key: 'rawm' + i + ':' + sliceStart,
          ref: isActive ? this.activeMatchRef : null,
          style: {
            background: isActive ? tok.match.active : tok.match.bg,
            borderRadius: '2px',
            boxShadow: isActive ? '0 0 0 1px ' + tok.accent : 'none',
            color: 'inherit',
          }
        }, value.slice(sliceStart - startOffset, sliceEnd - startOffset)));
        cursor = sliceEnd - startOffset;
        if (cursor >= value.length) break;
      }

      if (cursor < value.length) pieces.push(value.slice(cursor));
      state.offset = endOffset;
      state.hitIndex = hitIndex;
      return pieces.length === 1 ? pieces[0] : pieces;
    };

    const walk = (node, state) => {
      if (node == null || node === false) return node;
      if (typeof node === 'string' || typeof node === 'number') return highlightText(node, state);
      if (Array.isArray(node)) {
        return node.flatMap(child => walk(child, state)).filter(v => v != null && v !== false);
      }
      if (React.isValidElement(node)) {
        const children = node.props && node.props.children != null ? walk(node.props.children, state) : node.props.children;
        return React.cloneElement(node, Object.assign({}, node.props), children);
      }
      return node;
    };

    return walk(src, { offset: 0, hitIndex: 0 });
  }

  jsonLeafValue(n) {
    if (!n) return undefined;
    if (n.vType === 'null') return null;
    if (n.vType === 'boolean') return String(n.disp) === 'true';
    if (n.vType === 'number') return Number(n.disp);
    return n.disp != null ? n.disp : '';
  }

  jsonFilteredValue(n, keep, matchPaths, forceAll, isRoot) {
    if (!n) return undefined;
    if (n.kind === 'leaf') {
      if (!isRoot && !forceAll && !(keep && keep.has(n.path)) && !(matchPaths && matchPaths.has(n.path))) return undefined;
      return this.jsonLeafValue(n);
    }
    const matchedHere = !!(matchPaths && matchPaths.has(n.path));
    if (n.kind === 'array') {
      const out = [];
      n.children.forEach(child => {
        const val = this.jsonFilteredValue(child, keep, matchPaths, false, false);
        if (val !== undefined) out.push(val);
      });
      if (out.length) return out;
      return (isRoot || matchedHere || forceAll) ? [] : undefined;
    }
    const out = {};
    n.children.forEach(child => {
      if (child.kind === 'leaf' && child.vType === 'attr') return;
      const val = this.jsonFilteredValue(child, keep, matchPaths, false, false);
      if (val !== undefined) out[String(child.key)] = val;
    });
    if (Object.keys(out).length) return out;
    return (isRoot || matchedHere || forceAll) ? {} : undefined;
  }

  xmlFilteredPayload(n, keep, matchPaths, level, forceAll, isRoot) {
    const ind = this.indentStr();
    const pad = ind.repeat(level);
    const tagName = n && n.path ? String(n.path).split('/').pop().replace(/\[\d+\]$/, '') : (n && n.el && n.el.nodeName ? n.el.nodeName : String(n && n.key != null ? n.key : ''));
    if (!n) return '';
    if (n.kind === 'leaf') {
      if (n.vType === 'attr') return '';
      const text = n.disp == null ? '' : String(n.disp);
      if (!isRoot && !forceAll && !(keep && keep.has(n.path)) && !(matchPaths && matchPaths.has(n.path))) return '';
      if (n.vType === 'text') return text.trim() ? pad + this.esc(text.trim()) + '\n' : '';
      return text ? pad + '<' + tagName + '>' + this.esc(text) + '</' + tagName + '>\n' : pad + '<' + tagName + '/>\n';
    }
    const full = forceAll || (matchPaths && matchPaths.has(n.path));
    if (n.kind === 'array') {
      return (n.children || []).map(child => this.xmlFilteredPayload(child, keep, matchPaths, level, full, false)).filter(Boolean).join('');
    }
    const attrs = [];
    const visible = [];
    let hasElementChild = false;
    const textParts = [];
    (n.children || []).forEach(child => {
      if (child.kind === 'leaf' && child.vType === 'attr') {
        if (full || (keep && keep.has(child.path))) attrs.push(' ' + child.key.slice(1) + '="' + this.esc(child.disp == null ? '' : String(child.disp)) + '"');
        return;
      }
      if (child.kind === 'leaf' && child.vType === 'text') {
        if (!full && !(keep && keep.has(child.path)) && !(matchPaths && matchPaths.has(child.path))) return;
        const text = child.disp == null ? '' : String(child.disp).trim();
        if (!text) return;
        textParts.push(text);
        visible.push({ kind: 'text', rendered: pad + ind + this.esc(text) + '\n' });
        return;
      }
      const rendered = this.xmlFilteredPayload(child, keep, matchPaths, level + 1, full, false);
      if (rendered !== '') {
        hasElementChild = true;
        visible.push({ kind: 'node', rendered });
      }
    });
    const textOnly = !hasElementChild;
    const text = textParts.join('').trim();
    if (textOnly && text) return pad + '<' + tagName + attrs.join('') + '>' + this.esc(text) + '</' + tagName + '>\n';
    if (!visible.length) return (isRoot || full || forceAll) ? pad + '<' + tagName + attrs.join('') + '/>\n' : '';
    if (textOnly && !text) return (isRoot || full || forceAll) ? pad + '<' + tagName + attrs.join('') + '/>\n' : '';
    return pad + '<' + tagName + attrs.join('') + '>\n' + visible.map(v => v.rendered).join('') + pad + '</' + tagName + '>\n';
  }

  xmlFilteredCompact(n, keep, matchPaths, forceAll, isRoot) {
    if (!n) return '';
    if (n.kind === 'leaf') {
      if (n.vType === 'attr') return '';
      const text = n.disp == null ? '' : String(n.disp);
      if (!isRoot && !forceAll && !(keep && keep.has(n.path)) && !(matchPaths && matchPaths.has(n.path))) return '';
      if (n.vType === 'text') return this.esc(text.trim());
      const tagName = n.el && n.el.nodeName ? n.el.nodeName : String(n.key != null ? n.key : '');
      return text ? '<' + tagName + '>' + this.esc(text) + '</' + tagName + '>' : '<' + tagName + '/>';
    }

    const tagName = n.el && n.el.nodeName ? n.el.nodeName : String(n.path ? n.path.split('/').pop().replace(/\[\d+\]$/, '') : (n.key != null ? n.key : ''));
    const full = forceAll || (matchPaths && matchPaths.has(n.path));
    if (n.kind === 'array') {
      return (n.children || []).map(child => this.xmlFilteredCompact(child, keep, matchPaths, full, false)).filter(Boolean).join('');
    }

    const attrs = [];
    const body = [];
    const textBits = [];
    (n.children || []).forEach(child => {
      if (child.kind === 'leaf' && child.vType === 'attr') {
        if (full || (keep && keep.has(child.path))) attrs.push(' ' + child.key.slice(1) + '="' + this.esc(child.disp == null ? '' : String(child.disp)) + '"');
        return;
      }
      if (child.kind === 'leaf' && child.vType === 'text') {
        if (!full && !(keep && keep.has(child.path)) && !(matchPaths && matchPaths.has(child.path))) return;
        const text = child.disp == null ? '' : String(child.disp).trim();
        if (text) textBits.push(this.esc(text));
        return;
      }
      const rendered = this.xmlFilteredCompact(child, keep, matchPaths, full, false);
      if (rendered !== '') body.push(rendered);
    });

    const text = textBits.join('');
    if (!body.length && !text) return (isRoot || full || forceAll) ? '<' + tagName + attrs.join('') + '/>' : '';
    if (!body.length) return '<' + tagName + attrs.join('') + '>' + text + '</' + tagName + '>';
    return '<' + tagName + attrs.join('') + '>' + text + body.join('') + '</' + tagName + '>';
  }

  explorerPayloadText(parsed, node, term, matchPaths, keepPaths, forceFilter) {
    const hasFilter = !!forceFilter || !!(term || (matchPaths && matchPaths.size) || (keepPaths && keepPaths.size));
    if (!parsed || !parsed.ok || !node || !hasFilter) return parsed && parsed.empty ? '' : (this.state.input || '');
    const sourceStyle = this.state.input.indexOf('\n') >= 0 ? 'beautify' : 'minify';
    const keep = keepPaths || this.keepSet(node, term);
    if (parsed.format === 'json') {
      const filtered = this.jsonFilteredValue(node, keep, matchPaths, false, true);
      if (filtered === undefined) return '{}';
      try {
        return sourceStyle === 'minify' ? JSON.stringify(filtered) : JSON.stringify(filtered, null, this.indentStr());
      } catch (e) {
        return '{}';
      }
    }
    const compact = this.xmlFilteredCompact(node, keep, matchPaths, false, true);
    const withDecl = '<?xml version="1.0" encoding="UTF-8"?>\n' + compact;
    if (sourceStyle === 'minify') return withDecl.trim();
    const prettyParsed = this.parseXML(withDecl);
    return prettyParsed.ok ? this.prettyXml(prettyParsed.doc) : withDecl.trim();
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
      this.miniBtn('path', n, ctx), this.miniBtn('value', n, ctx), isContainer ? this.miniBtn('table', n, ctx) : null);

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
    const label = type === 'path' ? 'path' : (type === 'table' ? 'tbl' : 'value');
    const copiedKey = n.path + ':' + type;
    const isCopied = this.state.copied === copiedKey;
    const isTable = type === 'table';
    const isSelectedTableSource = isTable && this.state.tableSourcePath === n.path;
    return h('button', {
      onClick: (e) => { e.stopPropagation(); if (isTable) this.selectTableSource(n.path); else this.copy(type === 'path' ? n.jpath : this.nodeCopyText(n), copiedKey); },
      title: type === 'path' ? n.jpath : (isTable ? 'Table this node' : 'Copy value'),
      style: { font: '600 9.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: isTable ? (isSelectedTableSource ? tok.accent : tok.textDim) : (isCopied ? tok.sem.ok : tok.textDim), background: isTable ? (isSelectedTableSource ? tok.accentWeak : tok.panel2) : (isCopied ? tok.sem.okW : tok.panel2), border: '1px solid ' + tok.border, borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }
    }, isCopied ? '✓' : label);
  }

  applyInput(val, extra) {
    if (this.editorRef.current && this.editorRef.current.value !== val) this.editorRef.current.value = val;
    const next = Object.assign({ input: val, docInput: val }, extra || {});
    this.setState(next);
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

  // Keeps a highlighted <pre> overlay (and optional line-number gutter)
  // scrolled in lockstep with the real, transparent-text <textarea> sitting
  // on top of it. Takes explicit refs so the same overlay technique used by
  // the Format tab's source panel can be reused for other editable panes
  // (e.g. the Sanitize tab's input/output) without a second hardcoded copy.
  syncLayers(editorRef, highlightRef, gutterRef, sourceEl) {
    const ta = sourceEl || (editorRef && editorRef.current);
    if (!ta) return;
    const top = ta.scrollTop;
    const left = ta.scrollLeft;
    if (highlightRef && highlightRef.current) {
      if (Math.abs(highlightRef.current.scrollTop - top) > 1) highlightRef.current.scrollTop = top;
      if (Math.abs(highlightRef.current.scrollLeft - left) > 1) highlightRef.current.scrollLeft = left;
    }
    if (gutterRef && gutterRef.current && Math.abs(gutterRef.current.scrollTop - top) > 1) gutterRef.current.scrollTop = top;
  }

  syncEditorLayers(sourceEl) {
    this.syncLayers(this.editorRef, this.highlightRef, this.gutterRef, sourceEl);
  }

  // When scroll lock is on, mirrors scroll position from one Sanitize pane
  // onto the other. The same tolerant-diff guard syncLayers() uses (only
  // set when the difference is real) is what stops this from ping-ponging
  // forever: setting the other pane's scrollTop fires its own onscroll,
  // but by then the values already match so that call is a no-op.
  syncSanitizePanes(sourceEl) {
    if (!this.state.sanitizeScrollLock || !sourceEl) return;
    const other = sourceEl === this.sanitizeInputEditorRef.current ? this.sanitizeOutputEditorRef.current : this.sanitizeInputEditorRef.current;
    if (!other) return;
    if (Math.abs(other.scrollTop - sourceEl.scrollTop) > 1) other.scrollTop = sourceEl.scrollTop;
    if (Math.abs(other.scrollLeft - sourceEl.scrollLeft) > 1) other.scrollLeft = sourceEl.scrollLeft;
  }

  async copy(text, key) {
    const ok = await this.writeClipboard(text == null ? '' : String(text));
    if (!ok) return false;
    clearTimeout(this._copyTimer);
    this.setState({ copied: key });
    this._copyTimer = setTimeout(() => this.setState({ copied: null }), 1100);
    return true;
  }

  // ---------- formatting ----------
  indentStr() { return this.state.indent === 'tab' ? '\t' : (this.state.indent === '4' ? '    ' : '  '); }

  reformat(minify) {
    const p = this.parse(this.state.input);
    if (!p.ok) return;
    if (p.format === 'table') return; // no beautify/minify concept for tabular text; also reachable via the Cmd/Ctrl+Enter and Cmd/Ctrl+\ shortcuts, not just the (now-hidden) toolbar buttons
    if (p.format === 'json') {
      const out = minify ? JSON.stringify(p.value) : JSON.stringify(p.value, null, this.indentStr());
      this.applyInput(out, minify ? { softWrap: true } : null);
    } else {
      const out = minify ? this.minifyXml(this.state.input) : this.prettyXml(p.doc);
      this.applyInput(out, minify ? { softWrap: true } : null);
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

  minifyXml(text) {
    const parsed = this.parseXML(text);
    if (!parsed.ok) return text;

    const stripWs = (node, preserve) => {
      const keepWs = !!preserve || (node.nodeType === 1 && node.getAttribute && node.getAttribute('xml:space') === 'preserve');
      const children = Array.from(node.childNodes || []);
      children.forEach(child => {
        if (child.nodeType === 3) {
          if (!keepWs && (!child.textContent || !child.textContent.trim())) node.removeChild(child);
          return;
        }
        stripWs(child, keepWs);
      });
    };

    stripWs(parsed.doc, false);
    const out = new XMLSerializer().serializeToString(parsed.doc);
    const decl = text.match(/^\s*(<\?xml[\s\S]*?\?>)/i);
    return decl ? (decl[1] + out.replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '')) : out;
  }

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
    if (p.format === 'xml') { const o = this.xmlToJson(p.doc); this.applyInput(o); }
    else { const o = this.jsonToXml(p.value); this.applyInput(o); } // table format's value is already a plain array-of-objects, same as JSON
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

  jsonPathAppend(path, seg, isIndex) {
    if (isIndex) return path + '[' + seg + ']';
    return IDENT.test(seg) ? (path + '.' + seg) : (path + '[' + JSON.stringify(seg) + ']');
  }

  jsonPathRead(v, seg) {
    return v != null && typeof v === 'object' && seg in v ? v[seg] : undefined;
  }

  jsonPathSplit(s, delim) {
    const out = [];
    let cur = '', quote = null, depth = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (quote) {
        cur += ch;
        if (ch === '\\' && i + 1 < s.length) { cur += s[++i]; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === '\'') { quote = ch; cur += ch; continue; }
      if (ch === '(') { depth++; cur += ch; continue; }
      if (ch === ')') { depth--; cur += ch; continue; }
      if (depth === 0 && ch === delim) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (quote || depth !== 0) throw new Error('Invalid JSONPath');
    out.push(cur.trim());
    return out;
  }

  jsonPathUnquote(s) {
    const q = s && s[0];
    if ((q !== '"' && q !== '\'') || s[s.length - 1] !== q) throw new Error('Invalid JSONPath');
    const body = s.slice(1, -1).replace(/\\'/g, "'");
    return JSON.parse('"' + body.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
  }

  jsonPathParseInt(s) {
    if (!/^-?\d+$/.test(s)) throw new Error('Invalid JSONPath');
    return parseInt(s, 10);
  }

  jsonPathLiteral(s) {
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s === 'null') return null;
    if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
    if ((s[0] === '"' && s[s.length - 1] === '"') || (s[0] === '\'' && s[s.length - 1] === '\'')) return this.jsonPathUnquote(s);
    throw new Error('Invalid JSONPath');
  }

  jsonPathSplitLogical(expr, op) {
    const out = [];
    let cur = '';
    let depth = 0;
    let quote = null;
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (quote) {
        cur += ch;
        if (ch === '\\' && i + 1 < expr.length) { cur += expr[++i]; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === '\'') { quote = ch; cur += ch; continue; }
      if (ch === '(') { depth++; cur += ch; continue; }
      if (ch === ')') {
        depth--;
        if (depth < 0) throw new Error('Invalid JSONPath');
        cur += ch;
        continue;
      }
      if (depth === 0 && expr.slice(i, i + op.length) === op) {
        if (!cur.trim()) throw new Error('Invalid JSONPath');
        out.push(cur.trim());
        cur = '';
        i += op.length - 1;
        continue;
      }
      cur += ch;
    }
    if (quote || depth !== 0) throw new Error('Invalid JSONPath');
    if (!cur.trim()) throw new Error('Invalid JSONPath');
    out.push(cur.trim());
    return out;
  }

  jsonPathStripOuterParens(expr) {
    let s = (expr || '').trim();
    while (s.startsWith('(') && s.endsWith(')')) {
      let depth = 0;
      let quote = null;
      let wraps = true;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (quote) {
          if (ch === '\\' && i + 1 < s.length) { i++; continue; }
          if (ch === quote) quote = null;
          continue;
        }
        if (ch === '"' || ch === '\'') { quote = ch; continue; }
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth < 0) throw new Error('Invalid JSONPath');
          if (depth === 0 && i !== s.length - 1) { wraps = false; break; }
        }
      }
      if (quote || depth !== 0) throw new Error('Invalid JSONPath');
      if (!wraps) break;
      s = s.slice(1, -1).trim();
    }
    return s;
  }

  jsonPathParseFilterExpr(expr) {
    const src = this.jsonPathStripOuterParens(expr);
    if (!src) throw new Error('Invalid JSONPath');
    const orParts = this.jsonPathSplitLogical(src, '||');
    if (orParts.length > 1) return { t: 'or', items: orParts.map(part => this.jsonPathParseFilterExpr(part)) };
    const andParts = this.jsonPathSplitLogical(src, '&&');
    if (andParts.length > 1) return { t: 'and', items: andParts.map(part => this.jsonPathParseFilterExpr(part)) };
    const m = src.match(/^@((?:\.[A-Za-z_$][\w$]*|\[(?:-?\d+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')\])*)\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
    if (!m) throw new Error('Invalid JSONPath');
    return {
      t: 'cmp',
      rel: this.parseJsonPathTokens('@' + m[1]),
      op: m[2],
      rhs: this.jsonPathLiteral(m[3].trim())
    };
  }

  jsonPathExtractFilterExpr(raw) {
    const src = (raw || '').trim();
    if (!src.startsWith('?(')) throw new Error('Invalid JSONPath');
    let depth = 1;
    let quote = null;
    let i = 2;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (quote) {
        if (ch === '\\' && i + 1 < src.length) { i++; continue; }
        if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === '\'') { quote = ch; continue; }
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) break;
        if (depth < 0) throw new Error('Invalid JSONPath');
      }
    }
    if (quote || depth !== 0) throw new Error('Invalid JSONPath');
    const firstExpr = src.slice(2, i).trim();
    if (!firstExpr) throw new Error('Invalid JSONPath');
    const tail = src.slice(i + 1).trim();
    if (!tail) return firstExpr;
    if (!/^(&&|\|\|)\b/.test(tail) && !/^(&&|\|\|)\s*/.test(tail)) throw new Error('Invalid JSONPath');
    return (firstExpr + ' ' + tail).trim();
  }

  jsonPathEvalFilterExpr(ast, entry) {
    if (ast.t === 'or') return ast.items.some(item => this.jsonPathEvalFilterExpr(item, entry));
    if (ast.t === 'and') return ast.items.every(item => this.jsonPathEvalFilterExpr(item, entry));
    const resolved = this.evalJsonPathTokens([{ path: '@', val: entry.val }], ast.rel).map(x => x.val);
    return resolved.some(lhs => {
      if (ast.op === '==') return lhs === ast.rhs;
      if (ast.op === '!=') return lhs !== ast.rhs;
      if (ast.op === '<') return lhs < ast.rhs;
      if (ast.op === '<=') return lhs <= ast.rhs;
      if (ast.op === '>') return lhs > ast.rhs;
      return lhs >= ast.rhs;
    });
  }

  jsonPathCompileFilter(expr) {
    const ast = this.jsonPathParseFilterExpr(expr);
    return (entry) => this.jsonPathEvalFilterExpr(ast, entry);
  }

  parseJsonPathTokens(path) {
    const p = (path || '').trim();
    if (!p) return [];
    let i = 0;
    const toks = [];
    if (p[i] === '$' || p[i] === '@') i++;
    const parseIdent = () => {
      const m = p.slice(i).match(/^[A-Za-z_$][\w$]*/);
      if (!m) throw new Error('Invalid JSONPath');
      i += m[0].length;
      return m[0];
    };
    const readBracket = () => {
      let j = i + 1, quote = null, depth = 0;
      while (j < p.length) {
        const ch = p[j];
        if (quote) {
          if (ch === '\\') { j += 2; continue; }
          if (ch === quote) quote = null;
          j++;
          continue;
        }
        if (ch === '"' || ch === '\'') { quote = ch; j++; continue; }
        if (ch === '(') { depth++; j++; continue; }
        if (ch === ')') { depth--; j++; continue; }
        if (ch === ']' && depth === 0) break;
        j++;
      }
      if (j >= p.length) throw new Error('Invalid JSONPath');
      const raw = p.slice(i + 1, j).trim();
      i = j + 1;
      return raw;
    };
    const parseBracket = (recursive) => {
      const raw = readBracket();
      if (!raw) throw new Error('Invalid JSONPath');
      if (raw === '*') return { t: recursive ? 'rWild' : 'wild' };
      if (raw.startsWith('?(')) {
        const filterExpr = this.jsonPathExtractFilterExpr(raw);
        return { t: 'filter', fn: this.jsonPathCompileFilter(filterExpr) };
      }
      const unionParts = this.jsonPathSplit(raw, ',');
      if (unionParts.length > 1) {
        return {
          t: 'union',
          items: unionParts.map(part => {
            if ((part[0] === '"' && part[part.length - 1] === '"') || (part[0] === '\'' && part[part.length - 1] === '\'')) return { t: 'key', v: this.jsonPathUnquote(part) };
            return { t: 'index', v: this.jsonPathParseInt(part) };
          })
        };
      }
      if (raw.indexOf(':') >= 0) {
        const parts = this.jsonPathSplit(raw, ':');
        if (parts.length < 2 || parts.length > 3) throw new Error('Invalid JSONPath');
        return {
          t: 'slice',
          start: parts[0] === '' ? null : this.jsonPathParseInt(parts[0]),
          end: parts[1] === '' ? null : this.jsonPathParseInt(parts[1]),
          step: !parts[2] ? null : this.jsonPathParseInt(parts[2]),
        };
      }
      if ((raw[0] === '"' && raw[raw.length - 1] === '"') || (raw[0] === '\'' && raw[raw.length - 1] === '\'')) {
        return { t: recursive ? 'rKey' : 'key', v: this.jsonPathUnquote(raw) };
      }
      if (/^-?\d+$/.test(raw)) return { t: 'index', v: this.jsonPathParseInt(raw) };
      throw new Error('Invalid JSONPath');
    };

    while (i < p.length) {
      if (p.startsWith('..', i)) {
        i += 2;
        if (i >= p.length) throw new Error('Invalid JSONPath');
        if (p[i] === '*') { toks.push({ t: 'rWild' }); i++; continue; }
        if (p[i] === '[') { toks.push(parseBracket(true)); continue; }
        toks.push({ t: 'rKey', v: parseIdent() });
        continue;
      }
      if (p[i] === '.') {
        i++;
        if (i >= p.length) throw new Error('Invalid JSONPath');
        if (p[i] === '*') { toks.push({ t: 'wild' }); i++; continue; }
        toks.push({ t: 'key', v: parseIdent() });
        continue;
      }
      if (p[i] === '[') { toks.push(parseBracket(false)); continue; }
      if (i === 0 || (i === 1 && (p[0] === '$' || p[0] === '@'))) { toks.push({ t: 'key', v: parseIdent() }); continue; }
      throw new Error('Invalid JSONPath');
    }
    return toks;
  }

  jsonPathDescendants(entry, out, includeSelf) {
    if (includeSelf) out.push(entry);
    const v = entry.val;
    if (Array.isArray(v)) {
      v.forEach((item, idx) => {
        this.jsonPathDescendants({ path: this.jsonPathAppend(entry.path, idx, true), val: item }, out, true);
      });
      return;
    }
    if (v && typeof v === 'object') {
      Object.keys(v).forEach(key => {
        this.jsonPathDescendants({ path: this.jsonPathAppend(entry.path, key, false), val: v[key] }, out, true);
      });
    }
  }

  evalJsonPathTokens(cur, toks) {
    for (const tk of toks) {
      const next = [];
      if (tk.t === 'rWild' || tk.t === 'rKey') {
        cur.forEach(entry => {
          const desc = [];
          this.jsonPathDescendants(entry, desc, false);
          if (tk.t === 'rWild') next.push.apply(next, desc);
          else desc.forEach(d => {
            const lastDot = d.path.lastIndexOf('.');
            const lastBracket = d.path.lastIndexOf('[');
            const seg = d.path.slice(Math.max(lastDot, lastBracket) + 1).replace(/^['"]|['"]$/g, '').replace(/\]$/, '');
            if (seg === tk.v || d.path.endsWith('.' + tk.v) || d.path.endsWith('["' + tk.v + '"]')) next.push(d);
          });
        });
        cur = next;
        continue;
      }
      cur.forEach(c => {
        const v = c.val;
        if (tk.t === 'key') {
          const hit = this.jsonPathRead(v, tk.v);
          if (hit !== undefined) next.push({ path: this.jsonPathAppend(c.path, tk.v, false), val: hit });
        } else if (tk.t === 'wild') {
          if (Array.isArray(v)) v.forEach((item, idx) => next.push({ path: this.jsonPathAppend(c.path, idx, true), val: item }));
          else if (v && typeof v === 'object') Object.keys(v).forEach(key => next.push({ path: this.jsonPathAppend(c.path, key, false), val: v[key] }));
        } else if (tk.t === 'index') {
          if (Array.isArray(v)) {
            const idx = tk.v < 0 ? v.length + tk.v : tk.v;
            if (idx >= 0 && idx < v.length) next.push({ path: this.jsonPathAppend(c.path, idx, true), val: v[idx] });
          }
        } else if (tk.t === 'union') {
          tk.items.forEach(item => {
            if (item.t === 'key') {
              const hit = this.jsonPathRead(v, item.v);
              if (hit !== undefined) next.push({ path: this.jsonPathAppend(c.path, item.v, false), val: hit });
            } else if (Array.isArray(v)) {
              const idx = item.v < 0 ? v.length + item.v : item.v;
              if (idx >= 0 && idx < v.length) next.push({ path: this.jsonPathAppend(c.path, idx, true), val: v[idx] });
            }
          });
        } else if (tk.t === 'slice') {
          if (!Array.isArray(v)) return;
          const step = tk.step == null ? 1 : tk.step;
          if (step === 0) return;
          const len = v.length;
          let start = tk.start == null ? (step > 0 ? 0 : len - 1) : (tk.start < 0 ? len + tk.start : tk.start);
          let end = tk.end == null ? (step > 0 ? len : -1) : (tk.end < 0 ? len + tk.end : tk.end);
          if (step > 0) {
            for (let idx = Math.max(0, start); idx < Math.min(len, end); idx += step) next.push({ path: this.jsonPathAppend(c.path, idx, true), val: v[idx] });
          } else {
            for (let idx = Math.min(len - 1, start); idx > Math.max(-1, end); idx += step) next.push({ path: this.jsonPathAppend(c.path, idx, true), val: v[idx] });
          }
        } else if (tk.t === 'filter') {
          if (Array.isArray(v)) v.forEach((item, idx) => { const entry = { path: this.jsonPathAppend(c.path, idx, true), val: item }; if (tk.fn(entry)) next.push(entry); });
          else if (v && typeof v === 'object') Object.keys(v).forEach(key => { const entry = { path: this.jsonPathAppend(c.path, key, false), val: v[key] }; if (tk.fn(entry)) next.push(entry); });
        }
      });
      cur = next;
    }
    return cur;
  }

  // ---------- JSONPath ----------
  runJsonPath(value, path) {
    const p = path.trim();
    if (!p) return { ok: true, results: [] };
    try {
      const toks = this.parseJsonPathTokens(p);
      return { ok: true, results: this.evalJsonPathTokens([{ path: '$', val: value }], toks) };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  xpathNodeValue(node) {
    if (!node) return '';
    if (node.nodeType === 2) return node.value != null ? node.value : (node.textContent || '');
    if (node.nodeType === 1) {
      if (node.outerHTML != null) return node.outerHTML;
      if (typeof XMLSerializer !== 'undefined') {
        try { return new XMLSerializer().serializeToString(node); } catch (e) {}
      }
    }
    return node.textContent != null ? node.textContent : '';
  }

  xmlNodeModelPath(node) {
    if (!node) return '';
    if (node.nodeType === 2) {
      const base = this.xmlNodeModelPath(node.ownerElement);
      return base ? (base + '/@' + node.nodeName) : '';
    }
    if (node.nodeType === 3) {
      const base = this.xmlNodeModelPath(node.parentElement);
      return base ? (base + '/#text') : '';
    }
    if (node.nodeType !== 1) return '';
    const segs = [];
    let cur = node;
    while (cur && cur.nodeType === 1) {
      const parent = cur.parentElement;
      if (parent) {
        const sibs = Array.from(parent.children || []).filter((c) => c.nodeName === cur.nodeName);
        if (sibs.length > 1) {
          segs.unshift(cur.nodeName + '[' + (sibs.indexOf(cur) + 1) + ']');
        } else {
          segs.unshift(cur.nodeName);
        }
      } else {
        segs.unshift(cur.nodeName);
      }
      cur = parent;
    }
    return '/' + segs.join('/');
  }

  runXPath(doc, path) {
    const p = path.trim();
    if (!p) return { ok: true, results: [] };
    try {
      const results = [];
      const xr = doc.evaluate(p, doc, null, XPathResult.ANY_TYPE, null);
      if (xr.resultType === XPathResult.STRING_TYPE) results.push({ path: p, val: xr.stringValue });
      else if (xr.resultType === XPathResult.NUMBER_TYPE) results.push({ path: p, val: xr.numberValue });
      else if (xr.resultType === XPathResult.BOOLEAN_TYPE) results.push({ path: p, val: xr.booleanValue });
      else if (xr.resultType === XPathResult.ANY_UNORDERED_NODE_TYPE || xr.resultType === XPathResult.FIRST_ORDERED_NODE_TYPE) {
        if (xr.singleNodeValue) results.push({ path: xr.singleNodeValue.nodeName, val: this.xpathNodeValue(xr.singleNodeValue), node: xr.singleNodeValue, modelPath: this.xmlNodeModelPath(xr.singleNodeValue) });
      } else if (xr.resultType === XPathResult.UNORDERED_NODE_ITERATOR_TYPE || xr.resultType === XPathResult.ORDERED_NODE_ITERATOR_TYPE) {
        let node;
        while ((node = xr.iterateNext())) results.push({ path: node.nodeName, val: this.xpathNodeValue(node), node, modelPath: this.xmlNodeModelPath(node) });
      } else {
        for (let i = 0; i < xr.snapshotLength; i++) {
          const node = xr.snapshotItem(i);
          results.push({ path: node.nodeName, val: this.xpathNodeValue(node), node, modelPath: this.xmlNodeModelPath(node) });
        }
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
    if (fmt === 'table') return text; // CSV/TSV/Markdown-table text isn't JSON/XML-shaped; leave unstyled rather than mis-highlight it
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

  // Spot's "Ignore volatile fields" toggle: blanks out the kinds of values
  // that are expected to differ between two troubleshooting runs
  // (timestamps, hex32 sys_ids, GUIDs, millisecond durations) so the diff
  // surfaces the actual behavioral change instead of every timestamp.
  // Timestamp matching is shared with Bury's shape classifier via
  // window.PAW_SANITIZE.denoiseTimestamps (js/sanitize.js) so "what does a
  // timestamp look like" isn't maintained twice; GUID/hex32/duration stay
  // local since those placeholders are Spot-specific.
  denoiseForDiff(text) {
    const withTimestamps = window.PAW_SANITIZE.denoiseTimestamps(String(text));
    return withTimestamps
      .replace(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g, '<GUID>')
      .replace(/\b[0-9a-fA-F]{32}\b/g, '<ID>')
      .replace(/\b\d+\s?ms\b/g, '<DURATION>');
  }

  // Spot's "Align rows by key" toggle: when both sides are tabular, builds
  // diff rows keyed on a guessed id column (sys_id, correlation_id, ...)
  // instead of relying on lineDiff's line-order LCS — so two exports that
  // are paged or sorted differently still diff sensibly. textFn stringifies
  // (and, per the noise toggle, denoises) a record for both the equality
  // check and display, so a row that only differs in a suppressed field is
  // correctly shown as unchanged.
  //
  // Groups by key rather than assuming one row per key: a per-row id like
  // sys_id is unique so each group has one row per side, but a key column
  // can legitimately repeat (a correlation_id/transaction_id groups many
  // log lines from the same transaction on purpose) — a plain Map would
  // silently drop all but the last row per duplicate key. Same-key rows
  // are compared position-wise within their group instead.
  alignedTableDiffRows(recordsA, recordsB, keyCol, textFn) {
    const groupByKey = (records) => {
      const map = new Map();
      records.forEach(r => {
        const k = String(r[keyCol]);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(r);
      });
      return map;
    };
    const mapA = groupByKey(recordsA), mapB = groupByKey(recordsB);
    const order = [];
    const seen = new Set();
    recordsA.concat(recordsB).forEach(r => { const k = String(r[keyCol]); if (!seen.has(k)) { seen.add(k); order.push(k); } });
    const rows = [];
    let ln = 0, rn = 0;
    order.forEach(k => {
      const groupA = mapA.get(k) || [], groupB = mapB.get(k) || [];
      for (let i = 0; i < Math.max(groupA.length, groupB.length); i++) {
        const ra = groupA[i], rb = groupB[i];
        const la = ra ? textFn(ra) : null;
        const lb = rb ? textFn(rb) : null;
        if (la === lb) { ln++; rn++; rows.push({ t: 'eq', l: la, r: lb, ln, rn }); continue; }
        if (la != null) { ln++; rows.push({ t: 'del', l: la, r: null, ln, rn: null }); }
        if (lb != null) { rn++; rows.push({ t: 'add', l: null, r: lb, ln: null, rn }); }
      }
    });
    return rows;
  }

  renderDiff(tok) {
    const S = this.state;
    const denoise = t => S.diffSuppressNoise ? this.denoiseForDiff(t) : t;
    const pa = this.parse(S.diffA), pb = this.parse(S.diffB);
    const bothTable = pa.ok && pb.ok && pa.format === 'table' && pb.format === 'table';
    const alignKeyCol = (S.diffAlignByKey && bothTable)
      ? (window.PAW_TABLE.guessKeyColumn(pa.tableMeta.headers) || window.PAW_TABLE.guessKeyColumn(pb.tableMeta.headers))
      : null;
    let rows;
    if (alignKeyCol) {
      const textFn = rec => denoise(JSON.stringify(rec));
      rows = this.alignedTableDiffRows(pa.value, pb.value, alignKeyCol, textFn);
    } else {
      const norm = t => { const p = this.parse(t); if (p.ok && p.format === 'json') return JSON.stringify(p.value, null, 2); if (p.ok && p.format === 'xml') return this.prettyXml(p.doc); if (p.ok && p.format === 'table') return window.PAW_TABLE.serialize(p.value, p.tableMeta); return t; };
      const a = denoise(norm(S.diffA)), b = denoise(norm(S.diffB));
      rows = this.lineDiff(a, b);
    }
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
    return { el: h('div', { style: { font: '400 12.5px/19px ' + tok.fontMono, minWidth: 0 } }, head, body), add, del, rows, bothTable };
  }

  // A thin ruler alongside the diff result showing at a glance where the
  // changes are, without scrolling — one tick per changed row, positioned
  // by its fraction of the total row count. For very large diffs, thin the
  // ticks by sampling rather than rendering one per changed row.
  renderDiffMinimap(rows, tok) {
    if (!rows || !rows.length) return null;
    const total = rows.length;
    let changed = [];
    rows.forEach((r, i) => { if (r.t !== 'eq') changed.push({ i, t: r.t }); });
    if (!changed.length) return null;
    const MAX_TICKS = 500;
    if (changed.length > MAX_TICKS) {
      const step = Math.ceil(changed.length / MAX_TICKS);
      changed = changed.filter((_, k) => k % step === 0);
    }
    const jumpTo = (rowIndex) => {
      const box = this.diffResultRef.current;
      if (!box) return;
      box.scrollTop = (rowIndex / total) * box.scrollHeight;
    };
    const ticks = changed.map((c) => h('div', {
      key: c.i,
      title: (c.t === 'add' ? 'Added' : 'Removed') + ' — line ' + (c.i + 1),
      onClick: () => jumpTo(c.i),
      style: { position: 'absolute', left: 0, right: 0, top: (c.i / total * 100) + '%', height: '2px', background: c.t === 'add' ? tok.sem.ok : tok.sem.err, cursor: 'pointer' },
    }));
    return h('div', { title: 'Change overview — click to jump', style: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '10px', background: tok.panel2, borderLeft: '1px solid ' + tok.border } }, ticks);
  }

  // ---------- payload library ----------
  // Named, multi-document persistence shared by Dig/Spot A/Spot B/Bury (see
  // js/library.js for the record CRUD/storage this wraps). Each of the four
  // slots holds a *link* — which saved record, if any, is currently open —
  // plus a dirty flag (edited since the last save). Replaces the old,
  // Dig-only `sourceName` scalar.

  getSlotContent(slotKey) {
    const S = this.state;
    if (slotKey === 'dig') return S.input;
    if (slotKey === 'spotA') return S.diffA;
    if (slotKey === 'spotB') return S.diffB;
    if (slotKey === 'bury') return S.sanitizeInput;
    return '';
  }

  // Routes to the right per-slot setter, then — only when `link` is passed —
  // replaces libraryLinks[slotKey] with it (e.g. after a save or a Library
  // "open into slot"). Omit `link` for a plain content update.
  setSlotContent(slotKey, text, link) {
    if (slotKey === 'dig') this.applyInput(text, { collapsed: new Set(), search: '', query: '', matchIndex: 0 });
    else if (slotKey === 'spotA') this.setState({ diffA: text });
    else if (slotKey === 'spotB') this.setState({ diffB: text });
    else if (slotKey === 'bury') this.setSanitizeInput(text);
    if (link) this.setLibraryLink(slotKey, link);
  }

  setLibraryLink(slotKey, link) {
    this.setState((s) => ({ libraryLinks: Object.assign({}, s.libraryLinks, { [slotKey]: Object.assign({ id: null, dirty: false }, link) }) }));
  }

  // Marks a linked slot dirty on edit. No-ops (no setState at all) once
  // already dirty, or when the slot isn't linked to anything — nothing to
  // mark stale — so this is cheap enough to call on every keystroke.
  markSlotDirty(slotKey) {
    const link = this.state.libraryLinks[slotKey];
    if (link.id && !link.dirty) this.setLibraryLink(slotKey, { id: link.id, dirty: true });
  }

  // Spot A/B's plain keystroke handler: update the textarea, then mark that
  // slot dirty (or drop its link entirely once blanked, same as Dig/Bury).
  updateDiffSlot(slotKey, value) {
    if (slotKey === 'spotA') this.setState({ diffA: value });
    else if (slotKey === 'spotB') this.setState({ diffB: value });
    if (value.trim()) this.markSlotDirty(slotKey); else this.unlinkSlot(slotKey);
  }

  // Drops a slot's link without touching its on-screen content — used when
  // the user clears/samples a slot, or deletes the record it pointed at.
  unlinkSlot(slotKey) {
    this.setLibraryLink(slotKey, { id: null, dirty: false });
  }

  libraryErrorMessage(res) {
    if (res.error === 'too-large') {
      return 'This payload is too large to save to the Library (limit ' + (res.limitBytes / 1000000).toFixed(1) + 'MB).';
    }
    if (res.error === 'quota') return 'Library storage is full. Delete some saved payloads or shrink this one, then try again.';
    return 'Could not save to the Library.';
  }

  // Overwrites the slot's linked record with its current content. A slot
  // with no link yet has nothing to overwrite, so this falls through to
  // Save As instead.
  saveLibrarySlot(slotKey) {
    const link = this.state.libraryLinks[slotKey];
    if (!link.id) { this.openLibrarySaveAsPrompt(slotKey); return; }
    const content = this.getSlotContent(slotKey);
    const res = window.PAW_LIBRARY.update(link.id, { content, format: this.detect(content) });
    if (!res.ok) { this.setState({ libraryError: this.libraryErrorMessage(res) }); return; }
    this.setLibraryLink(slotKey, { id: link.id, dirty: false });
  }

  openLibrarySaveAsPrompt(slotKey) {
    // The name prompt renders inside the Library browser modal, so open it
    // too (context stays whatever it already was, if it was already open).
    this.setState({ showLibrary: true, librarySaveAsPromptOpen: true, librarySaveAsSlot: slotKey, librarySaveAsName: '', libraryError: null, libraryMenuOpen: null });
  }

  cancelLibrarySaveAs() {
    this.setState({ librarySaveAsPromptOpen: false, librarySaveAsSlot: null, librarySaveAsName: '' });
  }

  confirmLibrarySaveAs() {
    const slotKey = this.state.librarySaveAsSlot;
    if (!slotKey) return;
    const content = this.getSlotContent(slotKey);
    const name = this.state.librarySaveAsName.trim().slice(0, LIBRARY_NAME_MAX_LEN) || ('Untitled (' + HANDOFF_TARGETS[slotKey].label + ')');
    const res = window.PAW_LIBRARY.create({ name, content, format: this.detect(content), originMode: slotKey });
    if (!res.ok) { this.setState({ libraryError: this.libraryErrorMessage(res) }); return; }
    this.setLibraryLink(slotKey, { id: res.record.id, dirty: false });
    // Save As is invoked to get back to work, not to browse — close the
    // library modal it opened in, unlike Rename (often done mid-browse).
    this.setState({ librarySaveAsPromptOpen: false, librarySaveAsSlot: null, librarySaveAsName: '', showLibrary: false, libraryOpenContext: null });
  }

  openLibraryRenamePrompt(id, currentName) {
    // Same as Save As above — the rename prompt lives inside the Library
    // browser modal.
    this.setState({ showLibrary: true, libraryRenamePromptOpen: true, libraryRenameId: id, libraryRenameName: currentName || '', libraryMenuOpen: null });
  }

  cancelLibraryRename() {
    this.setState({ libraryRenamePromptOpen: false, libraryRenameId: null, libraryRenameName: '' });
  }

  confirmLibraryRename() {
    const id = this.state.libraryRenameId;
    const name = this.state.libraryRenameName.trim().slice(0, LIBRARY_NAME_MAX_LEN);
    if (!id || !name) return;
    const res = window.PAW_LIBRARY.update(id, { name });
    if (!res.ok) { this.setState({ libraryError: this.libraryErrorMessage(res) }); return; }
    this.setState({ libraryRenamePromptOpen: false, libraryRenameId: null, libraryRenameName: '' });
  }

  duplicateLibraryRecord(id, slotKey) {
    const record = window.PAW_LIBRARY.get(id);
    if (!record) return;
    const res = window.PAW_LIBRARY.duplicate(id, record.name + ' copy');
    if (!res.ok) { this.setState({ libraryError: this.libraryErrorMessage(res) }); return; }
    if (slotKey) this.openLibraryRecordIntoSlot(res.record.id, slotKey);
    else this.setState({ libraryMenuOpen: null });
  }

  // Deleting a saved record never touches whatever's currently on screen —
  // only the link is dropped for any slot that pointed at it.
  deleteLibraryRecord(id) {
    const res = window.PAW_LIBRARY.remove(id);
    if (!res.ok) { this.setState({ libraryError: this.libraryErrorMessage(res) }); return; }
    LIBRARY_SLOTS.forEach((slot) => { if (this.state.libraryLinks[slot].id === id) this.unlinkSlot(slot); });
  }

  openLibraryRecordIntoSlot(id, slotKey) {
    const record = window.PAW_LIBRARY.get(id);
    if (!record) return;
    this.setSlotContent(slotKey, record.content, { id: record.id, dirty: false });
    this.setState({ showLibrary: false, libraryOpenContext: null, libraryMenuOpen: null, mode: HANDOFF_TARGETS[slotKey].mode });
  }

  openLibraryBrowser(context) {
    this.setState({ showLibrary: true, libraryOpenContext: context || null, libraryFilter: '', libraryMenuOpen: null });
  }

  closeLibraryBrowser() {
    this.setState({ showLibrary: false, libraryOpenContext: null });
  }

  // ---------- handlers ----------
  loadFile(file) {
    return this.loadFileIntoSlot(file, 'dig');
  }

  loadFileIntoSlot(file, slotKey) {
    const r = new FileReader();
    r.onload = () => {
      const content = String(r.result);
      const name = String(file && file.name ? file.name : '').trim().slice(0, LIBRARY_NAME_MAX_LEN);
      if (slotKey === 'dig') this.applyInput(content, { collapsed: new Set(), search: '', query: '', matchIndex: 0 });
      else this.setSlotContent(slotKey, content);
      const res = window.PAW_LIBRARY.create({ name, content, format: this.detect(content), originMode: slotKey });
      if (res.ok) this.setLibraryLink(slotKey, { id: res.record.id, dirty: false });
      else this.setState({ libraryError: this.libraryErrorMessage(res) });
    };
    r.readAsText(file);
  }

  // ---------- sanitize ----------
  // See docs/features/paw-sanitize-design.md. The rule engine/detector live in
  // js/sanitize.js (window.PAW_SANITIZE) — this section wires that engine to
  // PAW's own parser (parseJSON/parseXML/rootNode, already defined above) so
  // the structural walk is reused rather than duplicated.

  getSanitizeRuleset() {
    return window.PAW_SANITIZE.getMergedRuleset();
  }

  getSanitizeProfile() {
    const ruleset = this.getSanitizeRuleset();
    return ruleset.profiles.find(p => p.id === this.state.sanitizeProfileId) || ruleset.profiles[0] || { id: 'none', name: 'None', keyRules: [], patternRules: [] };
  }

  getSanitizeMapping() {
    if (!this._sanitizeMapping) this._sanitizeMapping = window.PAW_SANITIZE.loadMapping();
    return this._sanitizeMapping;
  }

  // Memoized on (input, effective ruleset) so match ids stay stable across
  // re-renders — the review list's toggle/edit overrides are keyed by id.
  getSanitizeRun() {
    const S = this.state;
    const baseProfile = this.getSanitizeProfile();
    const profile = S.sanitizeManualRules.length
      ? Object.assign({}, baseProfile, { patternRules: (baseProfile.patternRules || []).concat(S.sanitizeManualRules) })
      : baseProfile;
    const rulesetKey = JSON.stringify(profile);
    const hasHeaderRow = S.tableHasHeaderRow !== false; // parseTable() (used for table-format sanitize input) reads this global toggle
    if (this._sanitizeRun && this._sanitizeRun._input === S.sanitizeInput && this._sanitizeRun._rulesetKey === rulesetKey && this._sanitizeRun._hasHeaderRow === hasHeaderRow) {
      return this._sanitizeRun;
    }
    const mapping = this.getSanitizeMapping();
    const parseFns = { parseJSON: this.parseJSON.bind(this), parseXML: this.parseXML.bind(this), parseTable: this.parseTable.bind(this), rootNode: this.rootNode.bind(this) };
    const run = window.PAW_SANITIZE.analyze(S.sanitizeInput, profile, mapping, parseFns);
    window.PAW_SANITIZE.saveMapping(mapping);
    run._input = S.sanitizeInput;
    run._rulesetKey = rulesetKey;
    run._hasHeaderRow = hasHeaderRow;
    this._sanitizeRun = run;
    return run;
  }

  getSanitizeMatches() {
    const run = this.getSanitizeRun();
    const overrides = this.state.sanitizeOverrides || {};
    return run.matches.map(m => overrides[m.id] ? Object.assign({}, m, overrides[m.id]) : m);
  }

  getSanitizeOutput() {
    const run = this.getSanitizeRun();
    if (run.format === 'empty') return '';
    return window.PAW_SANITIZE.renderOutput(this.state.sanitizeInput, run, this.getSanitizeMatches());
  }

  setSanitizeInput(text) {
    this.setState({ sanitizeInput: text, sanitizeOverrides: {}, sanitizeManualRules: [], sanitizeSelection: null, sanitizeAutoDetectNotice: null });
  }

  // ---------- cross-mode hand-off (Round 4) ----------

  handoffHasContent(key) {
    const S = this.state;
    if (key === 'dig') return !!S.input.trim();
    if (key === 'spotA') return !!S.diffA.trim();
    if (key === 'spotB') return !!S.diffB.trim();
    if (key === 'bury') return !!S.sanitizeInput.trim();
    return false;
  }

  // `originSlot`, when given, is the library-slot the content actually came
  // from (as opposed to `key`'s popover identity — see renderSendToMenu).
  // The destination only inherits the source's library link when that
  // source is itself linked and clean (an exact, saved copy) — otherwise
  // the destination just gets the content, unlinked, which is always safe.
  performHandoff(key, text, originSlot) {
    const target = HANDOFF_TARGETS[key];
    if (!target) return;
    this.setSlotContent(key, text);
    const originLink = originSlot && this.state.libraryLinks[originSlot];
    const carryLink = originLink && originLink.id && !originLink.dirty ? { id: originLink.id, dirty: false } : { id: null, dirty: false };
    this.setLibraryLink(key, carryLink);
    this.setState({ mode: target.mode, sendMenuOpen: null });
  }

  // If the destination already has content, ask before overwriting it
  // (see the confirm-replace modal in index.html) — and additionally offer
  // "Save first" when that existing content is itself unsaved (dirty);
  // otherwise just apply.
  requestHandoff(key, text, originSlot) {
    if (this.handoffHasContent(key)) {
      const destLink = this.state.libraryLinks[key];
      this.setState({ handoffConfirm: { key, text, originSlot, label: HANDOFF_TARGETS[key].label, destDirty: !!(destLink && destLink.dirty) }, sendMenuOpen: null });
    } else {
      this.performHandoff(key, text, originSlot);
    }
  }

  confirmHandoff() {
    const pending = this.state.handoffConfirm;
    if (!pending) return;
    this.performHandoff(pending.key, pending.text, pending.originSlot);
    this.setState({ handoffConfirm: null });
  }

  // Saves the destination slot's current (about-to-be-replaced) content to
  // its linked record first, then proceeds with the hand-off — so unsaved
  // work sitting in the destination isn't lost, only overwritten on screen.
  confirmHandoffSaveFirst() {
    const pending = this.state.handoffConfirm;
    if (!pending) return;
    this.saveLibrarySlot(pending.key);
    this.performHandoff(pending.key, pending.text, pending.originSlot);
    this.setState({ handoffConfirm: null });
  }

  cancelHandoff() {
    this.setState({ handoffConfirm: null });
  }

  // One "Send to…" button + popover per qualifying panel, listing every
  // hand-off target whose mode isn't `sourceMode` (a panel never offers its
  // own current mode as a destination).
  renderSendToMenu(sourceKey, sourceMode, text, tok, originSlot) {
    const isOpen = this.state.sendMenuOpen === sourceKey;
    const targets = Object.keys(HANDOFF_TARGETS).filter((k) => HANDOFF_TARGETS[k].mode !== sourceMode);
    const triggerStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', padding: 0, border: '1px solid ' + tok.border, borderRadius: tok.radiusSm, background: tok.elev, color: tok.textDim, cursor: 'pointer' };
    const itemStyle = { display: 'block', width: 'auto', minWidth: '160px', height: '30px', padding: '0 10px', border: 0, borderBottom: '1px solid ' + tok.border, background: 'transparent', color: tok.text, font: '500 12px/1 ' + tok.fontUi, textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' };
    const trigger = h('button', {
      key: 'trigger', title: 'Send to…', 'aria-label': 'Send to…',
      onClick: (e) => { e.stopPropagation(); this.setState((s) => ({ sendMenuOpen: s.sendMenuOpen === sourceKey ? null : sourceKey })); },
      style: triggerStyle,
    }, window.PAW_ICONS ? window.PAW_ICONS.sendTo() : null);
    const menu = isOpen ? h('div', {
      key: 'menu',
      style: { position: 'absolute', top: '34px', right: 0, display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', zIndex: 20, background: tok.panel, border: '1px solid ' + tok.border, borderRadius: tok.radiusSm, boxShadow: tok.shadow, overflow: 'hidden' },
    }, targets.map((k) => h('button', {
      key: k,
      onClick: () => this.requestHandoff(k, text, originSlot),
      style: itemStyle,
    }, 'Send to ' + HANDOFF_TARGETS[k].label))) : null;
    return h('div', { className: 'rf-send-menu-wrap', style: { position: 'relative', display: 'inline-flex' } }, trigger, menu);
  }

  // One "Library" control per slot: a trigger showing the linked payload's
  // name (or a neutral placeholder when unlinked) plus a dirty dot, and a
  // popover for Save/Save As/Rename/Duplicate/Unlink/Open from Library.
  renderLibraryMenu(slotKey, tok) {
    const link = this.state.libraryLinks[slotKey];
    const record = link.id ? window.PAW_LIBRARY.get(link.id) : null;
    const isOpen = this.state.libraryMenuOpen === slotKey;
    const label = record ? record.name : 'Unsaved';
    const triggerStyle = { display: 'inline-flex', alignItems: 'center', gap: '6px', height: '30px', padding: '0 10px', border: '1px solid ' + tok.border, borderRadius: tok.radiusSm, background: tok.elev, color: tok.text, font: '600 11.5px/1 ' + tok.fontUi, cursor: 'pointer', maxWidth: '180px' };
    const dotStyle = { width: '6px', height: '6px', borderRadius: '50%', flex: '0 0 auto', background: link.dirty ? tok.sem.warn : (record ? tok.sem.ok : tok.textFaint) };
    const nameStyle = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
    const itemStyle = { display: 'block', width: 'auto', minWidth: '180px', height: '30px', padding: '0 10px', border: 0, borderBottom: '1px solid ' + tok.border, background: 'transparent', color: tok.text, font: '500 12px/1 ' + tok.fontUi, textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' };
    const disabledItemStyle = Object.assign({}, itemStyle, { color: tok.textFaint, cursor: 'default' });
    const trigger = h('button', {
      key: 'trigger',
      title: record ? (link.dirty ? record.name + ' — unsaved changes' : record.name) : 'Not saved to the Library',
      onClick: (e) => { e.stopPropagation(); this.setState((s) => ({ libraryMenuOpen: s.libraryMenuOpen === slotKey ? null : slotKey })); },
      style: triggerStyle,
    }, window.PAW_ICONS ? window.PAW_ICONS.folder() : null, h('span', { key: 'n', style: nameStyle }, label), h('span', { key: 'd', style: dotStyle }));
    const items = [
      h('button', { key: 'save', style: link.id ? itemStyle : disabledItemStyle, onClick: () => { if (link.id) this.saveLibrarySlot(slotKey); } }, window.PAW_ICONS ? window.PAW_ICONS.save() : null, 'Save'),
      h('button', { key: 'saveas', style: itemStyle, onClick: () => this.openLibrarySaveAsPrompt(slotKey) }, 'Save As…'),
    ];
    if (link.id) {
      items.push(h('button', { key: 'rename', style: itemStyle, onClick: () => this.openLibraryRenamePrompt(link.id, record ? record.name : '') }, 'Rename…'));
      items.push(h('button', { key: 'dup', style: itemStyle, onClick: () => this.duplicateLibraryRecord(link.id, slotKey) }, 'Duplicate'));
      items.push(h('button', { key: 'unlink', style: itemStyle, onClick: () => this.setState({ libraryMenuOpen: null, libraryLinks: Object.assign({}, this.state.libraryLinks, { [slotKey]: { id: null, dirty: false } }) }) }, 'Unlink'));
    }
    items.push(h('button', { key: 'open', style: itemStyle, onClick: () => this.openLibraryBrowser(slotKey) }, 'Open from Library…'));
    const menu = isOpen ? h('div', {
      key: 'menu',
      style: { position: 'absolute', top: '34px', right: 0, display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', zIndex: 20, background: tok.panel, border: '1px solid ' + tok.border, borderRadius: tok.radiusSm, boxShadow: tok.shadow, overflow: 'hidden' },
    }, items) : null;
    const refBySlot = { dig: this.digLibMenuRef, spotA: this.spotALibMenuRef, spotB: this.spotBLibMenuRef, bury: this.buryLibMenuRef };
    return h('div', { className: 'rf-library-menu-wrap', ref: refBySlot[slotKey], style: { position: 'relative', display: 'inline-flex', minWidth: 0 } }, trigger, menu);
  }

  // Row list for the Library browser modal. `libraryOpenContext` (set when a
  // panel launched the browser via "Open from Library…") narrows each row to
  // one "Open" action for that slot; opened from the navbar with no context,
  // every row offers all four destinations, mirroring renderSendToMenu.
  renderLibraryBrowser(tok) {
    const S = this.state;
    const records = window.PAW_LIBRARY ? window.PAW_LIBRARY.list() : [];
    const filter = (S.libraryFilter || '').trim().toLowerCase();
    const filtered = filter ? records.filter((r) => r.name.toLowerCase().indexOf(filter) !== -1) : records;
    const context = S.libraryOpenContext;
    const rowStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 6px', borderBottom: '1px solid ' + tok.border };
    const nameStyle = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: '600 12.5px/1.3 ' + tok.fontUi, color: tok.text };
    const metaStyle = { font: '500 10.5px/1 ' + tok.fontMono, color: tok.textFaint, whiteSpace: 'nowrap' };
    const smallBtnStyle = { height: '26px', padding: '0 8px', border: '1px solid ' + tok.border, borderRadius: tok.radiusSm, background: tok.elev, color: tok.text, font: '600 11px/1 ' + tok.fontUi, cursor: 'pointer', whiteSpace: 'nowrap' };
    const iconBtnStyle = { width: '26px', height: '26px', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid ' + tok.border, borderRadius: tok.radiusSm, background: tok.elev, color: tok.textDim, cursor: 'pointer' };

    if (!filtered.length) {
      return h('div', { style: { padding: '28px 10px', textAlign: 'center', color: tok.textFaint, font: '500 12.5px/1.5 ' + tok.fontUi } },
        records.length ? ('No saved payloads match "' + S.libraryFilter + '".') : 'Nothing saved yet — paste or import a payload, then Save it from any panel.');
    }

    return h('div', null, filtered.map((r) => {
      const openTargets = context ? [context] : LIBRARY_SLOTS;
      const originLabel = HANDOFF_TARGETS[r.originMode] ? HANDOFF_TARGETS[r.originMode].label : r.originMode;
      return h('div', { key: r.id, className: 'rf-library-row', style: rowStyle },
        h('div', { key: 'main', style: { flex: '1 1 auto', minWidth: 0 } },
          h('div', { key: 'n', style: nameStyle }, r.name),
          h('div', { key: 'm', style: metaStyle }, String(r.format || 'text').toUpperCase() + ' · from ' + originLabel + ' · ' + formatByteSize(r.size || 0) + ' · ' + new Date(r.updatedAt).toLocaleString())
        ),
        h('div', { key: 'actions', style: { display: 'flex', alignItems: 'center', gap: '5px', flex: '0 0 auto' } },
          openTargets.map((slot) => h('button', {
            key: 'open-' + slot, style: smallBtnStyle, title: 'Open in ' + HANDOFF_TARGETS[slot].label,
            onClick: () => this.openLibraryRecordIntoSlot(r.id, slot),
          }, context ? 'Open' : HANDOFF_TARGETS[slot].label)),
          h('button', { key: 'rename', title: 'Rename', style: iconBtnStyle, onClick: () => this.openLibraryRenamePrompt(r.id, r.name) }, window.PAW_ICONS ? window.PAW_ICONS.pencil() : null),
          h('button', { key: 'dup', title: 'Duplicate', style: iconBtnStyle, onClick: () => this.duplicateLibraryRecord(r.id, null) }, window.PAW_ICONS ? window.PAW_ICONS.copy() : null),
          h('button', { key: 'del', title: 'Delete', style: iconBtnStyle, onClick: () => this.deleteLibraryRecord(r.id) }, window.PAW_ICONS ? window.PAW_ICONS.trash() : null)
        )
      );
    }));
  }

  toggleSanitizeMatchExcluded(id) {
    this.setState(s => {
      const cur = s.sanitizeOverrides[id] || {};
      const wasExcluded = cur.excluded != null ? cur.excluded : false;
      return { sanitizeOverrides: Object.assign({}, s.sanitizeOverrides, { [id]: Object.assign({}, cur, { excluded: !wasExcluded }) }) };
    });
  }

  setSanitizeMatchReplacement(id, value) {
    this.setState(s => ({ sanitizeOverrides: Object.assign({}, s.sanitizeOverrides, { [id]: Object.assign({}, s.sanitizeOverrides[id], { customFake: value }) }) }));
  }

  markSanitizeSelectionRedact() {
    const S = this.state;
    const sel = S.sanitizeSelection;
    if (!sel || sel.start === sel.end) return;
    const text = S.sanitizeInput.slice(sel.start, sel.end);
    if (!text.trim()) return;
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const label = 'Manual: "' + (text.length > 24 ? text.slice(0, 24) + '…' : text) + '"';
    const rule = { id: 'manual-' + Date.now(), label, type: 'pattern', pattern: escaped, generator: 'generic' };
    if (S.sanitizeSaveManualAsRule) {
      const profileId = this.getSanitizeProfile().id;
      window.PAW_SANITIZE.updateProfileOverride(profileId, (profile) => { profile.patternRules = (profile.patternRules || []).concat(rule); });
    }
    this.setState(s => ({ sanitizeManualRules: s.sanitizeManualRules.concat(rule), sanitizeSelection: null }));
  }

  // Peer of markSanitizeSelectionRedact() — guesses the selected text's
  // *shape* instead of matching it literally. Opens the existing rule-
  // editor form pre-filled for review/Save rather than applying
  // immediately, since a shape guess is an unanchored regex that could
  // over-match many unrelated values (a wrong literal match only ever
  // matches that one exact string).
  startAutoDetectSanitizeRule() {
    const S = this.state;
    const sel = S.sanitizeSelection;
    if (!sel || sel.start === sel.end) return;
    const text = S.sanitizeInput.slice(sel.start, sel.end);
    if (!text.trim()) return;
    const profile = this.getSanitizeProfile();
    const existingRules = (profile.patternRules || []).concat(S.sanitizeManualRules);
    const detection = window.PAW_SANITIZE.detectPatternForValue(text, existingRules);
    if (!detection) return;
    if (detection.type === 'existing') {
      this.setState({ sanitizeAutoDetectNotice: 'This already matches the "' + detection.rule.label + '" rule.', sanitizeSelection: null });
      return;
    }
    this.setState({
      sanitizeRuleEditing: { section: 'pattern', index: null },
      sanitizeRuleDraft: { label: detection.label, pattern: detection.pattern, generator: detection.generator },
      sanitizeRuleError: null,
      showSanitizeRules: true,
      sanitizeAutoDetectNotice: null,
      sanitizeSelection: null,
    });
  }

  onClearSanitizeMappings() {
    window.PAW_SANITIZE.clearMapping();
    this._sanitizeMapping = window.PAW_SANITIZE.createMapping();
    this._sanitizeRun = null;
    this.setState({ sanitizeOverrides: {} });
  }

  // Export prompts for a ruleset name (inline, in the Rules modal) so the
  // name travels inside the exported file and shows up when re-imported.
  openSanitizeExportPrompt() {
    this.setState({ sanitizeExportPromptOpen: true, sanitizeExportName: this.getSanitizeProfile().name });
  }

  cancelSanitizeExportPrompt() {
    this.setState({ sanitizeExportPromptOpen: false, sanitizeExportName: '' });
  }

  confirmSanitizeExport() {
    const name = (this.state.sanitizeExportName || '').trim();
    if (!name) return;
    const result = window.PAW_SANITIZE.exportProfile(this.getSanitizeProfile(), name);
    const blob = new Blob([JSON.stringify({ profiles: [result] }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = result.id + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    this._sanitizeRun = null;
    this.setState({ sanitizeExportPromptOpen: false, sanitizeExportName: '' });
  }

  // Merges the imported ruleset's profiles into the existing overrides by
  // id (see importAndMergeRuleset) rather than wholesale-replacing the
  // store, so importing one ruleset never discards customizations to an
  // unrelated profile. Selects the first imported profile so it's visible
  // immediately.
  importSanitizeRulesetFile(file) {
    const r = new FileReader();
    r.onload = () => {
      const res = window.PAW_SANITIZE.importRulesetText(String(r.result));
      if (res.ok) {
        const importedIds = window.PAW_SANITIZE.importAndMergeRuleset(res.ruleset);
        this._sanitizeRun = null;
        this.setState({ sanitizeRulesImportError: null, sanitizeProfileId: importedIds[0] || this.state.sanitizeProfileId, sanitizeOverrides: {}, sanitizeManualRules: [] });
      } else {
        this.setState({ sanitizeRulesImportError: res.error });
      }
    };
    r.readAsText(file);
  }

  // Reverts only the active profile back to its shipped default — other
  // profiles' overrides (and the localStorage mapping) are untouched.
  resetSanitizeRuleOverrides() {
    window.PAW_SANITIZE.removeProfileOverride(this.getSanitizeProfile().id);
    this._sanitizeRun = null;
    this.setState({ sanitizeOverrides: {}, sanitizeRulesImportError: null, sanitizeRuleEditing: null });
  }

  // --- in-app rule editor: edits the currently active profile only ---

  startAddSanitizeRule(section) {
    const draft = section === 'key'
      ? { label: '', match: '', matchMode: 'wildcard', generator: 'generic' }
      : { label: '', pattern: '', generator: 'generic' };
    this.setState({ sanitizeRuleEditing: { section, index: null }, sanitizeRuleDraft: draft, sanitizeRuleError: null });
  }

  startEditSanitizeRule(section, index) {
    const profile = this.getSanitizeProfile();
    const rule = (section === 'key' ? profile.keyRules : profile.patternRules)[index];
    if (!rule) return;
    const draft = section === 'key'
      ? { label: rule.label || '', match: rule.match || '', matchMode: rule.matchMode || 'wildcard', generator: rule.generator || 'generic' }
      : { label: rule.label || '', pattern: rule.pattern || '', generator: rule.generator || 'generic' };
    this.setState({ sanitizeRuleEditing: { section, index }, sanitizeRuleDraft: draft, sanitizeRuleError: null });
  }

  cancelSanitizeRuleEdit() {
    this.setState({ sanitizeRuleEditing: null, sanitizeRuleDraft: null, sanitizeRuleError: null });
  }

  updateSanitizeRuleDraft(patch) {
    this.setState(s => ({ sanitizeRuleDraft: Object.assign({}, s.sanitizeRuleDraft, patch) }));
  }

  saveSanitizeRuleDraft() {
    const S = this.state;
    const editing = S.sanitizeRuleEditing;
    const draft = S.sanitizeRuleDraft;
    if (!editing || !draft) return;
    const section = editing.section;
    const key = section === 'key' ? 'keyRules' : 'patternRules';
    if (section === 'key' && !draft.match.trim()) { this.setState({ sanitizeRuleError: 'Match text is required.' }); return; }
    if (section === 'pattern') {
      if (!draft.pattern.trim()) { this.setState({ sanitizeRuleError: 'Pattern is required.' }); return; }
      try { new RegExp(draft.pattern); } catch (e) { this.setState({ sanitizeRuleError: 'Invalid regular expression: ' + e.message }); return; }
    }
    const profileId = this.getSanitizeProfile().id;
    window.PAW_SANITIZE.updateProfileOverride(profileId, (profile) => {
      const list = (profile[key] || []).slice();
      const isNew = editing.index == null;
      const existingId = isNew ? null : (list[editing.index] && list[editing.index].id);
      const rule = section === 'key'
        ? { id: existingId || ('custom-' + Date.now()), label: draft.label.trim() || draft.match.trim(), type: 'key', match: draft.match.trim(), matchMode: draft.matchMode, generator: draft.generator }
        : { id: existingId || ('custom-' + Date.now()), label: draft.label.trim() || draft.pattern.trim(), type: 'pattern', pattern: draft.pattern.trim(), generator: draft.generator };
      if (isNew) list.push(rule); else list[editing.index] = rule;
      profile[key] = list;
    });
    this._sanitizeRun = null;
    this.setState({ sanitizeRuleEditing: null, sanitizeRuleDraft: null, sanitizeRuleError: null });
  }

  deleteSanitizeRule(section, index) {
    const profileId = this.getSanitizeProfile().id;
    const key = section === 'key' ? 'keyRules' : 'patternRules';
    window.PAW_SANITIZE.updateProfileOverride(profileId, (profile) => {
      profile[key] = (profile[key] || []).filter((_, i) => i !== index);
    });
    this._sanitizeRun = null;
    this.setState({ sanitizeRuleEditing: null, sanitizeRuleDraft: null });
  }

  renderSanitizeMatches(matches, tok) {
    if (!matches.length) {
      return h('div', { style: { padding: '16px', color: tok.textFaint, font: '500 12px/1.4 ' + tok.fontUi } }, 'No sensitive values detected yet — paste something above, or highlight text and mark it for redaction.');
    }
    return h('div', { style: { display: 'flex', flexDirection: 'column' } }, matches.map((m) => {
      const excluded = !!m.excluded;
      const preview = m.value.length > 40 ? m.value.slice(0, 18) + '…' + m.value.slice(-6) : m.value;
      const replacement = m.customFake != null && m.customFake !== '' ? m.customFake : m.fake;
      return h('div', { key: m.id, style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderBottom: '1px solid ' + tok.border, opacity: excluded ? .55 : 1 } },
        h('button', {
          title: excluded ? 'Excluded — click to include' : 'Included — click to exclude',
          onClick: () => this.toggleSanitizeMatchExcluded(m.id),
          style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', border: '1px solid ' + tok.border, borderRadius: '6px', background: tok.elev, color: tok.textDim, cursor: 'pointer', flex: '0 0 auto', padding: 0 },
        }, window.PAW_ICONS ? (excluded ? window.PAW_ICONS.eyeOff() : window.PAW_ICONS.eye()) : null),
        h('span', { title: m.ruleLabel, style: { font: '600 11px/1 ' + tok.fontUi, color: tok.textFaint, textTransform: 'uppercase', letterSpacing: '.03em', flex: '0 0 auto', width: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, m.ruleLabel || 'Rule'),
        h('span', { title: m.value, style: { font: '500 12px/1 ' + tok.fontMono, color: tok.textDim, flex: '1 1 160px', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, preview),
        h('span', { style: { color: tok.textFaint, flex: '0 0 auto' } }, '→'),
        h('input', {
          value: replacement, disabled: excluded,
          onChange: (e) => this.setSanitizeMatchReplacement(m.id, e.target.value),
          style: { flex: '1 1 160px', minWidth: 0, height: '26px', border: '1px solid ' + tok.border, borderRadius: '6px', background: excluded ? tok.panel2 : tok.elev, color: tok.text, font: '500 12px/1 ' + tok.fontMono, padding: '0 8px' },
        })
      );
    }));
  }

  // A real <select> (not the old ServiceNow/Generic segmented buttons) so
  // any imported/custom ruleset shows up as a selectable entry too. Dirty
  // (unsaved) profiles get a "●" prefix in their option label, plus a
  // separate badge next to the dropdown for the *active* profile, since a
  // native <option>'s bullet can't be colored/styled on its own.
  renderSanitizeProfileSelector(tok) {
    const ruleset = this.getSanitizeRuleset();
    const activeId = this.state.sanitizeProfileId;
    const active = ruleset.profiles.find((p) => p.id === activeId);
    const selectStyle = { height: '30px', padding: '0 8px', border: '1px solid ' + tok.border, borderRadius: tok.radiusSm, background: tok.elev, color: tok.text, font: '600 12px/1 ' + tok.fontUi, cursor: 'pointer' };
    const select = h('select', {
      value: activeId,
      onChange: (e) => this.setState({ sanitizeProfileId: e.target.value, sanitizeOverrides: {}, sanitizeManualRules: [] }),
      style: selectStyle,
    }, ruleset.profiles.map((p) => h('option', { key: p.id, value: p.id }, (p.__dirty ? '● ' : '') + p.name)));
    const dirtyBadge = active && active.__dirty
      ? h('span', {
        title: 'Unsaved rule changes — export to save this ruleset.',
        style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '8px', height: '8px', borderRadius: '50%', background: tok.sem.warn, flex: '0 0 auto' },
      })
      : null;
    return h('div', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } }, select, dirtyBadge);
  }

  // Rule editor: edits the currently active profile only (per the design
  // note in docs/features/paw-sanitize-design.md — ServiceNow/Generic are
  // starting points; forking a heavily-customized one into a new named
  // profile goes through Export -> hand-edit id/name -> Import).
  renderSanitizeRulesPanel(tok) {
    const profile = this.getSanitizeProfile();
    const editing = this.state.sanitizeRuleEditing;
    const addBtnStyle = { display: 'inline-flex', alignItems: 'center', gap: '5px', height: '26px', padding: '0 10px', border: '1px dashed ' + tok.border, borderRadius: '6px', background: 'transparent', color: tok.textDim, font: '600 11px/1 ' + tok.fontUi, cursor: 'pointer', marginTop: '6px' };
    const section = (label, sectionKind, listKey) => h('div', { key: listKey, style: { marginBottom: '16px' } },
      h('div', { style: { font: '600 10.5px/1 ' + tok.fontUi, color: tok.textFaint, textTransform: 'uppercase', letterSpacing: '.04em', margin: '8px 0 5px' } }, label),
      (profile[listKey] || []).map((r, i) => this.renderSanitizeRuleRow(sectionKind, r, i, tok)),
      (editing && editing.section === sectionKind && editing.index === null) ? this.renderSanitizeRuleForm(tok) : null,
      h('button', { onClick: () => this.startAddSanitizeRule(sectionKind), style: addBtnStyle }, '+ Add ' + (sectionKind === 'key' ? 'key rule' : 'pattern rule'))
    );
    return h('div', {},
      h('div', { style: { font: '700 13px/1 ' + tok.fontUi, color: tok.text, marginBottom: '10px' } }, 'Editing: ' + profile.name),
      section('Key rules', 'key', 'keyRules'),
      section('Pattern rules', 'pattern', 'patternRules')
    );
  }

  renderSanitizeRuleRow(section, rule, index, tok) {
    const editing = this.state.sanitizeRuleEditing;
    if (editing && editing.section === section && editing.index === index) return this.renderSanitizeRuleForm(tok);
    const desc = section === 'key' ? (rule.match + (rule.matchMode === 'regex' ? '  (regex)' : '')) : rule.pattern;
    const iconBtnStyle = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', border: '1px solid ' + tok.border, borderRadius: '6px', background: tok.elev, color: tok.textDim, cursor: 'pointer', flex: '0 0 auto', padding: 0 };
    return h('div', { key: rule.id, style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' } },
      h('span', { title: desc, style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', font: '500 12px/1.6 ' + tok.fontMono, color: tok.textDim } }, desc + '  →  ' + rule.generator),
      h('button', { title: 'Edit', onClick: () => this.startEditSanitizeRule(section, index), style: iconBtnStyle }, window.PAW_ICONS ? window.PAW_ICONS.pencil() : null),
      h('button', { title: 'Delete', onClick: () => this.deleteSanitizeRule(section, index), style: iconBtnStyle }, window.PAW_ICONS ? window.PAW_ICONS.trash() : null)
    );
  }

  renderSanitizeRuleForm(tok) {
    const S = this.state;
    const editing = S.sanitizeRuleEditing;
    const draft = S.sanitizeRuleDraft;
    const inputStyle = { flex: '1 1 120px', minWidth: 0, height: '26px', border: '1px solid ' + tok.border, borderRadius: '6px', background: tok.elev, color: tok.text, font: '500 12px/1 ' + tok.fontMono, padding: '0 8px' };
    const selectStyle = Object.assign({}, inputStyle, { flex: '0 0 auto', font: '500 12px/1 ' + tok.fontUi });
    const fields = editing.section === 'key'
      ? [h('input', { key: 'match', placeholder: 'key match (wildcard or regex)', value: draft.match, onChange: (e) => this.updateSanitizeRuleDraft({ match: e.target.value }), style: inputStyle }),
        h('select', { key: 'mode', value: draft.matchMode, onChange: (e) => this.updateSanitizeRuleDraft({ matchMode: e.target.value }), style: selectStyle },
          h('option', { value: 'wildcard' }, 'wildcard'), h('option', { value: 'regex' }, 'regex'))]
      : [h('input', { key: 'pattern', placeholder: 'regex pattern (no ^/$, no flags)', value: draft.pattern, onChange: (e) => this.updateSanitizeRuleDraft({ pattern: e.target.value }), style: inputStyle })];
    return h('div', { key: 'editing-row', style: { display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px', margin: '4px 0', border: '1px solid ' + tok.accent, borderRadius: '8px', background: tok.accentWeak } },
      h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        h('input', { key: 'label', placeholder: 'label (optional)', value: draft.label, onChange: (e) => this.updateSanitizeRuleDraft({ label: e.target.value }), style: Object.assign({}, inputStyle, { flex: '1 1 100px' }) }),
        ...fields,
        h('select', { key: 'gen', value: draft.generator, onChange: (e) => this.updateSanitizeRuleDraft({ generator: e.target.value }), style: selectStyle },
          (window.PAW_SANITIZE.generatorNames || []).map((g) => h('option', { key: g, value: g }, g)))),
      S.sanitizeRuleError ? h('div', { style: { font: '500 11px/1.4 ' + tok.fontUi, color: tok.sem.err } }, S.sanitizeRuleError) : null,
      h('div', { style: { display: 'flex', gap: '6px' } },
        h('button', { onClick: () => this.saveSanitizeRuleDraft(), style: { height: '26px', padding: '0 12px', border: 'none', borderRadius: '6px', background: tok.accent, color: tok.accentContrast, font: '700 11px/1 ' + tok.fontUi, cursor: 'pointer' } }, 'Save'),
        h('button', { onClick: () => this.cancelSanitizeRuleEdit(), style: { height: '26px', padding: '0 12px', border: '1px solid ' + tok.border, borderRadius: '6px', background: 'transparent', color: tok.textDim, font: '600 11px/1 ' + tok.fontUi, cursor: 'pointer' } }, 'Cancel')));
  }

  buildModel() {
    const input = this.state.docInput;
    const hasHeaderRow = this.state.tableHasHeaderRow !== false;
    if (this._model && this._model.input === input && this._model.hasHeaderRow === hasHeaderRow) return this._model;
    const parsed = this.parse(input);
    const node = this.rootNode(parsed);
    this._model = { input, parsed, node, hasHeaderRow };
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
    const acts = h('span', { className: 'rf-acts', style: { position: 'absolute', right: '6px', top: 0, height: ROW_H + 'px', display: 'inline-flex', alignItems: 'center', gap: '4px', paddingLeft: '16px', background: 'linear-gradient(90deg, transparent, ' + tok.panel + ' 40%)' } }, this.miniBtn('path', n, ctx), this.miniBtn('value', n, ctx), row.type === 'leaf' ? null : this.miniBtn('table', n, ctx));
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
    const pathFilter = ctx.pathFilter && ctx.keep && ctx.keep.size > 0;
    const walk = (n, depth) => {
      if (!n) return;
      if (n.kind === 'leaf') {
        const key = n.key == null ? '' : String(n.key);
        const value = n.vType === 'null' ? 'null' : String(n.disp == null ? '' : n.disp);
        if (pathFilter && !ctx.keep.has(n.path)) return;
        const keyMatch = term && key.toLowerCase().includes(term);
        const valMatch = term && value.toLowerCase().includes(term);
        if (inFilter && !(keyMatch || valMatch)) return;
        rows.push({ id: n.path, node: n, path: n.jpath, key, value, type: n.vType });
        return;
      }
      if (n.children) n.children.forEach(c => walk(c, depth + 1));
    };
    walk(node, 0);
    return { rows, suitable: rows.length > 0 };
  }

  recordTableRows(node, parsed, ctx) {
    const rows = [];
    if (!node || !parsed || !parsed.ok) return { rows, columns: [], suitable: false };
    if (node.kind === 'leaf') return { rows, columns: [], suitable: false };

    const term = (ctx.term || '').toLowerCase();
    const inFilter = ctx.filter && !!term;
    const pathFilter = ctx.pathFilter && ctx.keep && ctx.keep.size > 0;
    const rowNodes = node.kind === 'array' && node.children && node.children.length ? node.children : [node];
    const columns = [];
    const seen = new Set();

    const addColumn = (name) => {
      if (!name || seen.has(name)) return;
      seen.add(name);
      columns.push(name);
    };

    const cellText = (n) => {
      if (!n) return '';
      if (n.kind === 'leaf') return n.vType === 'null' ? 'null' : String(n.disp == null ? '' : n.disp);
      return this.nodeCopyText(n);
    };

    const rowFields = (rowNode) => {
      const fields = {};
      const fieldMeta = {};
      const pushField = (key, value, nodePath, part) => {
        if (!key) return;
        fields[key] = value;
        fieldMeta[key] = {
          nodePath: nodePath || rowNode.path,
          part: part || 'v'
        };
        addColumn(key);
      };

      if (!rowNode.children || !rowNode.children.length) {
        pushField('value', cellText(rowNode), rowNode.path, 'v');
        return { fields, fieldMeta };
      }

      rowNode.children.forEach(child => {
        const key = child.key == null ? '' : String(child.key);
        if (!key) return;
        pushField(key, cellText(child), child.path, 'v');
      });

      if (!Object.keys(fields).length) pushField('value', cellText(rowNode), rowNode.path, 'v');
      return { fields, fieldMeta };
    };

    rowNodes.forEach((rowNode, index) => {
      const rowData = rowFields(rowNode);
      const fields = rowData.fields;
      const fieldMeta = rowData.fieldMeta;
      const rowLabel = rowNode.jpath || rowNode.path || String(index);
      if (pathFilter) {
        let matchesPath = ctx.keep.has(rowNode.path);
        if (!matchesPath) {
          const keys = Object.keys(fieldMeta);
          for (let i = 0; i < keys.length; i++) {
            const meta = fieldMeta[keys[i]];
            if (meta && ctx.keep.has(meta.nodePath)) { matchesPath = true; break; }
          }
        }
        if (!matchesPath) return;
      }
      const matches = term
        ? Object.keys(fields).some(key => key.toLowerCase().includes(term) || String(fields[key]).toLowerCase().includes(term)) || rowLabel.toLowerCase().includes(term)
        : true;
      if (inFilter && !matches) return;
      rows.push({
        id: rowNode.path + '#r' + index,
        node: rowNode,
        path: rowLabel,
        index,
        fields,
        fieldMeta,
      });
    });

    return { rows, columns, suitable: rows.length > 0 };
  }

  renderTableRow(row, ctx) {
    const tok = ctx.tok, n = row.node;
    const copyPathKey = n.path + ':path';
    const copyValKey = n.path + ':value';
    const tblSelected = this.state.tableSourcePath === n.path;
    const pathCopied = this.state.copied === copyPathKey;
    const valCopied = this.state.copied === copyValKey;
    return h('div', { className: 'rf-table-row rf-row', style: { position: 'relative', display: 'grid', gridTemplateColumns: TABLE_COLS, gap: '10px', alignItems: 'center', minHeight: TABLE_ROW_MIN_H + 'px', padding: '6px 170px 6px 10px', borderBottom: '1px solid ' + tok.border + '66' } },
      h('div', { className: 'rf-table-cell-path', title: row.path, style: { color: tok.accent, font: '600 11px/1.4 ' + tok.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, row.path),
      h('div', { className: 'rf-table-cell-key', title: row.key, style: { color: n.vType === 'attr' ? tok.syn.attr : tok.syn.key, font: '500 12px/1.4 ' + tok.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, this.hl(row.key, ctx, n.path, 'k')),
      h('div', { className: 'rf-table-cell-value', title: row.value, style: { color: this.valColor(n.vType, tok), font: '400 12px/1.4 ' + tok.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, this.hl(row.value, ctx, n.path, 'v')),
      h('div', { className: 'rf-table-cell-type', style: { color: tok.textDim, font: '600 10.5px/1 ' + tok.fontUi, textTransform: 'uppercase', letterSpacing: '.05em' } }, row.type),
      h('span', { className: 'rf-acts rf-table-acts', style: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', gap: '4px', alignItems: 'center', paddingLeft: '14px', background: 'linear-gradient(90deg, transparent, ' + tok.panel + ' 40%)' } },
        h('button', {
          onClick: (e) => { e.stopPropagation(); this.copy(row.path, copyPathKey); },
          title: row.path,
          style: { font: '600 9.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: pathCopied ? tok.sem.ok : tok.textDim, background: pathCopied ? tok.sem.okW : tok.panel2, border: '1px solid ' + tok.border, borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }
        }, pathCopied ? '✓' : 'path'),
        h('button', {
          onClick: (e) => { e.stopPropagation(); this.copy(this.nodeCopyText(n), copyValKey); },
          title: 'Copy value',
          style: { font: '600 9.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: valCopied ? tok.sem.ok : tok.textDim, background: valCopied ? tok.sem.okW : tok.panel2, border: '1px solid ' + tok.border, borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }
        }, valCopied ? '✓' : 'value'),
        h('button', {
          onClick: (e) => { e.stopPropagation(); this.selectTableSource(n.path); },
          title: 'Set table source to this row path',
          style: { font: '600 9.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: tblSelected ? tok.accent : tok.textDim, background: tblSelected ? tok.accentWeak : tok.panel2, border: '1px solid ' + tok.border, borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }
        }, 'tbl')
      )
    );
  }

  // logLevelCol (optional): guessed level/severity column name for the
  // current table — when set, tints the row's left edge by normalized
  // level (error/warn/info/debug) so a scanned log reads at a glance.
  renderRecordRow(row, ctx, columns, logLevelCol) {
    const tok = ctx.tok;
    const pathCopied = this.state.copied === row.path + ':path';
    const rowCopied = this.state.copied === row.path + ':row';
    const gridTemplateColumns = ['minmax(220px,1.4fr)'].concat(columns.map(() => 'minmax(140px,1fr)')).concat('auto').join(' ');
    const level = logLevelCol ? window.PAW_TABLE.normalizeLevel(row.fields[logLevelCol]) : null;
    const levelColor = { error: tok.sem.err, warn: '#c9922e', info: tok.accent, debug: tok.textFaint }[level];
    const rowStyle = { display: 'grid', gridTemplateColumns, gap: '10px', alignItems: 'stretch', minHeight: TABLE_ROW_MIN_H + 'px', padding: '6px 10px', borderBottom: '1px solid ' + tok.border + '66' };
    if (levelColor) { rowStyle.borderLeft = '3px solid ' + levelColor; rowStyle.background = levelColor + '14'; }

    return h('div', { className: 'rf-record-row rf-row', style: rowStyle },
      h('div', { className: 'rf-record-cell-path', title: row.path, style: { color: tok.accent, font: '600 11px/1.4 ' + tok.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', alignSelf: 'center' } }, this.hl(row.path, ctx, row.node.path, 'k')),
      columns.map(col => {
        const meta = (row.fieldMeta && row.fieldMeta[col]) || { nodePath: row.node.path, part: 'v' };
        const rawVal = row.fields[col];
        const val = rawVal == null || rawVal === '' ? '—' : String(rawVal);
        return h('div', { key: col, className: 'rf-record-cell', title: rawVal == null ? '' : String(rawVal), style: { color: tok.text, font: '400 12px/1.5 ' + tok.fontMono, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'visible', minWidth: 0 } }, this.hl(val, ctx, meta.nodePath, meta.part));
      }),
      h('span', { className: 'rf-acts rf-record-acts', style: { display: 'inline-flex', gap: '4px', justifySelf: 'end', alignSelf: 'center' } },
        h('button', {
          onClick: (e) => { e.stopPropagation(); this.copy(row.path, row.path + ':path'); },
          title: row.path,
          style: { font: '600 9.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: pathCopied ? tok.sem.ok : tok.textDim, background: pathCopied ? tok.sem.okW : tok.panel2, border: '1px solid ' + tok.border, borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }
        }, pathCopied ? '✓' : 'path'),
        h('button', {
          onClick: (e) => { e.stopPropagation(); this.copy(JSON.stringify(row.fields, null, 2), row.path + ':row'); },
          title: 'Copy row',
          style: { font: '600 9.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: rowCopied ? tok.sem.ok : tok.textDim, background: rowCopied ? tok.sem.okW : tok.panel2, border: '1px solid ' + tok.border, borderRadius: '4px', padding: '2px 5px', cursor: 'pointer' }
        }, rowCopied ? '✓' : 'row')
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
    // The gutter numbers one entry per '\n'-split logical line and never
    // itself wraps — when Wrap is on, a single long logical line can visually
    // occupy multiple screen rows in the textarea while the gutter still
    // shows it as one row, so numbering drifts out of alignment. Hide the
    // gutter while Wrap is on rather than show misleading numbers; jump-to-
    // error-line (onJumpError) uses setSelectionRange, not the gutter, so it
    // keeps working either way.
    const showGutter = showLN && !S.softWrap;

    const themeVars = {
      '--bg': tok.bg, '--panel': tok.panel, '--panel-2': tok.panel2, '--elev': tok.elev,
      '--border': tok.border, '--border-strong': tok.borderStrong, '--text': tok.text, '--text-dim': tok.textDim,
      '--text-faint': tok.textFaint, '--accent': tok.accent, '--accent-weak': tok.accentWeak, '--accent-contrast': tok.accentContrast,
      '--radius': tok.radius, '--radius-sm': tok.radiusSm, '--shadow': tok.shadow, '--font-ui': tok.fontUi, '--font-mono': tok.fontMono,
      background: 'var(--bg)', color: 'var(--text)', width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: tok.fontUi, transition: 'background .2s, color .2s',
    };

    const seg = (active) => ({ height: '26px', padding: '0 11px', border: 'none', borderRadius: '7px', cursor: 'pointer', font: '600 12px/1 ' + tok.fontUi, background: active ? tok.panel : 'transparent', color: active ? tok.accent : tok.textDim, boxShadow: active ? '0 1px 3px rgba(0,0,0,.12)' : 'none', transition: 'all .12s' });
    const segIcon = (active) => Object.assign({}, seg(active), { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' });
    const styleTone = {
      aurora: theme === 'dark' ? '#a89cff' : '#6d5efc',
      slate: theme === 'dark' ? '#58d5ca' : '#0e9f96',
      paper: theme === 'dark' ? '#f2b47a' : '#d9713b',
    };
    const remember = sanitizeRememberPrefs(S.rememberPrefs);
    const rememberToggleStyle = (active) => ({
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: '52px', height: '24px', padding: '0 10px', border: 'none', borderRadius: '6px',
      cursor: 'pointer', font: '700 10px/1 ' + tok.fontUi, letterSpacing: '.04em', textTransform: 'uppercase',
      background: active ? tok.accentWeak : tok.panel2,
      color: active ? tok.accent : tok.textDim,
      boxShadow: active ? '0 1px 2px rgba(0,0,0,.12)' : 'none',
      transition: 'all .12s'
    });
    const segFlat = (active) => ({ height: '26px', padding: '0 11px', border: 'none', borderRadius: '6px', cursor: 'pointer', font: '600 12px/1 ' + tok.fontUi, background: active ? tok.accent : 'transparent', color: active ? tok.accentContrast : tok.textDim, transition: 'all .12s' });
    const btnStyle = { display: 'inline-flex', alignItems: 'center', gap: '6px', height: '30px', padding: '0 11px', borderRadius: tok.radiusSm, border: '1px solid ' + tok.border, background: tok.elev, color: tok.text, font: '500 12.5px/1 ' + tok.fontUi, cursor: 'pointer', whiteSpace: 'nowrap' };
    const btnHover = 'background:' + tok.accentWeak + ';border-color:' + tok.accent + ';color:' + tok.text;
    const btnGhost = Object.assign({}, btnStyle, { border: '1px solid transparent', background: 'transparent', color: tok.textDim });
    const fsBtnStyle = Object.assign({}, btnGhost, { width: '30px', minWidth: '30px', padding: '0', justifyContent: 'center', marginLeft: 'auto' });
    const navBtnStyle = { width: '22px', height: '22px', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', border: '1px solid ' + tok.border, background: tok.elev, color: tok.textDim, cursor: 'pointer', font: '600 13px/1 ' + tok.fontUi };
    const splitWrapStyle = { position: 'relative', display: 'inline-flex', alignItems: 'center', height: '30px' };
    const splitMainStyle = { display: 'inline-flex', alignItems: 'center', gap: '6px', height: '30px', padding: '0 10px', borderRadius: tok.radiusSm + ' 0 0 ' + tok.radiusSm, border: '1px solid ' + tok.border, borderRight: '0', background: tok.elev, color: tok.text, font: '500 12.5px/1 ' + tok.fontUi, cursor: 'pointer', whiteSpace: 'nowrap' };
    const splitToggleStyle = { width: '28px', height: '30px', borderRadius: '0 ' + tok.radiusSm + ' ' + tok.radiusSm + ' 0', border: '1px solid ' + tok.border, background: tok.elev, color: tok.textDim, font: '700 10px/1 ' + tok.fontUi, cursor: 'pointer' };
    const beautifyMenuStyle = { position: 'absolute', top: '34px', right: 0, display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', width: 'auto', zIndex: 20, background: tok.panel, border: '1px solid ' + tok.border, borderRadius: tok.radiusSm, boxShadow: tok.shadow, overflow: 'hidden' };
    const beautifyItemStyle = { display: 'block', width: 'auto', minWidth: 0, height: '30px', padding: '0 10px', border: 0, borderBottom: '1px solid ' + tok.border, background: 'transparent', color: tok.text, font: '500 12px/1 ' + tok.fontUi, textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' };
    const beautifyItemHover = 'background:' + tok.accentWeak + ';color:' + tok.accent;

    // parse current (memoized on input)
    const model = this.buildModel();
    const parsed = model.parsed;
    const node = model.node;
    const hasHeaderRow = model.hasHeaderRow; // toggling this rebuilds `node` without changing docInput, so every cache below keyed on docInput must include it too
    const isJson = parsed.format === 'json';
    const isXml = parsed.format === 'xml';
    const isTable = parsed.format === 'table';
    const tableExt = isTable && parsed.ok ? (parsed.tableMeta.kind === 'md' ? 'md' : parsed.tableMeta.kind === 'tsv' ? 'tsv' : 'csv') : null;
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
    if (!this._matchCache || this._matchCache.input !== S.docInput || this._matchCache.term !== term || this._matchCache.hasHeaderRow !== hasHeaderRow) {
      this._matchCache = { input: S.docInput, term, hasHeaderRow, matches: term ? this.collectMatches(node, term) : [] };
    }
    const matches = this._matchCache.matches;
    const searchFilterActive = S.explorerMode === 'search' && S.searchMode === 'filter' && !!term;
    const searchKeepPaths = searchFilterActive ? this.keepSet(node, term) : new Set();
    const searchFilterMatchPaths = searchFilterActive
      ? new Set(matches.map(m => m.replace(/#[kv]$/, '')))
      : new Set();
    const explorerPayloadText = this.explorerPayloadText(parsed, node, term, searchFilterMatchPaths, searchKeepPaths);
    const rawMatchSource = (S.view === 'raw' && term)
      ? (searchFilterActive ? explorerPayloadText : (parsed.empty ? '' : S.input))
      : '';
    const rawMatches = (S.view === 'raw' && term) ? this.collectRawMatches(rawMatchSource, term) : [];
    const activePool = (S.view === 'raw' ? rawMatches : matches);
    const activeIndex = activePool.length ? ((S.matchIndex % activePool.length) + activePool.length) % activePool.length : -1;
    const savedQuery = S.query.trim();
    const query = S.explorerMode === 'query' ? savedQuery : '';
    let explorerEl, queryStat = '', queryStatOk = true, logToolbarEl = null;
    let queryResults = [];
    let queryError = '';
    let queryMatchPaths = new Set();
    let queryKeepPaths = new Set();
    if (query) {
      const qr = isXml ? this.runXPath(parsed.doc, query) : this.runJsonPath(parsed.ok ? parsed.value : {}, query);
      if (!qr.ok) { queryStat = 'error'; queryStatOk = false; queryError = qr.error || 'invalid'; }
      else {
        queryResults = qr.results || [];
        queryStat = queryResults.length + (queryResults.length === 1 ? ' match' : ' matches');
        if (isJson) {
          const queryPaths = new Set(queryResults.map((r) => String(r.path || '').trim()).filter(Boolean));
          const queryTargets = new Set();
          queryPaths.forEach((path) => {
            queryTargets.add(path);
            const treePath = this.jsonPathToTreePath(path);
            if (treePath) queryTargets.add(treePath);
          });
          const keep = new Set();
          const matches = new Set();
          const addSubtree = (n) => {
            if (!n) return;
            keep.add(n.path);
            if (n.children) n.children.forEach(addSubtree);
          };
          const walkQuery = (n) => {
            if (!n) return false;
            const selfMatched = !!((n.jpath && queryTargets.has(n.jpath)) || (n.path && queryTargets.has(n.path)));
            let childMatched = false;
            if (n.children) n.children.forEach((child) => { if (walkQuery(child)) childMatched = true; });
            if (selfMatched) matches.add(n.path);
            if (selfMatched) addSubtree(n);
            if (selfMatched || childMatched) keep.add(n.path);
            return selfMatched || childMatched;
          };
          walkQuery(node);
          queryMatchPaths = matches;
          queryKeepPaths = keep;
        } else if (isXml) {
          const keep = new Set();
          const matches = new Set();
          const queryTargets = new Set(queryResults.map((r) => String((r && r.modelPath) || '').trim()).filter(Boolean));
          const matchedNodes = new Set(queryResults.map((r) => r && r.node).filter(Boolean));
          const addSubtree = (n) => {
            if (!n) return;
            keep.add(n.path);
            if (n.children) n.children.forEach(addSubtree);
          };
          const walkXml = (n) => {
            if (!n) return false;
            const selfMatched = queryTargets.has(n.path) || !!(n.el && matchedNodes.has(n.el));
            let childMatched = false;
            if (n.children) n.children.forEach((child) => { if (walkXml(child)) childMatched = true; });
            if (selfMatched) matches.add(n.path);
            if (selfMatched) addSubtree(n);
            if (selfMatched || childMatched) keep.add(n.path);
            return selfMatched || childMatched;
          };
          walkXml(node);
          queryMatchPaths = matches;
          queryKeepPaths = keep;
        }
      }
    }
    const filterMatchPaths = searchFilterActive ? searchFilterMatchPaths : queryMatchPaths;
    const filterKeepPaths = searchFilterActive ? searchKeepPaths : queryKeepPaths;
    const queryFilterActive = S.explorerMode === 'query' && !!query && queryStatOk;
    const queryPayloadText = queryFilterActive
      ? this.explorerPayloadText(parsed, node, '', queryMatchPaths, queryKeepPaths, true)
      : '';
    const explorerCopyPayloadText = queryFilterActive
      ? queryPayloadText
      : (searchFilterActive ? explorerPayloadText : (parsed.empty ? '' : S.input));
    const sourceSendMenuEl = S.mode === 'format' ? this.renderSendToMenu('source', 'format', S.input, tok, 'dig') : null;
    const explorerSendMenuEl = S.mode === 'format' ? this.renderSendToMenu('explorer', 'format', explorerCopyPayloadText, tok) : null;
    const digLibraryMenuEl = S.mode === 'format' ? this.renderLibraryMenu('dig', tok) : null;

    // Payload Library browser (global modal — mode-independent).
    const libUsage = window.PAW_LIBRARY ? window.PAW_LIBRARY.usage() : { bytes: 0, count: 0, limitBytes: 1 };
    const libraryUsageText = libUsage.count + (libUsage.count === 1 ? ' saved payload · ' : ' saved payloads · ') + formatByteSize(libUsage.bytes) + ' of ~' + formatByteSize(libUsage.limitBytes) + ' used';
    const libraryListEl = S.showLibrary ? this.renderLibraryBrowser(tok) : null;
    const activePath = (S.explorerMode === 'query' && queryMatchPaths.size)
      ? Array.from(queryMatchPaths)[0]
      : ((S.view === 'raw' || activeIndex < 0) ? null : matches[activeIndex]);
    const searchTerm = S.explorerMode === 'search' ? term : '';
    const ctx = { tok, term: searchTerm, activePath, filter: searchFilterActive || queryKeepPaths.size > 0, keep: filterKeepPaths, pathFilter: S.explorerMode === 'query' && queryKeepPaths.size > 0 };
    const matchLabel = activePool.length ? (activeIndex + 1) + '/' + activePool.length : '0/0';

    if (S.view === 'raw') {
      const src = parsed.empty ? '' : S.input;
      this._activeRowIndex = -1;
      this._activeRowHeight = ROW_H;
      const rawSearchActive = S.explorerMode === 'search' && !!term && rawMatches.length > 0;
      const rawBase = queryFilterActive
        ? queryPayloadText
        : ((S.explorerMode === 'search' && S.searchMode === 'filter' && term)
          ? explorerPayloadText
          : src);
      const lines = rawBase.split('\n');
      const rawDisplay = rawBase.length <= 60000 ? this.highlight(rawBase, parsed.format, tok) : rawBase;
      const rawContent = rawSearchActive
        ? this.renderRawSearch(rawDisplay, term, rawMatches, activeIndex, tok)
        : rawDisplay;
      const rawMain = h('div', { style: { display: 'flex', minWidth: 0 } },
        showLN ? h('pre', { style: { margin: 0, padding: '4px 10px 4px 0', textAlign: 'right', color: tok.textFaint, font: '400 13px/20px ' + tok.fontMono, borderRight: '1px solid ' + tok.border, flex: '0 0 auto' } }, lines.map((_, i) => (i + 1)).join('\n')) : null,
        h('pre', { style: { margin: 0, padding: '4px 0 4px 12px', font: '400 13px/20px ' + tok.fontMono, whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1, minWidth: 0 } }, rawContent));
      explorerEl = rawMain;
    } else if (S.view === 'table') {
      const tableMode = S.tableMode || 'path';
      const filter = searchFilterActive || (S.explorerMode === 'query' && queryKeepPaths.size > 0);
      const tableSourceNode = node ? (this.locateNode(node, S.tableSourcePath) || node) : null;
      const tableSourcePath = tableSourceNode ? tableSourceNode.path : '';
      const tableCacheKey = S.docInput + '|' + tableMode + '|' + tableSourcePath + '|' + term + '|' + S.searchMode + '|' + (S.explorerMode === 'query' ? query : '') + '|' + hasHeaderRow;
      if (!this._tableCache || this._tableCache.cacheKey !== tableCacheKey) {
        const res = tableMode === 'record'
          ? this.recordTableRows(tableSourceNode, parsed, { term: searchTerm, filter, keep: filterKeepPaths, pathFilter: S.explorerMode === 'query' && queryKeepPaths.size > 0 })
          : this.tableRows(tableSourceNode, parsed, { term: searchTerm, filter, keep: filterKeepPaths, pathFilter: S.explorerMode === 'query' && queryKeepPaths.size > 0 });
        this._tableCache = { cacheKey: tableCacheKey, mode: tableMode, sourcePath: tableSourcePath, res };
      }
      const table = this._tableCache.res;
      let rows = table.rows;
      // Log-aware Record Table extras (level color/filter, timestamp sort,
      // continuation-row stitching) — scoped to Record Table on a
      // recognized CSV/TSV/Markdown-table document only, so a plain JSON
      // array's table view is unaffected. See docs/features/paw-log-features-design.md.
      const isLogTable = tableMode === 'record' && parsed.format === 'table' && table.suitable;
      let logLevelCol = null, logTimeCol = null, logMsgCol = null;
      if (isLogTable) {
        logLevelCol = window.PAW_TABLE.guessLevelColumn(table.columns);
        logTimeCol = window.PAW_TABLE.guessTimestampColumn(table.columns);
        logMsgCol = window.PAW_TABLE.guessMessageColumn(table.columns);
        if (S.tableStitchLogs && (logLevelCol || logTimeCol) && logMsgCol) {
          const stitched = [];
          rows.forEach(r => {
            const isCont = stitched.length && window.PAW_TABLE.isContinuationRow(r.fields, logLevelCol, logTimeCol);
            if (isCont) {
              const prev = stitched[stitched.length - 1];
              const extra = r.fields[logMsgCol];
              if (extra) prev.fields[logMsgCol] = (prev.fields[logMsgCol] || '') + '\n' + extra;
            } else {
              stitched.push(Object.assign({}, r, { fields: Object.assign({}, r.fields) }));
            }
          });
          rows = stitched;
        }
        if (S.tableLevelFilter && logLevelCol) {
          rows = rows.filter(r => window.PAW_TABLE.normalizeLevel(r.fields[logLevelCol]) === S.tableLevelFilter);
        }
        if (S.tableLogSort && logTimeCol) {
          const dir = S.tableLogSort === 'desc' ? -1 : 1;
          rows = rows.slice().sort((a, b) => {
            const ta = window.PAW_TABLE.parseTimestamp(a.fields[logTimeCol]);
            const tb = window.PAW_TABLE.parseTimestamp(b.fields[logTimeCol]);
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return (ta - tb) * dir;
          });
        }
      }
      if (isLogTable && (logLevelCol || logTimeCol)) {
        const levelsPresent = new Set();
        if (logLevelCol) table.rows.forEach(r => { const lv = window.PAW_TABLE.normalizeLevel(r.fields[logLevelCol]); if (lv) levelsPresent.add(lv); });
        const chipStyle = (active) => ({ font: '600 10.5px/1 ' + tok.fontUi, letterSpacing: '.03em', textTransform: 'uppercase', color: active ? tok.accent : tok.textDim, background: active ? tok.accentWeak : tok.panel2, border: '1px solid ' + (active ? tok.accent : tok.border), borderRadius: '5px', padding: '4px 8px', cursor: 'pointer' });
        const levelChip = (lv, label) => h('button', { key: lv || 'all', style: chipStyle(S.tableLevelFilter === lv), onClick: () => this.setState({ tableLevelFilter: lv }) }, label);
        logToolbarEl = h('div', { className: 'rf-explorer-log-toolbar', style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', borderBottom: '1px solid ' + tok.border, background: tok.panel2, flexWrap: 'wrap' } },
          h('span', { style: { font: '600 10px/1 ' + tok.fontUi, letterSpacing: '.06em', color: tok.textFaint, textTransform: 'uppercase', marginRight: '2px' } }, 'Log'),
          logLevelCol ? [levelChip(null, 'All')].concat(
            [['error', 'Error'], ['warn', 'Warn'], ['info', 'Info'], ['debug', 'Debug']]
              .filter(pair => levelsPresent.has(pair[0]))
              .map(pair => levelChip(pair[0], pair[1]))
          ) : null,
          logLevelCol || logTimeCol ? h('button', { style: chipStyle(S.tableStitchLogs), title: 'Merge blank-level/blank-time continuation rows into the row above', onClick: () => this.setState(s => ({ tableStitchLogs: !s.tableStitchLogs })) }, 'Stitch rows') : null,
          logTimeCol ? h('button', { style: chipStyle(S.tableLogSort === 'asc'), onClick: () => this.setState(s => ({ tableLogSort: s.tableLogSort === 'asc' ? null : 'asc' })) }, 'Sort ↑ time') : null,
          logTimeCol ? h('button', { style: chipStyle(S.tableLogSort === 'desc'), onClick: () => this.setState(s => ({ tableLogSort: s.tableLogSort === 'desc' ? null : 'desc' })) }, 'Sort ↓ time') : null
        );
      }
      this._activeRowIndex = -1;
      this._activeRowHeight = tableMode === 'record' ? RECORD_ROW_H : TABLE_ROW_H;
      if (activePath) {
        const np = activePath.replace(/#[kv]$/, '');
        this._activeRowIndex = rows.findIndex((r) => {
          if (r.node.path === np) return true;
          if (!r.fieldMeta) return false;
          const keys = Object.keys(r.fieldMeta);
          for (let i = 0; i < keys.length; i++) {
            const meta = r.fieldMeta[keys[i]];
            if (meta && meta.nodePath === np) return true;
          }
          return false;
        });
      }
      if (tableMode === 'record' && tableSourceNode && tableSourceNode.kind === 'leaf') {
        explorerEl = h('div', { style: { padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' } },
          h('div', { style: { color: tok.textFaint, font: '500 13px/1.6 ' + tok.fontUi } }, 'Record Table needs an object, array, or element node. Pick a container in the tree, or switch back to Path Table.'),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            h('button', { style: btnStyle, onClick: () => this.setState({ tableMode: 'path' }) }, 'Switch to Path Table'),
            h('button', { style: btnStyle, onClick: () => this.selectTableSource('/root') }, 'Use Root')
          ));
      } else if (!table.suitable) {
        explorerEl = h('div', { style: { padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' } },
          h('div', { style: { color: tok.textFaint, font: '500 13px/1.6 ' + tok.fontUi } }, tableMode === 'record' ? 'This selected node cannot be tabularized.' : 'This document structure is not suitable for table view.'),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            h('button', { style: btnStyle, onClick: () => this.setState({ view: 'tree' }) }, 'Switch to Tree'),
            h('button', { style: btnStyle, onClick: () => this.setState({ tableMode: 'path' }) }, 'Switch to Path Table')
          ));
      } else if (!rows.length) {
        explorerEl = h('div', { style: { padding: '24px', color: tok.textFaint, font: '500 13px/1.5 ' + tok.fontUi } }, 'No table rows match the current filter.');
      } else {
        const sourceLine = h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderBottom: '1px solid ' + tok.border, background: tok.panel2, color: tok.textDim, font: '600 11px/1 ' + tok.fontUi, letterSpacing: '.04em', textTransform: 'uppercase', flexWrap: 'wrap' } },
          this.renderTableSourceIndicator(tableSourceNode, tok)
        );
        if (tableMode === 'record') {
          const recordColumns = table.columns || [];
          const recordGridColumns = ['minmax(220px,1.4fr)'].concat(recordColumns.map(() => 'minmax(140px,1fr)')).concat('auto').join(' ');
          explorerEl = h('div', { className: 'rf-table rf-record-table', style: { minWidth: 0 } },
            sourceLine,
            h('div', { className: 'rf-table-head rf-record-head', style: { position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: recordGridColumns, gap: '10px', padding: '8px 10px', borderBottom: '1px solid ' + tok.border, background: tok.panel2, color: tok.textFaint, font: '700 10.5px/1 ' + tok.fontUi, letterSpacing: '.06em', textTransform: 'uppercase' } },
              h('span', {}, 'Path'),
              recordColumns.map(col => h('span', { key: col }, col)),
              h('span', { style: { justifySelf: 'end' } }, 'Copy')
            ),
            h('div', { className: 'rf-record-body' }, rows.map(row => this.renderRecordRow(row, ctx, recordColumns, logLevelCol)))
          );
        } else {
          explorerEl = h('div', { className: 'rf-table', style: { minWidth: 0 } },
            sourceLine,
            h('div', { className: 'rf-table-head', style: { position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: TABLE_COLS, gap: '10px', padding: '8px 10px', borderBottom: '1px solid ' + tok.border, background: tok.panel2, color: tok.textFaint, font: '700 10.5px/1 ' + tok.fontUi, letterSpacing: '.06em', textTransform: 'uppercase' } },
              h('span', {}, 'Path'),
              h('span', {}, 'Key'),
              h('span', {}, 'Value'),
              h('span', {}, 'Type')
            ),
            this.windowed(rows, ctx, this.renderTableRow.bind(this), TABLE_ROW_H)
          );
        }
      }
    } else if (!node) {
      explorerEl = h('div', { style: { padding: '28px 24px', color: tok.textFaint, font: '500 13px/1.6 ' + tok.fontUi } }, parsed.empty ? 'Nothing to explore yet. Paste JSON or XML, drop a file, or load the sample to build an interactive tree.' : h('span', {}, h('span', { style: { color: tok.sem.err, fontWeight: 700 } }, 'Can\u2019t build tree. '), 'Fix the ' + (parsed.format || '').toUpperCase() + ' error on the left \u2014 the tree updates live once it\u2019s valid.'));
    } else {
      const filter = searchFilterActive || (S.explorerMode === 'query' && queryKeepPaths.size > 0);
      if (!this._flatCache || this._flatCache.input !== S.docInput || this._flatCache.collapsed !== S.collapsed || this._flatCache.term !== term || this._flatCache.mode !== S.searchMode || this._flatCache.query !== (S.explorerMode === 'query' ? query : '') || this._flatCache.hasHeaderRow !== hasHeaderRow) {
        const keep = searchFilterActive ? searchKeepPaths : queryKeepPaths;
        this._flatCache = { input: S.docInput, collapsed: S.collapsed, term, mode: S.searchMode, query: S.explorerMode === 'query' ? query : '', hasHeaderRow, rows: this.flatten(node, { filter, keep, collapsed: S.collapsed }) };
      }
      const rows = this._flatCache.rows;
      this._activeRowIndex = -1;
      this._activeRowHeight = ROW_H;
      if (activePath) { const np = activePath.replace(/#[kv]$/, ''); this._activeRowIndex = rows.findIndex(r => r.node.path === np && r.type !== 'close'); }
      explorerEl = this.windowed(rows, ctx);
    }

    // stats (cached on input)
    if (!this._statsCache || this._statsCache.input !== S.docInput || this._statsCache.hasHeaderRow !== hasHeaderRow) this._statsCache = { input: S.docInput, hasHeaderRow, st: this.stats(node, S.docInput) };
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
    const highlightLimit = parsed.format === 'xml' ? 1200000 : 600000;
    // In wrap mode, span-token overlay and textarea can wrap at different points on long lines.
    // Disable overlay highlighting there to keep click/caret mapping exact.
    const hlEditor = !S.softWrap && S.input.length <= highlightLimit;
    const highlightEl = hlEditor ? this.highlight(S.input, parsed.format, tok) : null;
    const tabSize = (S.indent === '4' || S.indent === 'tab') ? 4 : 2;
    const textWhiteSpace = S.softWrap ? 'pre-wrap' : 'pre';
    const taStyle = { position: 'absolute', inset: 0, margin: 0, padding: '12px 14px', font: '400 13px/20px ' + tok.fontMono, whiteSpace: textWhiteSpace, overflow: 'auto', overflowWrap: S.softWrap ? 'anywhere' : 'normal', resize: 'none', border: 0, outline: 'none', background: 'transparent', color: hlEditor ? 'transparent' : tok.text, caretColor: tok.accent, tabSize };
    const highlightStyle = { position: 'absolute', inset: 0, margin: 0, padding: '12px 14px', font: '400 13px/20px ' + tok.fontMono, whiteSpace: textWhiteSpace, overflow: 'auto', overflowWrap: S.softWrap ? 'anywhere' : 'normal', pointerEvents: 'none', tabSize };
    if (!this._gutterCache || this._gutterCache.input !== S.input) { const lc = S.input.split('\n').length; let g = ''; for (let i = 1; i <= lc; i++) g += i + (i < lc ? '\n' : ''); this._gutterCache = { input: S.input, text: g }; }
    const gutterText = this._gutterCache.text;

    // badges + labels
    const badgeMap = { json: tok.accent, xml: tok.syn.tag, table: tok.syn.string, empty: tok.textFaint };
    const badgeColor = badgeMap[parsed.format] || tok.textFaint;
    const badgeStyle = { display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px', borderRadius: '5px', font: '700 10px/1 ' + tok.fontMono, letterSpacing: '.06em', color: badgeColor, background: 'transparent', border: '1px solid ' + badgeColor + '66' };

    // diff
    const diff = S.mode === 'diff' ? this.renderDiff(tok) : { el: null, add: 0, del: 0 };
    const sanitizeRun = S.mode === 'sanitize' ? this.getSanitizeRun() : { format: 'empty', matches: [] };
    const sanitizeMatches = S.mode === 'sanitize' ? this.getSanitizeMatches() : [];
    const sanitizeOutput = S.mode === 'sanitize' ? this.getSanitizeOutput() : '';
    const sanitizeMatchesEl = S.mode === 'sanitize' ? this.renderSanitizeMatches(sanitizeMatches, tok) : null;
    const sanitizeProfileSelectorEl = S.mode === 'sanitize' ? this.renderSanitizeProfileSelector(tok) : null;
    const sanitizeRulesPanelEl = S.mode === 'sanitize' && S.showSanitizeRules ? this.renderSanitizeRulesPanel(tok) : null;

    // colorized input/output panes, same overlay technique as the Format
    // tab's source panel (transparent-text <textarea> over a highlighted
    // <pre>) — see syncLayers(). tokenizeJSON/tokenizeXML aren't memoized
    // internally, so cache per pane on (text, format, theme, direction).
    const sanitizeHlFmt = sanitizeRun.format === 'xml' ? 'xml' : sanitizeRun.format === 'table' ? 'table' : 'json';
    const sanitizeHlLimit = 600000;
    if (!this._sanitizeInputHlCache || this._sanitizeInputHlCache.text !== S.sanitizeInput || this._sanitizeInputHlCache.fmt !== sanitizeHlFmt || this._sanitizeInputHlCache.theme !== theme || this._sanitizeInputHlCache.dir !== dir) {
      const el = S.sanitizeInput && S.sanitizeInput.length <= sanitizeHlLimit ? this.highlight(S.sanitizeInput, sanitizeHlFmt, tok) : null;
      this._sanitizeInputHlCache = { text: S.sanitizeInput, fmt: sanitizeHlFmt, theme, dir, el };
    }
    const sanitizeInputHighlightEl = this._sanitizeInputHlCache.el;
    if (!this._sanitizeOutputHlCache || this._sanitizeOutputHlCache.text !== sanitizeOutput || this._sanitizeOutputHlCache.fmt !== sanitizeHlFmt || this._sanitizeOutputHlCache.theme !== theme || this._sanitizeOutputHlCache.dir !== dir) {
      const el = sanitizeOutput && sanitizeOutput.length <= sanitizeHlLimit ? this.highlight(sanitizeOutput, sanitizeHlFmt, tok) : null;
      this._sanitizeOutputHlCache = { text: sanitizeOutput, fmt: sanitizeHlFmt, theme, dir, el };
    }
    const sanitizeOutputHighlightEl = this._sanitizeOutputHlCache.el;
    const sanitizeTaStyle = (hlOn) => ({ position: 'absolute', inset: 0, margin: 0, padding: '12px', font: '400 12.5px/19px ' + tok.fontMono, whiteSpace: 'pre', overflow: 'auto', resize: 'none', border: 0, outline: 'none', background: 'transparent', color: hlOn ? 'transparent' : tok.text, caretColor: tok.accent });
    const sanitizeHighlightStyle = { position: 'absolute', inset: 0, margin: 0, padding: '12px', font: '400 12.5px/19px ' + tok.fontMono, whiteSpace: 'pre', overflow: 'auto', pointerEvents: 'none' };
    const sanitizeInputTaStyle = sanitizeTaStyle(!!sanitizeInputHighlightEl);
    const sanitizeOutputTaStyle = sanitizeTaStyle(!!sanitizeOutputHighlightEl);
    const sanitizeGridClass = 'rf-sanitize-grid' + (S.sanitizeFullscreenPanel === 'input' ? ' rf-fs-input' : (S.sanitizeFullscreenPanel === 'output' ? ' rf-fs-output' : ''));
    const sanitizeInputPanelClass = 'rf-sanitize-panel rf-sanitize-panel-input' + (S.sanitizeFullscreenPanel === 'input' ? ' rf-panel-fullscreen' : '');
    const sanitizeOutputPanelClass = 'rf-sanitize-panel rf-sanitize-panel-output' + (S.sanitizeFullscreenPanel === 'output' ? ' rf-panel-fullscreen' : '');
    const sanitizeInputSendMenuEl = S.mode === 'sanitize' ? this.renderSendToMenu('sanitizeInput', 'sanitize', S.sanitizeInput, tok, 'bury') : null;
    const sanitizeOutputSendMenuEl = S.mode === 'sanitize' ? this.renderSendToMenu('sanitizeOutput', 'sanitize', sanitizeOutput, tok) : null;
    const buryLibraryMenuEl = S.mode === 'sanitize' ? this.renderLibraryMenu('bury', tok) : null;
    const diffSummary = (diff.add || diff.del) ? '+' + diff.add + '  −' + diff.del : 'Identical';
    const diffSummaryStyle = { font: '600 12px/1 ' + tok.fontMono, color: (diff.add || diff.del) ? tok.text : tok.sem.ok, padding: '0 4px' };
    const diffWrapClass = 'rf-diff-wrap' + (S.diffFullscreenPanel === 'a' ? ' rf-fs-a' : (S.diffFullscreenPanel === 'b' ? ' rf-fs-b' : (S.diffFullscreenPanel === 'result' ? ' rf-fs-result' : '')));
    const diffPanelAClass = 'rf-diff-panel-a' + (S.diffFullscreenPanel === 'a' ? ' rf-panel-fullscreen' : '');
    const diffPanelBClass = 'rf-diff-panel-b' + (S.diffFullscreenPanel === 'b' ? ' rf-panel-fullscreen' : '');
    const diffPanelResultClass = 'rf-diff-panel-result' + (S.diffFullscreenPanel === 'result' ? ' rf-panel-fullscreen' : '');
    const diffMinimapEl = S.mode === 'diff' ? this.renderDiffMinimap(diff.rows, tok) : null;
    const diffASendMenuEl = S.mode === 'diff' ? this.renderSendToMenu('diffA', 'diff', S.diffA, tok, 'spotA') : null;
    const diffBSendMenuEl = S.mode === 'diff' ? this.renderSendToMenu('diffB', 'diff', S.diffB, tok, 'spotB') : null;
    const spotALibraryMenuEl = S.mode === 'diff' ? this.renderLibraryMenu('spotA', tok) : null;
    const spotBLibraryMenuEl = S.mode === 'diff' ? this.renderLibraryMenu('spotB', tok) : null;
    const formatGridClass = 'rf-format-grid' + (S.fullscreenPanel === 'source' ? ' rf-fs-source' : (S.fullscreenPanel === 'explorer' ? ' rf-fs-explorer' : ''));
    const sourcePanelClass = 'rf-panel-source' + (S.fullscreenPanel === 'source' ? ' rf-panel-fullscreen' : '');
    const explorerPanelClass = 'rf-panel-explorer' + (S.fullscreenPanel === 'explorer' ? ' rf-panel-fullscreen' : '');
    const tableMode = S.tableMode || 'path';
    const tableSourceNode = node ? (this.locateNode(node, S.tableSourcePath) || node) : null;
    const tableRootPath = node ? node.path : '/root';
    const applePlatform = isApplePlatform();
    const modifierKeyLabel = applePlatform ? '⌘' : 'Ctrl';
    const searchShortcutLabel = applePlatform ? '⌘F' : 'Ctrl + F';
    const searchPlaceholder = 'Search keys & values…  (' + searchShortcutLabel + ')';
    const shortcutsHint = applePlatform
      ? 'Using Command shortcuts for Apple devices. Your document, theme and layout are saved automatically.'
      : 'Using Ctrl shortcuts for Windows and Linux. Your document, theme and layout are saved automatically.';
    const appMeta = sanitizeAppMeta(S.appMeta);

    return {
      themeVars,
      isFormat: S.mode === 'format', isDiff: S.mode === 'diff', isSanitize: S.mode === 'sanitize',
      tabFormatStyle: seg(S.mode === 'format'), tabDiffStyle: seg(S.mode === 'diff'), tabSanitizeStyle: seg(S.mode === 'sanitize'),
      onFormat: () => this.setState({ mode: 'format' }), onDiff: () => this.setState({ mode: 'diff' }), onSanitize: () => this.setState({ mode: 'sanitize' }),
      dirAuroraStyle: Object.assign({}, seg(dir === 'aurora'), { color: styleTone.aurora }),
      dirSlateStyle: Object.assign({}, seg(dir === 'slate'), { color: styleTone.slate }),
      dirPaperStyle: Object.assign({}, seg(dir === 'paper'), { color: styleTone.paper }),
      onDirAurora: () => this.setState({ direction: 'aurora' }), onDirSlate: () => this.setState({ direction: 'slate' }), onDirPaper: () => this.setState({ direction: 'paper' }),
      onThemeToggle: () => this.setState({ theme: theme === 'dark' ? 'light' : 'dark' }),
      onThemeLight: () => this.setState({ theme: 'light' }),
      onThemeDark: () => this.setState({ theme: 'dark' }),
      themeLightStyle: segIcon(theme === 'light'),
      themeDarkStyle: segIcon(theme === 'dark'),
      rememberContentStyle: rememberToggleStyle(remember.content),
      rememberWorkspaceStyle: rememberToggleStyle(remember.workspace),
      rememberExplorerStyle: rememberToggleStyle(remember.explorer),
      rememberFindStyle: rememberToggleStyle(remember.find),
      rememberContentLabel: remember.content ? 'On' : 'Off',
      rememberWorkspaceLabel: remember.workspace ? 'On' : 'Off',
      rememberExplorerLabel: remember.explorer ? 'On' : 'Off',
      rememberFindLabel: remember.find ? 'On' : 'Off',
      onRememberContent: () => this.setState(s => ({ rememberPrefs: Object.assign({}, s.rememberPrefs, { content: !s.rememberPrefs.content }) })),
      onRememberWorkspace: () => this.setState(s => ({ rememberPrefs: Object.assign({}, s.rememberPrefs, { workspace: !s.rememberPrefs.workspace }) })),
      onRememberExplorer: () => this.setState(s => ({ rememberPrefs: Object.assign({}, s.rememberPrefs, { explorer: !s.rememberPrefs.explorer }) })),
      onRememberFind: () => this.setState(s => ({ rememberPrefs: Object.assign({}, s.rememberPrefs, { find: !s.rememberPrefs.find }) })),
      themeToggleTitle: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      themeIcon: theme === 'dark' ? (window.PAW_ICONS ? window.PAW_ICONS.moon() : null) : (window.PAW_ICONS ? window.PAW_ICONS.sun() : null),
      themeLabel: theme === 'dark' ? 'Dark' : 'Light', themeDotBg: theme === 'dark' ? tok.text : 'transparent',
      settingsMenuRef: this.settingsMenuRef,
      showSettings: S.showSettings,
      onToggleSettings: () => this.setState(s => ({ showSettings: !s.showSettings })),
      showAbout: S.showAbout,
      onToggleAbout: () => this.setState(s => ({ showAbout: !s.showAbout, showHelp: false, showSettings: false })),
      aboutAppName: appMeta.appName,
      aboutTagline: appMeta.tagline,
      aboutByline: appMeta.byline,
      aboutVersion: appMeta.version,
      aboutCopyright: appMeta.copyright,
      aboutFeedbackUrl: appMeta.feedbackUrl,
      formatGridClass, sourcePanelClass, explorerPanelClass,
      sourceFullscreenLabel: S.fullscreenPanel === 'source' ? 'Exit fullscreen' : 'Fullscreen',
      explorerFullscreenLabel: S.fullscreenPanel === 'explorer' ? 'Exit fullscreen' : 'Fullscreen',
      sourceFullscreenIcon: S.fullscreenPanel === 'source' ? (window.PAW_ICONS ? window.PAW_ICONS.collapse() : null) : (window.PAW_ICONS ? window.PAW_ICONS.expand() : null),
      explorerFullscreenIcon: S.fullscreenPanel === 'explorer' ? (window.PAW_ICONS ? window.PAW_ICONS.collapse() : null) : (window.PAW_ICONS ? window.PAW_ICONS.expand() : null),
      onSourceFullscreen: () => this.setState(s => ({ fullscreenPanel: s.fullscreenPanel === 'source' ? null : 'source' })),
      onExplorerFullscreen: () => this.setState(s => ({ fullscreenPanel: s.fullscreenPanel === 'explorer' ? null : 'explorer' })),
      onCopyExplorer: () => this.copy(explorerCopyPayloadText, '__explorer'),
      explorerSendMenuEl,
      explorerCopyTitle: (searchFilterActive || queryFilterActive) ? 'Copy filtered payload' : 'Copy payload',
      explorerCopyStyle: Object.assign({}, btnStyle, { width: '30px', minWidth: '30px', padding: '0', justifyContent: 'center' }),
      explorerActionsStyle: { display: 'inline-flex', alignItems: 'center', gap: '7px', marginLeft: 'auto', flex: '0 0 auto', flexWrap: 'nowrap' },
      tableModePathStyle: seg(tableMode === 'path'),
      tableModeRecordStyle: seg(tableMode === 'record'),
      onTableModePath: () => this.setState({ tableMode: 'path' }),
      onTableModeRecord: () => this.setState({ tableMode: 'record' }),
      logToolbarEl,
      onTableSourceRoot: () => this.selectTableSource(tableRootPath),

      btnStyle, fsBtnStyle, btnHover, btnGhost, navBtnStyle,
      formatBadge: parsed.format === 'empty' ? 'EMPTY' : parsed.format.toUpperCase(), badgeStyle,
      isTable, canReformatFormat: !isTable, // Beautify/Minify/Sort keys/Convert have no meaning for raw tabular text (dc-runtime's sc-if has no `!` operator, so negate here)
      input: S.input, onInput: (e) => {
        const val = e.target.value;
        // Keep the controlled textarea in sync on every keystroke so caret position stays stable.
        this.setState({ input: val });
        if (val.trim()) this.markSlotDirty('dig'); else this.unlinkSlot('dig');
        clearTimeout(this._docTimer);
        // Parse/explorer work remains debounced via docInput for large documents.
        this._docTimer = setTimeout(() => this.setState(s => (s.docInput === val ? null : { docInput: val })), 160);
      },
      onEditorScroll: (e) => this.syncEditorLayers(e.target),
      editorRef: this.editorRef, highlightRef: this.highlightRef, gutterRef: this.gutterRef, fileRef: this.fileRef, dropRef: this.dropRef, treeScrollRef: this.treeScrollRef,
      highlightEl, highlightStyle, gutterText, taStyle,
      gutterWrapStyle: { flex: '0 0 auto', width: showGutter ? '52px' : '0', overflow: 'hidden', borderRight: showGutter ? '1px solid ' + tok.border : 'none', background: tok.panel2, display: showGutter ? 'block' : 'none' },
      gutterTitle: S.softWrap ? 'Line numbers hidden while Wrap is on (they can’t stay aligned to wrapped text)' : '',
      indent: S.indent, onIndentChange: (e) => this.setState({ indent: e.target.value }),
      beautifyMenuRef: this.beautifyMenuRef,
      showBeautifyMenu: S.showBeautifyMenu,
      splitWrapStyle, splitMainStyle, splitToggleStyle, beautifyMenuStyle, beautifyItemStyle, beautifyItemHover,
      indentLabel: S.indent === 'tab' ? 'Tab' : (S.indent + ' spaces'),
      onBeautifyMain: () => { this.setState({ showBeautifyMenu: false }); this.reformat(false); },
      onBeautifyToggle: (e) => { e.stopPropagation(); this.setState(s => ({ showBeautifyMenu: !s.showBeautifyMenu })); },
      onBeautifyIndent2: () => this.setState({ indent: '2', showBeautifyMenu: false }, () => this.reformat(false)),
      onBeautifyIndent4: () => this.setState({ indent: '4', showBeautifyMenu: false }, () => this.reformat(false)),
      onBeautifyIndentTab: () => this.setState({ indent: 'tab', showBeautifyMenu: false }, () => this.reformat(false)),
      wrapLabel: S.softWrap ? 'Wrap: On' : 'Wrap: Off',
      tableHeaderRowLabel: (S.tableHasHeaderRow !== false) ? 'Header row: On' : 'Header row: Off',
      onToggleTableHeaderRow: () => this.setState(s => ({ tableHasHeaderRow: !(s.tableHasHeaderRow !== false) })),
      onToggleWrap: () => this.setState(s => ({ softWrap: !s.softWrap })),
      onBeautify: () => this.reformat(false), onMinify: () => this.reformat(true), onSort: () => this.sortKeys(),
      onConvert: () => this.convert(), convertLabel: isXml ? 'To JSON' : 'To XML',
      onUploadClick: () => this.fileRef.current && this.fileRef.current.click(),
      onUpload: (e) => { const f = e.target.files && e.target.files[0]; if (f) this.loadFile(f); e.target.value = ''; },
      onSample: () => { const v = isXml ? this.jsonToXml(JSON.parse(SAMPLE_JSON)) : SAMPLE_JSON; this.applyInput(v, { collapsed: new Set(), search: '', query: '', matchIndex: 0 }); this.unlinkSlot('dig'); },
      onCopySource: () => this.copy(S.input, '__src'), copyLabel: S.copied === '__src' ? 'Copied ✓' : 'Copy',
      sourceSendMenuEl,
      digLibraryMenuEl,
      onDownload: () => { const blob = new Blob([S.input], { type: isXml ? 'text/xml' : isTable ? 'text/csv' : 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'document.' + (isXml ? 'xml' : tableExt || 'json'); a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); },
      onClear: () => { this.applyInput('', { collapsed: new Set(), search: '', query: '' }); this.unlinkSlot('dig'); },
      onDragOver: (e) => { e.preventDefault(); if (!S.dragging) this.setState({ dragging: true }); },
      onDragLeave: (e) => { e.preventDefault(); this.setState({ dragging: false }); },
      onDrop: (e) => { e.preventDefault(); this.setState({ dragging: false }); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) this.loadFile(f); },
      dropOverlayStyle: { position: 'absolute', inset: 0, display: S.dragging ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', background: tok.accentWeak, border: '2px dashed ' + tok.accent, borderRadius: '8px', color: tok.accent, font: '700 15px/1 ' + tok.fontUi, pointerEvents: 'none', zIndex: 3, backdropFilter: 'blur(1px)' },

      onTreeScroll: (e) => { const top = e.target.scrollTop; if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = null; this.setState({ scrollTop: top }); }); },
      onShare: () => this.doShare(), shareLabel: S.shareMsg || 'Share link',
      onToggleHelp: () => this.setState(s => ({ showHelp: !s.showHelp, showAbout: false, showSettings: false })), showHelp: S.showHelp, stop: (e) => e.stopPropagation(),
      handoffConfirmOpen: !!S.handoffConfirm,
      handoffConfirmLabel: S.handoffConfirm ? S.handoffConfirm.label : '',
      handoffConfirmShowSaveFirst: !!(S.handoffConfirm && S.handoffConfirm.destDirty),
      onConfirmHandoff: () => this.confirmHandoff(),
      onConfirmHandoffSaveFirst: () => this.confirmHandoffSaveFirst(),
      onCancelHandoff: () => this.cancelHandoff(),

      // Payload Library — navbar button + global browser modal
      onOpenLibrary: () => this.openLibraryBrowser(null),
      onCloseLibrary: () => this.closeLibraryBrowser(),
      showLibrary: S.showLibrary,
      libraryFilter: S.libraryFilter,
      onLibraryFilterChange: (e) => this.setState({ libraryFilter: e.target.value }),
      libraryUsageText,
      libraryListEl,
      libraryError: S.libraryError,
      onDismissLibraryError: () => this.setState({ libraryError: null }),
      librarySaveAsPromptOpen: S.librarySaveAsPromptOpen,
      librarySaveAsName: S.librarySaveAsName,
      onLibrarySaveAsNameChange: (e) => this.setState({ librarySaveAsName: e.target.value.slice(0, LIBRARY_NAME_MAX_LEN) }),
      onConfirmLibrarySaveAs: () => this.confirmLibrarySaveAs(),
      onCancelLibrarySaveAs: () => this.cancelLibrarySaveAs(),
      libraryRenamePromptOpen: S.libraryRenamePromptOpen,
      libraryRenameName: S.libraryRenameName,
      onLibraryRenameNameChange: (e) => this.setState({ libraryRenameName: e.target.value.slice(0, LIBRARY_NAME_MAX_LEN) }),
      onConfirmLibraryRename: () => this.confirmLibraryRename(),
      onCancelLibraryRename: () => this.cancelLibraryRename(),

      statusBarStyle: { display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderTop: '1px solid ' + tok.border, background: hasError ? tok.sem.errW : (parsed.ok ? tok.sem.okW : tok.panel2) },
      statusText, statusColor, statusDot, statusDotHalo, hasError, errorLine,
      onJumpError: () => { const ta = this.editorRef.current; if (ta && errorLine) { const line = errorLine; const upto = S.input.split('\n').slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0); ta.focus(); ta.setSelectionRange(upto, upto); const lh = 20; ta.scrollTop = Math.max(0, (line - 3) * lh); if (this.highlightRef.current) this.highlightRef.current.scrollTop = ta.scrollTop; if (this.gutterRef.current) this.gutterRef.current.scrollTop = ta.scrollTop; } },

      view: S.view, isTreeView: S.view === 'tree', isTableView: S.view === 'table', viewTreeStyle: segFlat(S.view === 'tree'), viewRawStyle: segFlat(S.view === 'raw'), viewTableStyle: segFlat(S.view === 'table'),
      onViewTree: () => this.setState({ view: 'tree' }), onViewRaw: () => this.setState({ view: 'raw' }), onViewTable: () => this.setState({ view: 'table' }),
      onExpandAll: () => this.setState({ collapsed: new Set() }),
      onCollapseAll: () => this.setState({ collapsed: new Set(this.allContainerPaths(node).filter(p => p !== '/root' && node && p !== node.path)) }),

      search: S.search, onSearch: (e) => this.setState({ search: e.target.value, matchIndex: 0 }), hasSearch: !!savedTerm,
      modifierKeyLabel, searchPlaceholder, shortcutsHint,
      onClearSearch: () => this.setState({ search: '', matchIndex: 0 }),
      matchLabel, onPrevMatch: () => this.setState(s => ({ matchIndex: s.matchIndex - 1 })), onNextMatch: () => this.setState(s => ({ matchIndex: s.matchIndex + 1 })),
      searchMode: S.searchMode, modeHiStyle: seg(S.searchMode === 'highlight'), modeFilStyle: seg(S.searchMode === 'filter'),
      onModeHighlight: () => this.setState({ searchMode: 'highlight' }), onModeFilter: () => this.setState({ searchMode: 'filter' }),
      explorerMode: S.explorerMode, isSearchToolbarMode: S.explorerMode === 'search', isQueryToolbarMode: S.explorerMode === 'query',
      toolbarSearchStyle: seg(S.explorerMode === 'search'), toolbarQueryStyle: seg(S.explorerMode === 'query'),
      onToolbarSearchMode: () => this.setState({ explorerMode: 'search' }), onToolbarQueryMode: () => this.setState({ explorerMode: 'query', queryDrawerCollapsed: false }),

      query: S.query, onQuery: (e) => this.setState({ query: e.target.value, queryDrawerCollapsed: false }), hasQuery: !!savedQuery,
      queryPrefix: isXml ? 'XPath' : '$', queryPlaceholder: isXml ? "//departments[id='d2']  or  //title" : "$.store.departments[*].title",
      queryStat, queryStatStyle: { font: '600 11px/1 ' + tok.fontMono, color: queryStatOk ? tok.textDim : tok.sem.err, whiteSpace: 'nowrap' },
      onClearQuery: () => this.setState({ query: '', queryDrawerCollapsed: false }),

      explorerEl, statsEl,

      diffA: S.diffA, diffB: S.diffB,
      onDiffAChange: (e) => this.updateDiffSlot('spotA', e.target.value), onDiffBChange: (e) => this.updateDiffSlot('spotB', e.target.value),
      onDiffAClear: () => { this.setState({ diffA: '' }); this.unlinkSlot('spotA'); }, onDiffBClear: () => { this.setState({ diffB: '' }); this.unlinkSlot('spotB'); },
      onDiffBeautify: () => { const nb = t => { const p = this.parse(t); return p.ok && p.format === 'json' ? JSON.stringify(p.value, null, 2) : (p.ok && p.format === 'xml' ? this.prettyXml(p.doc) : t); }; this.setState({ diffA: nb(S.diffA), diffB: nb(S.diffB) }); },
      onDiffSwap: () => this.setState(prevState => ({ diffA: prevState.diffB, diffB: prevState.diffA })),
      onDiffSample: () => { this.setState({ diffA: SAMPLE_DIFF_A, diffB: SAMPLE_DIFF_B }); this.unlinkSlot('spotA'); this.unlinkSlot('spotB'); },
      diffBothTable: diff.bothTable,
      diffAlignTitle: 'Diff by a guessed key column (sys_id, correlation_id, ...) instead of line order, so reordered/paged exports still diff sensibly',
      diffAlignBtnStyle: Object.assign({}, btnStyle, S.diffAlignByKey ? { color: tok.accent, borderColor: tok.accent, background: tok.accentWeak } : {}),
      onDiffToggleAlign: () => this.setState(s => ({ diffAlignByKey: !s.diffAlignByKey })),
      diffNoiseBtnStyle: Object.assign({}, btnStyle, S.diffSuppressNoise ? { color: tok.accent, borderColor: tok.accent, background: tok.accentWeak } : {}),
      onDiffToggleNoise: () => this.setState(s => ({ diffSuppressNoise: !s.diffSuppressNoise })),
      diffEl: diff.el, diffSummary, diffSummaryStyle,
      diffWrapClass, diffPanelAClass, diffPanelBClass, diffPanelResultClass,
      diffResultRef: this.diffResultRef,
      diffMinimapEl,
      diffASendMenuEl, diffBSendMenuEl,
      spotALibraryMenuEl, spotBLibraryMenuEl,
      diffAFileRef: this.diffAFileRef, diffBFileRef: this.diffBFileRef,
      onDiffAUploadClick: () => this.diffAFileRef.current && this.diffAFileRef.current.click(),
      onDiffBUploadClick: () => this.diffBFileRef.current && this.diffBFileRef.current.click(),
      onDiffAUpload: (e) => { const f = e.target.files && e.target.files[0]; if (f) this.loadFileIntoSlot(f, 'spotA'); e.target.value = ''; },
      onDiffBUpload: (e) => { const f = e.target.files && e.target.files[0]; if (f) this.loadFileIntoSlot(f, 'spotB'); e.target.value = ''; },
      diffADropRef: this.diffADropRef, diffBDropRef: this.diffBDropRef,
      onDiffADragOver: (e) => { e.preventDefault(); if (!S.draggingSpotA) this.setState({ draggingSpotA: true }); },
      onDiffADragLeave: (e) => { e.preventDefault(); this.setState({ draggingSpotA: false }); },
      onDiffADrop: (e) => { e.preventDefault(); this.setState({ draggingSpotA: false }); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) this.loadFileIntoSlot(f, 'spotA'); },
      onDiffBDragOver: (e) => { e.preventDefault(); if (!S.draggingSpotB) this.setState({ draggingSpotB: true }); },
      onDiffBDragLeave: (e) => { e.preventDefault(); this.setState({ draggingSpotB: false }); },
      onDiffBDrop: (e) => { e.preventDefault(); this.setState({ draggingSpotB: false }); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) this.loadFileIntoSlot(f, 'spotB'); },
      diffADropOverlayStyle: { position: 'absolute', inset: 0, display: S.draggingSpotA ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', background: tok.accentWeak, border: '2px dashed ' + tok.accent, borderRadius: '8px', color: tok.accent, font: '700 15px/1 ' + tok.fontUi, pointerEvents: 'none', zIndex: 3, backdropFilter: 'blur(1px)' },
      diffBDropOverlayStyle: { position: 'absolute', inset: 0, display: S.draggingSpotB ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', background: tok.accentWeak, border: '2px dashed ' + tok.accent, borderRadius: '8px', color: tok.accent, font: '700 15px/1 ' + tok.fontUi, pointerEvents: 'none', zIndex: 3, backdropFilter: 'blur(1px)' },
      diffAFullscreenLabel: S.diffFullscreenPanel === 'a' ? 'Exit fullscreen' : 'Fullscreen',
      diffBFullscreenLabel: S.diffFullscreenPanel === 'b' ? 'Exit fullscreen' : 'Fullscreen',
      diffResultFullscreenLabel: S.diffFullscreenPanel === 'result' ? 'Exit fullscreen' : 'Fullscreen',
      diffAFullscreenIcon: S.diffFullscreenPanel === 'a' ? (window.PAW_ICONS ? window.PAW_ICONS.collapse() : null) : (window.PAW_ICONS ? window.PAW_ICONS.expand() : null),
      diffBFullscreenIcon: S.diffFullscreenPanel === 'b' ? (window.PAW_ICONS ? window.PAW_ICONS.collapse() : null) : (window.PAW_ICONS ? window.PAW_ICONS.expand() : null),
      diffResultFullscreenIcon: S.diffFullscreenPanel === 'result' ? (window.PAW_ICONS ? window.PAW_ICONS.collapse() : null) : (window.PAW_ICONS ? window.PAW_ICONS.expand() : null),
      onDiffAFullscreen: () => this.setState(s => ({ diffFullscreenPanel: s.diffFullscreenPanel === 'a' ? null : 'a' })),
      onDiffBFullscreen: () => this.setState(s => ({ diffFullscreenPanel: s.diffFullscreenPanel === 'b' ? null : 'b' })),
      onDiffResultFullscreen: () => this.setState(s => ({ diffFullscreenPanel: s.diffFullscreenPanel === 'result' ? null : 'result' })),

      // sanitize
      sanitizeInput: S.sanitizeInput,
      onSanitizeInput: (e) => { const val = e.target.value; this.setSanitizeInput(val); if (val.trim()) this.markSlotDirty('bury'); else this.unlinkSlot('bury'); },
      onSanitizeMouseUp: (e) => {
        const start = e.target.selectionStart, end = e.target.selectionEnd;
        this.setState({ sanitizeSelection: (start !== end) ? { start, end } : null });
      },
      sanitizeInputEditorRef: this.sanitizeInputEditorRef,
      sanitizeInputHighlightRef: this.sanitizeInputHighlightRef,
      sanitizeInputHighlightEl,
      sanitizeInputTaStyle,
      sanitizeOutputEditorRef: this.sanitizeOutputEditorRef,
      sanitizeOutputHighlightRef: this.sanitizeOutputHighlightRef,
      sanitizeOutputHighlightEl,
      sanitizeOutputTaStyle,
      sanitizeHighlightStyle,
      sanitizeGridClass, sanitizeInputPanelClass, sanitizeOutputPanelClass,
      sanitizeInputSendMenuEl, sanitizeOutputSendMenuEl,
      buryLibraryMenuEl,
      buryFileRef: this.buryFileRef,
      onBuryUploadClick: () => this.buryFileRef.current && this.buryFileRef.current.click(),
      onBuryUpload: (e) => { const f = e.target.files && e.target.files[0]; if (f) this.loadFileIntoSlot(f, 'bury'); e.target.value = ''; },
      buryDropRef: this.buryDropRef,
      onBuryDragOver: (e) => { e.preventDefault(); if (!S.draggingBury) this.setState({ draggingBury: true }); },
      onBuryDragLeave: (e) => { e.preventDefault(); this.setState({ draggingBury: false }); },
      onBuryDrop: (e) => { e.preventDefault(); this.setState({ draggingBury: false }); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) this.loadFileIntoSlot(f, 'bury'); },
      buryDropOverlayStyle: { position: 'absolute', inset: 0, display: S.draggingBury ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', background: tok.accentWeak, border: '2px dashed ' + tok.accent, borderRadius: '8px', color: tok.accent, font: '700 15px/1 ' + tok.fontUi, pointerEvents: 'none', zIndex: 3, backdropFilter: 'blur(1px)' },
      sanitizeInputFullscreenLabel: S.sanitizeFullscreenPanel === 'input' ? 'Exit fullscreen' : 'Fullscreen',
      sanitizeOutputFullscreenLabel: S.sanitizeFullscreenPanel === 'output' ? 'Exit fullscreen' : 'Fullscreen',
      sanitizeInputFullscreenIcon: S.sanitizeFullscreenPanel === 'input' ? (window.PAW_ICONS ? window.PAW_ICONS.collapse() : null) : (window.PAW_ICONS ? window.PAW_ICONS.expand() : null),
      sanitizeOutputFullscreenIcon: S.sanitizeFullscreenPanel === 'output' ? (window.PAW_ICONS ? window.PAW_ICONS.collapse() : null) : (window.PAW_ICONS ? window.PAW_ICONS.expand() : null),
      onSanitizeInputFullscreen: () => this.setState(s => ({ sanitizeFullscreenPanel: s.sanitizeFullscreenPanel === 'input' ? null : 'input' })),
      onSanitizeOutputFullscreen: () => this.setState(s => ({ sanitizeFullscreenPanel: s.sanitizeFullscreenPanel === 'output' ? null : 'output' })),
      onSanitizeInputScroll: (e) => { this.syncLayers(this.sanitizeInputEditorRef, this.sanitizeInputHighlightRef, null, e.target); this.syncSanitizePanes(e.target); },
      onSanitizeOutputScroll: (e) => { this.syncLayers(this.sanitizeOutputEditorRef, this.sanitizeOutputHighlightRef, null, e.target); this.syncSanitizePanes(e.target); },
      sanitizeScrollLock: S.sanitizeScrollLock,
      onToggleSanitizeScrollLock: () => this.setState(s => ({ sanitizeScrollLock: !s.sanitizeScrollLock })),
      sanitizeScrollLockLabel: S.sanitizeScrollLock ? 'Scroll: Locked' : 'Scroll: Unlocked',
      sanitizeScrollLockIcon: window.PAW_ICONS ? (S.sanitizeScrollLock ? window.PAW_ICONS.lock() : window.PAW_ICONS.unlock()) : null,
      sanitizeHasSelection: !!S.sanitizeSelection,
      onSanitizeMarkRedact: () => this.markSanitizeSelectionRedact(),
      sanitizeMarkBtnStyle: S.sanitizeSelection ? btnStyle : Object.assign({}, btnStyle, { opacity: .45, cursor: 'default' }),
      onSanitizeAutoDetect: () => this.startAutoDetectSanitizeRule(),
      sanitizeAutoDetectBtnStyle: S.sanitizeSelection ? btnStyle : Object.assign({}, btnStyle, { opacity: .45, cursor: 'default' }),
      sanitizeAutoDetectNotice: S.sanitizeAutoDetectNotice,
      onDismissSanitizeAutoDetectNotice: () => this.setState({ sanitizeAutoDetectNotice: null }),
      sanitizeSaveManualToggleStyle: rememberToggleStyle(S.sanitizeSaveManualAsRule),
      sanitizeSaveManualLabel: S.sanitizeSaveManualAsRule ? 'On' : 'Off',
      onSanitizeToggleSaveManual: () => this.setState(s => ({ sanitizeSaveManualAsRule: !s.sanitizeSaveManualAsRule })),
      onSanitizeSample: () => { this.setSanitizeInput(SAMPLE_SANITIZE); this.unlinkSlot('bury'); },
      onSanitizeClear: () => { this.setSanitizeInput(''); this.unlinkSlot('bury'); },
      onSanitizeInputClear: () => { this.setSanitizeInput(''); this.unlinkSlot('bury'); },
      sanitizeProfileSelectorEl,
      sanitizeOutput,
      onCopySanitizeOutput: () => this.copy(sanitizeOutput, '__sanitize'),
      sanitizeCopyLabel: S.copied === '__sanitize' ? 'Copied ✓' : 'Copy',
      sanitizeMatchesEl,
      sanitizeMatchCount: sanitizeMatches.length,
      sanitizeMappedCount: this.getSanitizeMapping().map.size,
      onClearSanitizeMappings: () => this.onClearSanitizeMappings(),
      showSanitizeRules: S.showSanitizeRules,
      onToggleSanitizeRules: () => this.setState(s => ({ showSanitizeRules: !s.showSanitizeRules })),
      sanitizeRulesPanelEl,
      sanitizeFileRef: this.sanitizeFileRef,
      onSanitizeImportClick: () => this.sanitizeFileRef.current && this.sanitizeFileRef.current.click(),
      onSanitizeImport: (e) => { const f = e.target.files && e.target.files[0]; if (f) this.importSanitizeRulesetFile(f); e.target.value = ''; },
      onSanitizeExport: () => this.openSanitizeExportPrompt(),
      onResetSanitizeRules: () => this.resetSanitizeRuleOverrides(),
      sanitizeRulesImportError: S.sanitizeRulesImportError,
      sanitizeExportPromptOpen: S.sanitizeExportPromptOpen,
      sanitizeExportName: S.sanitizeExportName,
      onSanitizeExportNameChange: (e) => this.setState({ sanitizeExportName: e.target.value }),
      onConfirmSanitizeExport: () => this.confirmSanitizeExport(),
      onCancelSanitizeExport: () => this.cancelSanitizeExportPrompt(),
      sanitizeFormatBadge: sanitizeRun.format === 'empty' ? 'EMPTY' : String(sanitizeRun.format).toUpperCase(),

      // Icon React elements (from js/icons.js via window.PAW_ICONS)
      ...(window.PAW_ICONS ? (function(ic) { return {
        iconSun: ic.sun(),
        iconMoon: ic.moon(),
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
        iconSettings: ic.settings(),
        iconInfo: ic.info(),
        iconFolder: ic.folder(),
        iconSave: ic.save(),
      }; })(window.PAW_ICONS) : {}),
    };
  }
}
