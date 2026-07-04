// js/icons.js — SVG icon library for PAW (Payload Analysis Wingman)
// All icons use currentColor for automatic theme-awareness.
// Icons are returned as React elements via lazy factory functions so that
// React.createElement is only called after React has been loaded by dc-runtime.
//
// Usage in app.js:
//   const icons = window.PAW_ICONS;
//   // then expose e.g. iconSun: icons.sun() in the render return object
//
// The same SVG paths are also inlined in the <x-dc> HTML template in index.html
// for any spots that cannot be reached via {{ }} interpolation (e.g. the logo).

(function () {
  var COMMON = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  /**
   * ic(inner, w, h, extraStyle?)
   * Returns a React element for a 14×14 (default) SVG icon.
   * `inner` is the raw SVG children markup injected via dangerouslySetInnerHTML.
   * `extraStyle` is an optional CSS string applied to the <svg> element.
   */
  function ic(inner, w, h, extraStyle) {
    var attrs = Object.assign({}, COMMON, {
      width: w || 14,
      height: h || 14,
      viewBox: '0 0 14 14',
      dangerouslySetInnerHTML: { __html: inner },
    });
    if (extraStyle) {
      attrs.style = extraStyle.split(';').reduce(function (out, decl) {
        var i = decl.indexOf(':');
        if (i < 0) return out;
        var key = decl.slice(0, i).trim();
        if (!key) return out;
        var camel = key.indexOf('--') === 0 ? key : key.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
        out[camel] = decl.slice(i + 1).trim();
        return out;
      }, {});
    }
    return React.createElement('svg', attrs);
  }

  window.PAW_ICONS = {
    // Theme-toggle: sun / rays
    sun: function () {
      return ic(
        '<circle cx="7" cy="7" r="2.5"/>' +
        '<line x1="7" y1="1.5" x2="7" y2="2.5"/>' +
        '<line x1="7" y1="11.5" x2="7" y2="12.5"/>' +
        '<line x1="1.5" y1="7" x2="2.5" y2="7"/>' +
        '<line x1="11.5" y1="7" x2="12.5" y2="7"/>' +
        '<line x1="3" y1="3" x2="3.7" y2="3.7"/>' +
        '<line x1="10.3" y1="10.3" x2="11" y2="11"/>' +
        '<line x1="11" y1="3" x2="10.3" y2="3.7"/>' +
        '<line x1="3.7" y1="10.3" x2="3" y2="11"/>',
        13, 13
      );
    },

    // Beautify / magic wand with sparkle
    wand: function () {
      return ic(
        '<line x1="2" y1="12" x2="9" y2="5"/>' +
        '<path d="M8 2l.5 1.5 1.5.5-1.5.5L8 6l-.5-1.5L6 4l1.5-.5z"/>'
      );
    },

    // Minify / compress
    minify: function () {
      return ic(
        '<path d="M2 3.5l3 3.5-3 3.5"/>' +
        '<line x1="7" y1="10" x2="12" y2="10"/>' +
        '<line x1="7" y1="7" x2="11" y2="7"/>' +
        '<line x1="7" y1="4" x2="10" y2="4"/>'
      );
    },

    // Sort keys ascending
    sortKeys: function () {
      return ic(
        '<line x1="2" y1="4" x2="8" y2="4"/>' +
        '<line x1="2" y1="7" x2="7" y2="7"/>' +
        '<line x1="2" y1="10" x2="6" y2="10"/>' +
        '<path d="M11 2.5V11m-2-2l2 2 2-2"/>'
      );
    },

    // Swap / convert arrows
    swap: function () {
      return ic(
        '<path d="M3 4.5h8M9 2.5l2 2-2 2"/>' +
        '<path d="M11 9.5H3m2 2-2-2 2-2"/>'
      );
    },

    // Upload / arrow-up from baseline
    upload: function () {
      return ic(
        '<path d="M7 9V3M4.5 5.5 7 3l2.5 2.5"/>' +
        '<line x1="2" y1="12" x2="12" y2="12"/>'
      );
    },

    // File document
    fileDoc: function () {
      return ic(
        '<path d="M8 2H4a1 1 0 00-1 1v8a1 1 0 001 1h6a1 1 0 001-1V5z"/>' +
        '<path d="M8 2v3h3"/>'
      );
    },

    // Copy to clipboard
    copy: function () {
      return ic(
        '<rect x="5" y="5" width="7" height="7" rx="1.5"/>' +
        '<path d="M9 5V3.5A1.5 1.5 0 007.5 2H3.5A1.5 1.5 0 002 3.5v4A1.5 1.5 0 003.5 9H5"/>'
      );
    },

    // Share / network nodes
    share: function () {
      return ic(
        '<circle cx="11" cy="3" r="1.5"/>' +
        '<circle cx="3" cy="7" r="1.5"/>' +
        '<circle cx="11" cy="11" r="1.5"/>' +
        '<line x1="4.4" y1="6.2" x2="9.6" y2="4"/>' +
        '<line x1="4.4" y1="7.8" x2="9.6" y2="10"/>'
      );
    },

    // Download / arrow-down to baseline
    download: function () {
      return ic(
        '<path d="M7 3v6M4.5 6.5 7 9l2.5-2.5"/>' +
        '<line x1="2" y1="12" x2="12" y2="12"/>'
      );
    },

    // Trash / delete
    trash: function () {
      return ic(
        '<polyline points="2,4 12,4"/>' +
        '<path d="M5 4V2.5h4V4"/>' +
        '<path d="M3.5 4l.6 7.2a1 1 0 001 .8h3.8a1 1 0 001-.8l.6-7.2"/>'
      );
    },

    // Tree / branch diagram  (13×13, inline style for alignment)
    tree: function () {
      return ic(
        '<circle cx="7" cy="2.5" r="1.5"/>' +
        '<circle cx="3" cy="10" r="1.5"/>' +
        '<circle cx="11" cy="10" r="1.5"/>' +
        '<line x1="7" y1="4" x2="7" y2="6.5"/>' +
        '<path d="M7 6.5L3 8.5M7 6.5L11 8.5"/>',
        13, 13, 'vertical-align:text-bottom;margin-right:3px'
      );
    },

    // Table / grid  (13×13, inline style for alignment)
    table: function () {
      return ic(
        '<rect x="2" y="2.5" width="10" height="9" rx="1"/>' +
        '<line x1="2" y1="5.5" x2="12" y2="5.5"/>' +
        '<line x1="5.3" y1="2.5" x2="5.3" y2="11.5"/>' +
        '<line x1="8.7" y1="2.5" x2="8.7" y2="11.5"/>',
        13, 13, 'vertical-align:text-bottom;margin-right:3px'
      );
    },

    // Code / raw  (13×13, inline style for alignment)
    code: function () {
      return ic(
        '<path d="M5 4L2 7l3 3"/>' +
        '<path d="M9 4l3 3-3 3"/>' +
        '<line x1="7.5" y1="3.5" x2="6.5" y2="10.5"/>',
        13, 13, 'vertical-align:text-bottom;margin-right:3px'
      );
    },

    // Expand all corners
    expand: function () {
      return ic(
        '<path d="M2 2h4M2 2v4"/>' +
        '<path d="M12 2h-4m4 0v4"/>' +
        '<path d="M2 12h4m-4 0v-4"/>' +
        '<path d="M12 12h-4m4 0v-4"/>'
      );
    },

    // Collapse all corners
    collapse: function () {
      return ic(
        '<path d="M6 2v4H2"/>' +
        '<path d="M8 2v4h4"/>' +
        '<path d="M6 12v-4H2"/>' +
        '<path d="M8 12v-4h4"/>'
      );
    },

    // Pencil / highlight  (13×13, inline style for alignment)
    pencil: function () {
      return ic(
        '<path d="M3 10.5l2-2 4-4 2 2-4 4-2 2-2.5.5z"/>' +
        '<line x1="8" y1="3.5" x2="10.5" y2="6"/>' +
        '<line x1="2" y1="12.5" x2="6" y2="12.5"/>',
        13, 13, 'vertical-align:text-bottom;margin-right:3px'
      );
    },

    // Filter funnel  (13×13, inline style for alignment)
    filter: function () {
      return ic(
        '<path d="M2 3h10l-4 5v3.5l-2-1V8z"/>',
        13, 13, 'vertical-align:text-bottom;margin-right:3px'
      );
    },

    // Diff file / two overlapping documents
    diffFile: function () {
      return ic(
        '<path d="M6.5 2H3a1 1 0 00-1 1v8a1 1 0 001 1h5a1 1 0 001-1V4.5z"/>' +
        '<path d="M6.5 2v2.5H9"/>' +
        '<path d="M9 5h2a1 1 0 011 1v6"/>'
      );
    },
  };
})();
