// ================================================================
// LENLU SC FORGE v5.0 — NEW FEATURES SCRIPT
// Append this to your main JS file or include as <script src="forge-new.js">
// ================================================================

'use strict';

// ================================================================
// 1. ENHANCED THEME SYSTEM — Save & auto-load on startup
// ================================================================
function loadTheme() {
  const saved = localStorage.getItem('lenlu_theme4') || 'cyber';
  document.documentElement.setAttribute('data-theme', saved);
  const lbl = document.getElementById('themeToggleLabel');
  if (lbl) lbl.textContent = saved === 'cyber' ? 'Skeuomorph' : 'Cyber';
  const icon = document.querySelector('#themeToggleBtn .ttb-icon i');
  if (icon) icon.className = saved === 'cyber' ? 'fas fa-palette' : 'fas fa-bolt';
}
window.loadTheme = loadTheme;

// ================================================================
// 2. PASSWORD GENERATOR — Cryptographically secure
// ================================================================
window.generatePasswords = function () {
  const len = parseInt(document.getElementById('pwdLength')?.value) || 20;
  const useUpper = document.getElementById('pwdUpper')?.checked;
  const useLower = document.getElementById('pwdLower')?.checked;
  const useNums = document.getElementById('pwdNums')?.checked;
  const useSyms = document.getElementById('pwdSyms')?.checked;
  const count = parseInt(document.getElementById('pwdCount')?.value) || 5;

  let charset = '';
  if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (useNums) charset += '0123456789';
  if (useSyms) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!charset) { charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; }

  const results = document.getElementById('pwdResults');
  if (!results) return;
  results.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    const pwd = Array.from(arr).map(v => charset[v % charset.length]).join('');

    const entropy = Math.floor(len * Math.log2(charset.length));
    const strength = entropy < 40 ? 'WEAK' : entropy < 60 ? 'FAIR' : entropy < 80 ? 'GOOD' : 'STRONG';
    const color = entropy < 40 ? 'var(--red)' : entropy < 60 ? 'var(--amber)' : entropy < 80 ? 'var(--cyan)' : 'var(--g)';

    const row = document.createElement('div');
    row.className = 'vault-item flex items-center justify-between';
    row.innerHTML = `
      <code style="flex:1;font-size:.72rem;word-break:break-all;color:var(--white)">${pwd}</code>
      <div class="flex gap-xs items-center" style="margin-left:.5rem;flex-shrink:0">
        <span style="font-family:var(--font-hud);font-size:.56rem;color:${color}">${strength}</span>
        <span class="text-muted text-xs">${entropy}b</span>
        <button class="btn btn-ghost btn-xs" onclick="copyText('${pwd}','Password copied')"><i class="fas fa-copy"></i></button>
      </div>`;
    results.appendChild(row);
  }

  if (typeof toast === 'function') toast(`${count} passwords generated`, 'ok');
};

window.copyPwd = function (text) { copyText(text, 'Password copied'); };

// ================================================================
// 3. JSON FORMATTER — Pretty print, minify, validate, diff
// ================================================================
window.formatJSON = function () {
  const input = document.getElementById('jsonInput')?.value || '';
  const output = document.getElementById('jsonOutput');
  const status = document.getElementById('jsonStatus');
  if (!output || !input.trim()) return;

  try {
    const parsed = JSON.parse(input);
    const indent = parseInt(document.getElementById('jsonIndent')?.value) || 2;
    const pretty = JSON.stringify(parsed, null, indent);
    output.textContent = pretty;
    if (status) {
      status.textContent = `✓ Valid JSON — ${Object.keys(parsed).length || (Array.isArray(parsed) ? parsed.length : 0)} keys, ${pretty.length} chars`;
      status.style.color = 'var(--g)';
    }
    if (typeof toast === 'function') toast('JSON formatted', 'ok');
  } catch (e) {
    if (status) {
      status.textContent = `✗ Parse Error: ${e.message}`;
      status.style.color = 'var(--red)';
    }
    if (typeof toast === 'function') toast('Invalid JSON: ' + e.message, 'err');
  }
};

window.minifyJSON = function () {
  const input = document.getElementById('jsonInput')?.value || '';
  const output = document.getElementById('jsonOutput');
  if (!output || !input.trim()) return;
  try {
    output.textContent = JSON.stringify(JSON.parse(input));
    if (typeof toast === 'function') toast('JSON minified', 'ok');
  } catch (e) {
    if (typeof toast === 'function') toast('Invalid JSON', 'err');
  }
};

window.copyJSON = function () {
  const out = document.getElementById('jsonOutput')?.textContent || '';
  if (out) copyText(out, 'JSON copied');
};

// ================================================================
// 4. REGEX TESTER — Live matching with highlight
// ================================================================
window.testRegex = function () {
  const pattern = document.getElementById('regexPattern')?.value || '';
  const flags = document.getElementById('regexFlags')?.value || 'g';
  const testStr = document.getElementById('regexTest')?.value || '';
  const output = document.getElementById('regexOutput');
  const matchList = document.getElementById('regexMatches');
  if (!output || !matchList) return;

  if (!pattern) {
    output.innerHTML = `<span style="color:var(--muted)">${escapeHtml(testStr)}</span>`;
    matchList.textContent = '// Enter a pattern to test';
    return;
  }

  try {
    const re = new RegExp(pattern, flags);
    const matches = [];
    let match;
    const cloneRe = new RegExp(pattern, flags);

    if (flags.includes('g') || flags.includes('y')) {
      while ((match = cloneRe.exec(testStr)) !== null) {
        matches.push({ index: match.index, value: match[0], groups: match.groups });
        if (match[0].length === 0) cloneRe.lastIndex++;
      }
    } else {
      match = cloneRe.exec(testStr);
      if (match) matches.push({ index: match.index, value: match[0], groups: match.groups });
    }

    // Highlight matches
    let highlighted = escapeHtml(testStr);
    if (matches.length) {
      let offset = 0;
      let result = '';
      let pos = 0;
      for (const m of matches) {
        result += escapeHtml(testStr.slice(pos, m.index));
        result += `<span style="background:rgba(0,255,65,.25);color:var(--g);border-radius:2px;padding:0 1px">${escapeHtml(m.value)}</span>`;
        pos = m.index + m.value.length;
      }
      result += escapeHtml(testStr.slice(pos));
      highlighted = result;
    }
    output.innerHTML = highlighted || `<span style="color:var(--muted)">// No test string</span>`;

    matchList.innerHTML = matches.length
      ? matches.map((m, i) => `<div class="tl-line tl-ok">Match ${i + 1}: <code>"${escapeHtml(m.value)}"</code> @ index ${m.index}</div>`).join('')
      : `<div class="tl-line tl-warn">// No matches found</div>`;

    const statusEl = document.getElementById('regexStatus');
    if (statusEl) {
      statusEl.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''} found`;
      statusEl.style.color = matches.length ? 'var(--g)' : 'var(--amber)';
    }
  } catch (e) {
    output.textContent = testStr;
    matchList.innerHTML = `<div class="tl-line tl-err">Invalid regex: ${e.message}</div>`;
    if (typeof toast === 'function') toast('Invalid regex: ' + e.message, 'err');
  }
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ================================================================
// 5. TIMESTAMP CONVERTER
// ================================================================
window.convertTimestamp = function () {
  const input = document.getElementById('tsInput')?.value?.trim() || '';
  const output = document.getElementById('tsOutput');
  if (!output) return;

  let ts;
  if (/^\d{10}$/.test(input)) ts = parseInt(input) * 1000;
  else if (/^\d{13}$/.test(input)) ts = parseInt(input);
  else ts = Date.parse(input);

  if (isNaN(ts)) {
    output.innerHTML = `<div class="tl-line tl-err">✗ Invalid timestamp or date string</div>`;
    return;
  }

  const d = new Date(ts);
  const rows = [
    ['Unix (sec)', Math.floor(ts / 1000)],
    ['Unix (ms)', ts],
    ['ISO 8601', d.toISOString()],
    ['UTC String', d.toUTCString()],
    ['Local', d.toLocaleString()],
    ['Date Only', d.toDateString()],
    ['Time Only', d.toTimeString()],
    ['Relative', (() => {
      const diff = Date.now() - ts;
      const abs = Math.abs(diff);
      const suffix = diff > 0 ? 'ago' : 'from now';
      if (abs < 60000) return `${Math.floor(abs / 1000)}s ${suffix}`;
      if (abs < 3600000) return `${Math.floor(abs / 60000)}m ${suffix}`;
      if (abs < 86400000) return `${Math.floor(abs / 3600000)}h ${suffix}`;
      return `${Math.floor(abs / 86400000)}d ${suffix}`;
    })()],
  ];

  output.innerHTML = rows.map(([k, v]) =>
    `<div class="flex justify-between tl-line" style="gap:.5rem">
       <span class="text-muted" style="flex-shrink:0">${k}:</span>
       <code style="color:var(--g);cursor:pointer;word-break:break-all" onclick="copyText('${v}','Copied')">${v}</code>
     </div>`
  ).join('');
};

window.setNowTimestamp = function () {
  const inp = document.getElementById('tsInput');
  if (inp) { inp.value = Date.now(); window.convertTimestamp(); }
};

// ================================================================
// 6. HTTP HEADERS INSPECTOR
// ================================================================
window.inspectHeaders = async function () {
  const url = document.getElementById('headersUrl')?.value?.trim() || '';
  const output = document.getElementById('headersOutput');
  if (!output || !url) return;

  output.innerHTML = `<div class="tl-line tl-sys"><span class="scan-spinner" style="display:inline-block"></span> Fetching headers for ${escapeHtml(url)}…</div>`;

  try {
    // Use a CORS proxy or a DoH endpoint to demonstrate
    const target = url.startsWith('http') ? url : 'https://' + url;

    // Try direct fetch (will work for same-origin or CORS-enabled endpoints)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const resp = await fetch(target, { method: 'HEAD', signal: controller.signal, mode: 'no-cors' });
      clearTimeout(timeout);
      // no-cors won't give us headers but at least we can confirm connectivity
      output.innerHTML = `
        <div class="tl-line tl-ok">✓ Connection established to ${escapeHtml(target)}</div>
        <div class="tl-line tl-warn">⚠ CORS policy prevents reading response headers in browser</div>
        <div class="tl-line tl-info">Status: ${resp.status || 'opaque (no-cors mode)'}</div>
        <div class="tl-line tl-sys">─────────────────────────────────────────</div>
        <div class="tl-line tl-sys">Browser Security Note:</div>
        <div class="tl-line tl-sys">Direct header inspection requires server CORS headers or a proxy.</div>
        <div class="tl-line tl-sys">Use curl/wget for full header inspection:</div>
        <div class="tl-line tl-ok">$ curl -I ${escapeHtml(target)}</div>
        <div class="tl-line tl-ok">$ wget --server-response --spider ${escapeHtml(target)}</div>`;
    } catch (fetchErr) {
      clearTimeout(timeout);
      output.innerHTML = `
        <div class="tl-line tl-warn">⚠ Could not connect: ${escapeHtml(fetchErr.message)}</div>
        <div class="tl-line tl-sys">Try the curl command instead:</div>
        <div class="tl-line tl-ok">$ curl -I ${escapeHtml(target)}</div>`;
    }
  } catch (e) {
    output.innerHTML = `<div class="tl-line tl-err">Error: ${escapeHtml(e.message)}</div>`;
  }
};

// ================================================================
// 7. BASE64 IMAGE CONVERTER
// ================================================================
window.handleImageB64 = function (input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const b64 = e.target.result;
    const txtArea = document.getElementById('imgB64Output');
    const preview = document.getElementById('imgPreview');
    const info = document.getElementById('imgInfo');

    if (txtArea) txtArea.value = b64;
    if (preview) { preview.src = b64; preview.style.display = 'block'; }
    if (info) {
      info.textContent = `${file.name} · ${file.type} · ${(file.size / 1024).toFixed(1)}KB · Base64: ${Math.ceil(b64.length / 1024)}KB`;
    }
  };
  reader.readAsDataURL(file);
};

window.b64ToImage = function () {
  const b64 = document.getElementById('imgB64Input')?.value?.trim() || '';
  const preview = document.getElementById('imgPreviewB64');
  if (!b64 || !preview) return;
  preview.src = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
  preview.style.display = 'block';
  preview.onerror = () => { if (typeof toast === 'function') toast('Invalid base64 image data', 'err'); };
};

window.copyImgB64 = function () {
  const val = document.getElementById('imgB64Output')?.value || '';
  if (val) copyText(val, 'Base64 string copied');
};

window.downloadImgB64 = function () {
  const b64 = document.getElementById('imgB64Output')?.value || '';
  if (!b64) return;
  const a = document.createElement('a');
  a.href = b64;
  a.download = 'image_base64.png';
  a.click();
};

// ================================================================
// 8. COLOR PICKER & CONVERTER
// ================================================================
window.updateColorPicker = function (hex) {
  const hexInput = document.getElementById('colorHex');
  const rgbOutput = document.getElementById('colorRgb');
  const hslOutput = document.getElementById('colorHsl');
  const previewBig = document.getElementById('colorPreviewBig');
  const cmykOutput = document.getElementById('colorCmyk');

  if (!hex) hex = hexInput?.value || '#00ff41';
  if (!hex.startsWith('#')) hex = '#' + hex;

  // Hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return;

  // RGB to HSL
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }

  // RGB to CMYK
  const k = 1 - Math.max(rn, gn, bn);
  const c2 = k < 1 ? (1 - rn - k) / (1 - k) : 0;
  const m2 = k < 1 ? (1 - gn - k) / (1 - k) : 0;
  const y2 = k < 1 ? (1 - bn - k) / (1 - k) : 0;

  if (rgbOutput) rgbOutput.textContent = `rgb(${r}, ${g}, ${b})`;
  if (hslOutput) hslOutput.textContent = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  if (cmykOutput) cmykOutput.textContent = `cmyk(${Math.round(c2 * 100)}%, ${Math.round(m2 * 100)}%, ${Math.round(y2 * 100)}%, ${Math.round(k * 100)}%)`;
  if (previewBig) previewBig.style.background = hex;
  if (hexInput && hexInput.value !== hex) hexInput.value = hex;

  // Update contrast info
  const lum = 0.2126 * Math.pow(rn, 2.2) + 0.7152 * Math.pow(gn, 2.2) + 0.0722 * Math.pow(bn, 2.2);
  const contrastWhite = (1.05) / (lum + 0.05);
  const contrastBlack = (lum + 0.05) / (0.05);
  const contrastEl = document.getElementById('colorContrast');
  if (contrastEl) {
    contrastEl.innerHTML = `
      <div>vs White: <strong style="color:${contrastWhite >= 4.5 ? 'var(--g)' : 'var(--red)'}">${contrastWhite.toFixed(1)}:1</strong> ${contrastWhite >= 4.5 ? '✓ AA' : '✗ Fail'}</div>
      <div>vs Black: <strong style="color:${contrastBlack >= 4.5 ? 'var(--g)' : 'var(--red)'}">${contrastBlack.toFixed(1)}:1</strong> ${contrastBlack >= 4.5 ? '✓ AA' : '✗ Fail'}</div>`;
  }
};

window.generateColorPalette = function () {
  const hex = document.getElementById('colorHex')?.value || '#00ff41';
  const palette = document.getElementById('colorPalette');
  if (!palette) return;

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const shades = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const nr = Math.round(r + (255 - r) * t * (0.7));
    const ng = Math.round(g + (255 - g) * t * (0.7));
    const nb = Math.round(b + (255 - b) * t * (0.7));
    const darkR = Math.round(r * (1 - t * 0.8));
    const darkG = Math.round(g * (1 - t * 0.8));
    const darkB = Math.round(b * (1 - t * 0.8));
    if (i < 5) shades.push(`#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`);
    else shades.push(`#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`);
  }

  palette.innerHTML = shades.map(c =>
    `<div style="background:${c};height:48px;cursor:pointer;border-radius:2px;display:flex;align-items:flex-end;padding:2px" title="${c}" onclick="copyText('${c}','Color copied'); updateColorPicker('${c}')">
      <span style="font-size:.48rem;font-family:monospace;color:rgba(255,255,255,.7)">${c}</span>
    </div>`
  ).join('');
};

// ================================================================
// 9. URL ENCODER/DECODER (standalone tool)
// ================================================================
window.encodeURL = function () {
  const inp = document.getElementById('urlInput')?.value || '';
  const out = document.getElementById('urlOutput');
  if (out) out.value = encodeURIComponent(inp);
};

window.decodeURL = function () {
  const inp = document.getElementById('urlInput')?.value || '';
  const out = document.getElementById('urlOutput');
  try {
    if (out) out.value = decodeURIComponent(inp);
  } catch (e) {
    if (typeof toast === 'function') toast('Invalid URL encoding', 'err');
  }
};

// ================================================================
// 10. MARKDOWN PREVIEWER
// ================================================================
window.renderMarkdown = function () {
  const input = document.getElementById('mdInput')?.value || '';
  const output = document.getElementById('mdOutput');
  if (!output) return;

  // Basic Markdown parser
  let html = input
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^# (.+)$/gm, '<h1 style="color:var(--g);font-family:var(--font-display);margin:.8rem 0 .4rem">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="color:var(--white);margin:.7rem 0 .3rem">$2</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="color:var(--cyan);margin:.6rem 0 .25rem">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,255,65,.1);color:var(--g);padding:1px 4px;border-radius:2px">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:var(--cyan)" target="_blank">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--g);padding-left:.75rem;color:var(--muted);margin:.5rem 0">$1</blockquote>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--gbord);margin:.75rem 0">')
    .replace(/^- (.+)$/gm, '<li style="margin:.2rem 0;list-style:disc;margin-left:1.2rem">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:.2rem 0;list-style:decimal;margin-left:1.2rem">$1</li>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');

  output.innerHTML = html;
  if (typeof toast === 'function') toast('Markdown rendered', 'ok');
};

// ================================================================
// 11. YAML ↔ JSON CONVERTER
// ================================================================
window.convertYamlJson = function (direction) {
  const input = document.getElementById('yamlInput')?.value?.trim() || '';
  const output = document.getElementById('yamlOutput');
  if (!output || !input) return;

  if (direction === 'yaml2json') {
    try {
      // Basic YAML to JSON (handles simple key:value and lists)
      const lines = input.split('\n');
      const obj = {};
      let currentKey = null;
      let currentArr = null;

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        if (trimmed.startsWith('- ')) {
          if (currentKey && !Array.isArray(obj[currentKey])) obj[currentKey] = [];
          if (currentKey) (obj[currentKey]).push(trimmed.slice(2));
        } else {
          const colonIdx = trimmed.indexOf(':');
          if (colonIdx > 0) {
            const k = trimmed.slice(0, colonIdx).trim();
            const v = trimmed.slice(colonIdx + 1).trim();
            currentKey = k;
            if (v) {
              const num = Number(v);
              obj[k] = v === 'true' ? true : v === 'false' ? false : v === 'null' ? null : !isNaN(num) && v !== '' ? num : v.replace(/^["']|["']$/g, '');
            } else {
              obj[k] = null;
            }
          }
        }
      });

      output.value = JSON.stringify(obj, null, 2);
      if (typeof toast === 'function') toast('YAML → JSON converted', 'ok');
    } catch (e) {
      if (typeof toast === 'function') toast('Conversion error: ' + e.message, 'err');
    }
  } else {
    try {
      const obj = JSON.parse(input);
      const toYaml = (o, indent = 0) => {
        const pad = ' '.repeat(indent);
        if (Array.isArray(o)) return o.map(v => `${pad}- ${typeof v === 'object' ? '\n' + toYaml(v, indent + 2) : v}`).join('\n');
        if (typeof o === 'object' && o !== null) return Object.entries(o).map(([k, v]) =>
          typeof v === 'object' ? `${pad}${k}:\n${toYaml(v, indent + 2)}` : `${pad}${k}: ${v}`
        ).join('\n');
        return String(o);
      };
      output.value = toYaml(obj);
      if (typeof toast === 'function') toast('JSON → YAML converted', 'ok');
    } catch (e) {
      if (typeof toast === 'function') toast('Invalid JSON: ' + e.message, 'err');
    }
  }
};

// ================================================================
// 12. CRON EXPRESSION PARSER
// ================================================================
window.parseCron = function () {
  const expr = document.getElementById('cronInput')?.value?.trim() || '';
  const output = document.getElementById('cronOutput');
  if (!output) return;

  const parts = expr.split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    output.textContent = '✗ Invalid: Cron needs 5 or 6 parts (min hour day mon weekday [year])';
    return;
  }

  const labels = ['Minute', 'Hour', 'Day (month)', 'Month', 'Day (week)', 'Year'];
  const descriptions = parts.map((p, i) => {
    const lbl = labels[i] || labels[i];
    if (p === '*') return `${lbl}: Every`;
    if (p.includes('/')) { const [, step] = p.split('/'); return `${lbl}: Every ${step}`; }
    if (p.includes('-')) { const [a, b] = p.split('-'); return `${lbl}: From ${a} to ${b}`; }
    if (p.includes(',')) return `${lbl}: At ${p.split(',').join(', ')}`;
    return `${lbl}: At ${p}`;
  });

  const humanReadable = {
    '0 * * * *': 'At minute 0 of every hour',
    '*/5 * * * *': 'Every 5 minutes',
    '0 0 * * *': 'Every day at midnight',
    '0 9 * * 1-5': 'Weekdays at 9 AM',
    '0 0 1 * *': 'First day of every month at midnight',
    '0 0 * * 0': 'Every Sunday at midnight',
    '@hourly': 'Every hour at minute 0',
    '@daily': 'Once a day at midnight',
    '@weekly': 'Once a week on Sunday midnight',
    '@monthly': 'Once a month on 1st at midnight',
    '@yearly': 'Once a year on Jan 1st midnight',
  };

  const known = humanReadable[expr];
  output.innerHTML = `
    <div class="tl-line tl-ok" style="font-size:.8rem;margin-bottom:.5rem">${known || descriptions.join(' • ')}</div>
    ${descriptions.map(d => `<div class="tl-line tl-sys">${d}</div>`).join('')}
    <div class="tl-line tl-info" style="margin-top:.5rem">Expression: <code>${escapeHtml(expr)}</code></div>`;
};

// ================================================================
// 13. IP GEOLOCATION LOOKUP
// ================================================================
window.geoLookupIP = async function () {
  const ip = document.getElementById('geoIpInput')?.value?.trim() || '';
  const output = document.getElementById('geoOutput');
  if (!output) return;

  output.innerHTML = `<div class="tl-line tl-sys">Looking up ${ip || 'your IP'}…</div>`;

  try {
    const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('API returned ' + resp.status);
    const data = await resp.json();

    if (data.error) throw new Error(data.reason || 'Lookup failed');

    const fields = [
      ['IP', data.ip], ['City', data.city], ['Region', data.region],
      ['Country', `${data.country_name} (${data.country})`],
      ['Continent', data.continent_code], ['Latitude', data.latitude],
      ['Longitude', data.longitude], ['Timezone', data.timezone],
      ['ISP', data.org], ['ASN', data.asn],
      ['Currency', data.currency], ['Languages', data.languages],
    ];

    output.innerHTML = fields.map(([k, v]) => v ?
      `<div class="flex justify-between tl-line" style="gap:.5rem">
         <span class="text-muted" style="flex-shrink:0;min-width:90px">${k}:</span>
         <span style="color:var(--g);text-align:right">${escapeHtml(String(v))}</span>
       </div>` : ''
    ).join('');

    if (typeof toast === 'function') toast(`Geo lookup: ${data.city}, ${data.country_name}`, 'ok');
  } catch (e) {
    output.innerHTML = `<div class="tl-line tl-err">✗ ${escapeHtml(e.message)}</div>`;
    if (typeof toast === 'function') toast('Geo lookup failed: ' + e.message, 'err');
  }
};

// ================================================================
// 14. NUMBER BASE CONVERTER
// ================================================================
window.convertBase = function () {
  const input = document.getElementById('baseInput')?.value?.trim() || '';
  const fromBase = parseInt(document.getElementById('baseFrom')?.value) || 10;

  const fields = {
    'baseOutBin': 2, 'baseOutOct': 8, 'baseOutDec': 10, 'baseOutHex': 16
  };

  try {
    const num = parseInt(input, fromBase);
    if (isNaN(num)) throw new Error('Invalid number for base ' + fromBase);

    Object.entries(fields).forEach(([id, base]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = num.toString(base).toUpperCase();
    });

    // Show bit representation
    const bits = document.getElementById('baseBits');
    if (bits) {
      const b = num.toString(2).padStart(Math.ceil(num.toString(2).length / 8) * 8, '0');
      bits.textContent = b.match(/.{1,8}/g)?.join(' ') || b;
    }
  } catch (e) {
    if (typeof toast === 'function') toast(e.message, 'err');
  }
};

// ================================================================
// 15. SEARCH FUNCTION — Global search across all views
// ================================================================
window.globalSearch = function (query) {
  const q = (query || document.getElementById('globalSearchInput')?.value || '').toLowerCase().trim();
  const resultsEl = document.getElementById('globalSearchResults');
  if (!resultsEl || !q) return;

  const searchMap = [
    { view: 'compiler', name: 'IDE Compiler', desc: 'DuckyScript editor, compile, lint, hex dump' },
    { view: 'neural', name: 'Neural AI Lab', desc: 'AI-powered script generation, chat, voice' },
    { view: 'scanner', name: 'Scanner', desc: 'WiFi, BLE, deauth, port scan, spectrum' },
    { view: 'network', name: 'Network', desc: 'DNS lookup, WebRTC, latency, network info' },
    { view: 'encoder', name: 'Encoder', desc: 'Base64, hex, URL, rot13, morse, binstr' },
    { view: 'keymap', name: 'Keymap Visualizer', desc: 'Virtual keyboard, replay, step mode' },
    { view: 'osint', name: 'OSINT Fingerprint', desc: 'Browser fingerprint, canvas hash, WebGL' },
    { view: 'vault', name: 'Vault', desc: 'Saved scripts, encrypt, PDF export' },
    { view: 'crypto', name: 'Crypto Tools', desc: 'SHA hash, RSA, AES demo, hash benchmark' },
    { view: 'mitre', name: 'MITRE ATT&CK', desc: 'Tactics, techniques, mitigations' },
    { view: 'subnets', name: 'Subnet Calculator', desc: 'CIDR, netmask, host range, binary' },
    { view: 'architect', name: 'Network Architect', desc: 'Drag-drop topology, packet simulation' },
    { view: 'speedtest', name: 'Speed Test', desc: 'Download/upload speed, latency, jitter' },
    { view: 'clipboard', name: 'Clipboard', desc: 'Paste, convert to DuckyScript' },
    { view: 'whois', name: 'WHOIS', desc: 'Domain WHOIS lookup' },
    { view: 'diff', name: 'Text Diff', desc: 'Compare two text blocks' },
    { view: 'macro', name: 'Macro Recorder', desc: 'Record keystrokes, generate script' },
    { view: 'audit', name: 'Security Audit', desc: 'Compliance scoring, browser privacy check' },
    { suite: 'sec-suite', tab: 'pwdgen', name: '🆕 Password Generator', desc: 'Cryptographically secure passwords' },
    { suite: 'dev-suite', tab: 'jsonfmt', name: '🆕 JSON Formatter', desc: 'Pretty print, minify, validate JSON' },
    { suite: 'dev-suite', tab: 'regex', name: '🆕 Regex Tester', desc: 'Live regex matching with highlighting' },
    { suite: 'sys-suite', tab: 'timestamp', name: '🆕 Timestamp Converter', desc: 'Unix timestamp, ISO 8601, relative' },
    { suite: 'dev-suite', tab: 'colorpicker', name: '🆕 Color Picker', desc: 'HEX, RGB, HSL, CMYK, contrast ratio' },
    { suite: 'dev-suite', tab: 'markdown', name: '🆕 Markdown Preview', desc: 'Live markdown rendering' },
    { suite: 'sec-suite', tab: 'geoip', name: '🆕 IP Geolocation', desc: 'IP address geolocation lookup' },
    { suite: 'sys-suite', tab: 'baseconv', name: '🆕 Base Converter', desc: 'Binary, octal, decimal, hex converter' },
    { suite: 'dev-suite', tab: 'yamljson', name: '🆕 YAML↔JSON', desc: 'Convert between YAML and JSON' },
    { suite: 'sys-suite', tab: 'cron', name: '🆕 Cron Parser', desc: 'Parse and explain cron expressions' },
    { suite: 'sec-suite', tab: 'headers', name: '🆕 HTTP Headers', desc: 'HTTP request headers inspector' },
    { suite: 'sec-suite', tab: 'imgb64', name: '🆕 Image ↔ Base64', desc: 'Convert images to/from base64 strings' },
    { view: 'terminal', name: 'Shell', desc: 'Interactive shell, history, commands' },
    { view: 'settings', name: 'Settings', desc: 'CRT, particles, theme, layout config' },
    { view: 'dashboard', name: 'Dashboard', desc: 'Stats, activity feed, telemetry' },
    { view: 'c2_hive', name: 'C2 Hive', desc: 'Live beacon management, C2 console' },
  ];

  const results = searchMap.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.desc.toLowerCase().includes(q) ||
    (item.view && item.view.toLowerCase().includes(q)) ||
    (item.suite && item.suite.toLowerCase().includes(q)) ||
    (item.tab && item.tab.toLowerCase().includes(q))
  );

  if (!results.length) {
    resultsEl.innerHTML = `<div class="text-muted text-xs" style="padding:.5rem">No results for "${escapeHtml(q)}"</div>`;
    return;
  }

  resultsEl.innerHTML = results.map(r => {
    const handler = r.suite 
      ? `switchViewSuite('${r.suite}', '${r.tab}')`
      : `switchView('${r.view}', document.querySelector('[data-view=${r.view}]'))`;
    return `<div class="vault-item flex items-center gap-sm" onclick="${handler};document.getElementById('searchPanel').style.display='none'" style="cursor:pointer">
      <i class="fas fa-arrow-right" style="color:var(--g-dim);font-size:.65rem;flex-shrink:0"></i>
      <div>
        <div style="font-size:.72rem;color:var(--white);font-weight:600">${r.name}</div>
        <div style="font-size:.6rem;color:var(--muted)">${r.desc}</div>
      </div>
    </div>`;
  }).join('');
};

window.toggleSearch = function () {
  const panel = document.getElementById('searchPanel');
  if (!panel) return;
  const isVisible = panel.style.display !== 'none';
  panel.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) {
    setTimeout(() => document.getElementById('globalSearchInput')?.focus(), 50);
  }
};

// ================================================================
// 16. KEYBOARD SHORTCUT EXPANSION
// ================================================================
document.addEventListener('keydown', function (e) {
  // Ctrl+F = global search
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    window.toggleSearch();
    return;
  }
  // Ctrl+Shift+P = password generator
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    e.preventDefault();
    if (typeof window.switchViewSuite === 'function') window.switchViewSuite('sec-suite', 'pwdgen');
    return;
  }
  // Ctrl+Shift+J = JSON formatter
  if (e.ctrlKey && e.shiftKey && e.key === 'J') {
    e.preventDefault();
    if (typeof window.switchViewSuite === 'function') window.switchViewSuite('dev-suite', 'jsonfmt');
    return;
  }
  // Escape = close search
  if (e.key === 'Escape') {
    const panel = document.getElementById('searchPanel');
    if (panel) panel.style.display = 'none';
  }
});

// ================================================================
// 17. AUTO-COMPLETE FOR SCRIPT EDITOR (basic DuckyScript hints)
// ================================================================
window.initEditorAutocomplete = function () {
  const editor = document.getElementById('srcEditor');
  if (!editor) return;

  const keywords = ['DELAY', 'STRING', 'STRINGLN', 'ENTER', 'GUI', 'CTRL', 'ALT', 'SHIFT',
    'TAB', 'ESC', 'DELETE', 'BACKSPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'PRINTSCREEN', 'SCROLLLOCK', 'PAUSE', 'INSERT', 'HOME', 'PAGEUP',
    'PAGEDOWN', 'END', 'CAPSLOCK', 'REM', 'REPEAT', 'DEFAULT_DELAY',
    'FUNCTION', 'END_FUNCTION', 'VAR', 'IF', 'ELSE', 'END_IF', 'WHILE', 'END_WHILE'];

  editor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      const val = this.value;
      this.value = val.substring(0, start) + '  ' + val.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
      if (typeof lintSource === 'function') lintSource(this.value);
    }
  });
};

// ================================================================
// 18. RESPONSIVE NAV — Group tabs for mobile
// ================================================================
window.initResponsiveNav = function () {
  const checkWidth = () => {
    const tabs = document.querySelector('.nav-tabs');
    if (!tabs) return;
    if (window.innerWidth < 480) {
      tabs.style.maxHeight = '38px';
    } else {
      tabs.style.maxHeight = '';
    }
  };
  checkWidth();
  window.addEventListener('resize', checkWidth);
};

// ================================================================
// 19. STATISTICS TRACKING — Enhanced
// ================================================================
window.trackFeatureUsage = function (feature) {
  const stats = JSON.parse(localStorage.getItem('lenlu_usage') || '{}');
  stats[feature] = (stats[feature] || 0) + 1;
  stats['_lastUsed'] = new Date().toISOString();
  localStorage.setItem('lenlu_usage', JSON.stringify(stats));
};

// ================================================================
// SUB-TAB & VIEW-SUITE MANAGEMENT
// ================================================================
window.switchSubTab = function(suiteId, tabId, btn) {
  const suiteEl = document.getElementById('view-' + suiteId);
  if (!suiteEl) return;
  suiteEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  suiteEl.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  const targetPanel = suiteEl.querySelector('#subtab-' + suiteId + '-' + tabId);
  if (targetPanel) targetPanel.classList.add('active');
  if (typeof playTone === 'function') {
    playTone(660, 'sine', .05, .03);
  }
};

window.switchViewSuite = function(suiteId, tabId) {
  const btn = document.querySelector(`[data-view="${suiteId}"]`);
  if (typeof window.switchView === 'function') {
    window.switchView(suiteId, btn);
  }
  const tabBtn = document.querySelector(`#view-${suiteId} .tab-btn[onclick*="${tabId}"]`);
  if (tabBtn) {
    tabBtn.click();
  }
};

// Override switchView to track usage
if (typeof window.switchView === 'function') {
  const originalSwitchView = window.switchView;
  window.switchView = function (view, btn) {
    window.trackFeatureUsage('view_' + view);
    originalSwitchView(view, btn);
  };
}

// ================================================================
// 20. INIT — Called when DOM is ready
// ================================================================
window.initNewFeatures = function () {
  loadTheme();
  initResponsiveNav();
  initEditorAutocomplete();

  // Initialize color picker if view exists
  const colorHex = document.getElementById('colorHex');
  if (colorHex) {
    colorHex.addEventListener('input', (e) => updateColorPicker(e.target.value));
    updateColorPicker('#00ff41');
  }

  // Live regex testing
  const regexPattern = document.getElementById('regexPattern');
  const regexTest = document.getElementById('regexTest');
  if (regexPattern) regexPattern.addEventListener('input', testRegex);
  if (regexTest) regexTest.addEventListener('input', testRegex);

  // Live JSON formatting indicator
  const jsonInput = document.getElementById('jsonInput');
  if (jsonInput) jsonInput.addEventListener('input', () => {
    try {
      JSON.parse(jsonInput.value); const s = document.getElementById('jsonStatus');
      if (s) { s.textContent = '✓ Valid JSON'; s.style.color = 'var(--g)'; }
    } catch (e) {
      const s = document.getElementById('jsonStatus');
      if (s) { s.textContent = '✗ ' + e.message; s.style.color = 'var(--amber)'; }
    }
  });

  // Timestamp — update on input
  const tsInput = document.getElementById('tsInput');
  if (tsInput) tsInput.addEventListener('input', convertTimestamp);

  // Cron — update on input
  const cronInput = document.getElementById('cronInput');
  if (cronInput) cronInput.addEventListener('input', parseCron);

  // Search — live search
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.addEventListener('input', () => globalSearch(searchInput.value));

  console.log('[FORGE v5.0] New features initialized');
};

// Auto-init when DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initNewFeatures);
} else {
  // DOM already loaded
  setTimeout(window.initNewFeatures, 500);
}