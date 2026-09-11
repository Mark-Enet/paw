// js/sanitize-rules-default.js — default rule profiles for PAW Sanitize.
// Git-tracked, hand-editable data (per docs/features/paw-sanitize-design.md).
// A localStorage override layer (see js/sanitize.js) layers user customizations
// on top of this without editing this file.
//
// Rule shape:
//   KeyRule:     { id, label, type:'key',     match, matchMode:'wildcard'|'regex', generator }
//   PatternRule: { id, label, type:'pattern', pattern (regex source, no flags, no ^/$ anchors —
//                  matched against a whole leaf value with anchors added, and unanchored
//                  with /g during the freeform line-scan pass), generator }

(function () {
  window.PAW_SANITIZE_DEFAULT_RULES = {
    profiles: [
      {
        id: 'servicenow',
        name: 'ServiceNow',
        keyRules: [
          { id: 'sn-sys-id', label: 'sys_id', type: 'key', match: '*sys_id*', matchMode: 'wildcard', generator: 'hex32' },
          { id: 'sn-caller-id', label: 'caller_id', type: 'key', match: 'caller_id', matchMode: 'wildcard', generator: 'hex32' },
          { id: 'sn-opened-by', label: 'opened_by', type: 'key', match: 'opened_by', matchMode: 'wildcard', generator: 'name' },
          { id: 'sn-assigned-to', label: 'assigned_to', type: 'key', match: 'assigned_to', matchMode: 'wildcard', generator: 'name' },
          { id: 'sn-u-phone', label: 'u_phone', type: 'key', match: 'u_phone', matchMode: 'wildcard', generator: 'phone' },
          { id: 'sn-phone', label: '*phone*', type: 'key', match: '*phone*', matchMode: 'wildcard', generator: 'phone' },
          { id: 'sn-email', label: '*email*', type: 'key', match: '*email*', matchMode: 'wildcard', generator: 'email' },
          { id: 'sn-name', label: '*name*', type: 'key', match: '*name*', matchMode: 'wildcard', generator: 'name' },
          { id: 'sn-user-name', label: 'user_name', type: 'key', match: 'user_name', matchMode: 'wildcard', generator: 'name' },
          { id: 'sn-number', label: 'number', type: 'key', match: 'number', matchMode: 'wildcard', generator: 'numericId' },
          { id: 'sn-account', label: 'account', type: 'key', match: 'account', matchMode: 'wildcard', generator: 'companyName' },
          { id: 'sn-customer-account', label: 'customer_account', type: 'key', match: 'customer_account', matchMode: 'wildcard', generator: 'companyName' },
          { id: 'sn-company', label: 'company', type: 'key', match: 'company', matchMode: 'wildcard', generator: 'companyName' },
          { id: 'sn-contact', label: 'contact', type: 'key', match: 'contact', matchMode: 'wildcard', generator: 'name' },
          { id: 'sn-serial-number', label: 'serial_number', type: 'key', match: 'serial_number', matchMode: 'wildcard', generator: 'generic' },
          // Log-table fields (syslog, script log statements, transaction
          // logs — e.g. rows copied from a ServiceNow list view). Matched
          // against a CSV/TSV/Markdown-table column header the same way
          // the fields above match a JSON key. See
          // docs/features/paw-log-features-design.md.
          { id: 'sn-transaction-id', label: 'transaction_id', type: 'key', match: '*transaction_id*', matchMode: 'wildcard', generator: 'hex32' },
          { id: 'sn-session-id', label: 'session_id', type: 'key', match: '*session_id*', matchMode: 'wildcard', generator: 'hex32' },
        ],
        patternRules: [
          { id: 'pat-hex32', label: '32-char hex (sys_id shape)', type: 'pattern', pattern: '\\b[0-9a-fA-F]{32}\\b', generator: 'hex32' },
          { id: 'pat-guid', label: 'GUID', type: 'pattern', pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', generator: 'guid' },
          { id: 'pat-email', label: 'Email', type: 'pattern', pattern: '[\\w.+-]+@[\\w-]+\\.[A-Za-z]{2,}', generator: 'email' },
          { id: 'pat-phone', label: 'Phone', type: 'pattern', pattern: '\\+?1?[\\s.-]?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b', generator: 'phone' },
          { id: 'pat-ipv4', label: 'IPv4', type: 'pattern', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b', generator: 'ipv4' },
          { id: 'pat-ssn', label: 'SSN', type: 'pattern', pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', generator: 'ssn' },
          { id: 'pat-cc', label: 'Credit card', type: 'pattern', pattern: '\\b(?:\\d[ -]?){15,16}\\b', generator: 'creditCard' },
        ],
      },
      {
        id: 'generic',
        name: 'Generic',
        keyRules: [
          { id: 'gen-email-key', label: '*email*', type: 'key', match: '*email*', matchMode: 'wildcard', generator: 'email' },
          { id: 'gen-phone-key', label: '*phone*', type: 'key', match: '*phone*', matchMode: 'wildcard', generator: 'phone' },
          { id: 'gen-name-key', label: '*name*', type: 'key', match: '*name*', matchMode: 'wildcard', generator: 'name' },
        ],
        patternRules: [
          { id: 'gen-pat-email', label: 'Email', type: 'pattern', pattern: '[\\w.+-]+@[\\w-]+\\.[A-Za-z]{2,}', generator: 'email' },
          { id: 'gen-pat-phone', label: 'Phone', type: 'pattern', pattern: '\\+?1?[\\s.-]?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b', generator: 'phone' },
          { id: 'gen-pat-ipv4', label: 'IPv4', type: 'pattern', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b', generator: 'ipv4' },
          { id: 'gen-pat-ssn', label: 'SSN', type: 'pattern', pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b', generator: 'ssn' },
          { id: 'gen-pat-cc', label: 'Credit card', type: 'pattern', pattern: '\\b(?:\\d[ -]?){15,16}\\b', generator: 'creditCard' },
          { id: 'gen-pat-guid', label: 'GUID', type: 'pattern', pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', generator: 'guid' },
        ],
      },
    ],
  };
})();
