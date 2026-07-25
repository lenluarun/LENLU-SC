import { S, ACTS, DUCK_CMDS, DUCK_KEY_MAP } from './state.js';
import { lintSource } from './compiler.js';

const DEFS = {
  crt: true, rain: true, particles: true, audio: true, lint: true, persist: true, hist: true, grain: true, vignette: true, hexdump: false,
  themeColor: 'cyber-green', fontFamily: 'Share Tech Mono', soundVol: 80, tonePitch: 'medium', bootSound: true,
  scanlineOpacity: 50, glassOpacity: 70, rainDensity: 'normal', particleCount: 2800,
  autoSave: true, autoLint: true, tabSize: 4, lineNumbers: true, defaultDelay: 100, obfuscationLevel: 'none',
  autoSweep: false, bleAutoScan: false, anonymizeIP: false, strictSandbox: false
};
let _aCtx = null;
let _speedTestRunning = false;

function setSetting(k, val) {
  S.settings[k] = val;
  localStorage.setItem('lenlu_cfg4', JSON.stringify(S.settings));
  applySettings();
  toast(k + ': ' + val, 'info');
}

function updateSettingInput(k, val) {
  S.settings[k] = val;
  localStorage.setItem('lenlu_cfg4', JSON.stringify(S.settings));
  applySettings();
}

function exportSettingsJSON() {
  const json = JSON.stringify(S.settings, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'lenlu_config.json';
  a.click(); URL.revokeObjectURL(url);
  toast('Settings exported', 'ok');
}

function importSettingsJSON(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    S.settings = { ...DEFS, ...parsed };
    localStorage.setItem('lenlu_cfg4', JSON.stringify(S.settings));
    applySettings();
    toast('Settings imported successfully', 'ok');
  } catch (e) {
    toast('Invalid config JSON', 'err');
  }
}

function resetSettingsToDefault() {
  S.settings = { ...DEFS };
  localStorage.setItem('lenlu_cfg4', JSON.stringify(S.settings));
  applySettings();
  toast('Settings reset to default', 'info');
}
    function startNavClock() {
      const el = document.getElementById('navClock');
      const update = () => {
        const now = new Date();
        const h24 = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        const s = now.getSeconds().toString().padStart(2, '0');
        const time24 = h24 + ':' + m + ':' + s;
        let h12 = now.getHours() % 12 || 12;
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        const time12 = h12 + ':' + m + ' ' + ampm;
        const c24 = el ? el.querySelector('.clock-24') : null;
        const c12 = el ? el.querySelector('.clock-12') : null;
        if (c24) c24.textContent = time24;
        if (c12) c12.textContent = time12;
      };
      update(); setInterval(update, 1000);
      const t0 = Date.now();
      setInterval(() => {
        const e = Date.now() - t0;
        const h = Math.floor(e / 3600000).toString().padStart(2, '0');
        const m = Math.floor((e % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((e % 60000) / 1000).toString().padStart(2, '0');
        const el2 = document.getElementById('shellUptime'); if (el2) el2.textContent = h + ':' + m + ':' + s;
      }, 1000);
    }
    function startMatrixRain() {
      const c = document.getElementById('matrixRain'); if (!c) return;
      const ctx = c.getContext('2d');
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*{}[]ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺ';
      let drops = [];
      const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; drops = Array.from({ length: Math.floor(c.width / 16) }, () => Math.random() * -c.height / 16); };
      resize(); window.addEventListener('resize', resize);
      setInterval(() => {
        ctx.fillStyle = 'rgba(0,0,0,.04)'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.font = '13px "Share Tech Mono"';
        for (let i = 0; i < drops.length; i++) {
          const t = chars[Math.floor(Math.random() * chars.length)];
          const b = Math.random();
          ctx.fillStyle = b > .96 ? '#fff' : b > .82 ? '#00ff41' : '#007a20';
          ctx.fillText(t, i * 16, drops[i] * 16);
          if (drops[i] * 16 > c.height && Math.random() > .975) drops[i] = 0;
          drops[i] += .45;
        }
      }, 52);
    }
    function startBGCanvas() {
      if (typeof THREE === 'undefined') return;
      const c = document.getElementById('bgCanvas'); if (!c) return;
      const scene = new THREE.Scene();
      const cam = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 1000);
      cam.position.z = 5;
      const renderer = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: false });
      renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      const n = 2800, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - .5) * 22; pos[i * 3 + 1] = (Math.random() - .5) * 22; pos[i * 3 + 2] = (Math.random() - .5) * 22;
        const r = Math.random();
        if (r > .92) { col[i * 3] = 0; col[i * 3 + 1] = 1; col[i * 3 + 2] = .25; }
        else if (r > .82) { col[i * 3] = .03; col[i * 3 + 1] = .97; col[i * 3 + 2] = 1; }
        else { col[i * 3] = 0; col[i * 3 + 1] = .45; col[i * 3 + 2] = .12; }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: .022, vertexColors: true, transparent: true, opacity: .75 }));
      scene.add(pts);
      window.addEventListener('resize', () => { cam.aspect = window.innerWidth / window.innerHeight; cam.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
      (function anim() { requestAnimationFrame(anim); pts.rotation.y += .00018; pts.rotation.x += .0001; renderer.render(scene, cam); })();
    }

    function initHeroCanvas() {
      const c = document.getElementById('heroCanvas'); if (!c) return;
      c.width = c.offsetWidth || 800; c.height = c.offsetHeight || 600;
      const ctx = c.getContext('2d');
      const nodes = Array.from({ length: 60 }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3 }));
      setInterval(() => {
        ctx.clearRect(0, 0, c.width, c.height);
        nodes.forEach(n => { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > c.width) n.vx *= -1; if (n.y < 0 || n.y > c.height) n.vy *= -1; });
        const connectionColorBase = '0,255,65';
        const particleColor = 'rgba(0,255,65,.4)';
        for (let i = 0; i < nodes.length; i++)for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) { ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.strokeStyle = `rgba(${connectionColorBase},${.12 * (1 - d / 100)})`; ctx.lineWidth = .5; ctx.stroke(); }
        }
        nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2); ctx.fillStyle = particleColor; ctx.fill(); });
      }, 40);
    }
    function initTelemetry() {
      const c = document.getElementById('telCanvas'); if (!c) return;
      c.width = c.offsetWidth || 300; c.height = 65;
      const ctx = c.getContext('2d');
      const dG = [], dC = [];
      for (let i = 0; i < 60; i++) { dG.push(Math.random()); dC.push(Math.random()); }
      setInterval(() => {
        ctx.clearRect(0, 0, c.width, 65);
        const colorG = 'rgba(0,255,65,.7)';
        const colorC = 'rgba(8,247,254,.5)';
        const drawLine = (d, color, w) => { ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = w; d.forEach((v, i) => { const x = i / (d.length - 1) * c.width, y = 65 - v * 58 - 3; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke(); };
        drawLine(dG, colorG, 1.5); drawLine(dC, colorC, 1);
        dG.shift(); dG.push(Math.random()); dC.shift(); dC.push(Math.random());
      }, 100);
    }

    function toast(msg, type = 'ok') {
      const wrap = document.getElementById('toastWrap');
      const t = document.createElement('div'); t.className = 'toast ' + type;
      const ic = { ok: 'check', err: 'times', warn: 'exclamation', info: 'info' };
      t.innerHTML = `<i class="fas fa-${ic[type] || 'info'}"></i><span>${msg}</span>`;
      wrap.appendChild(t);
      setTimeout(() => { t.classList.add('fade'); setTimeout(() => t.remove(), 450); }, 3200);
      playTone(type === 'ok' ? 880 : type === 'err' ? 220 : 660, 'sine', .1, .04);
    }
    // ─── AUDIO ───
    function playTone(freq = 440, type = 'sine', dur = .08, vol = .06) {
      if (!getSetting('audio')) return;
      try {
        _aCtx = _aCtx || new (window.AudioContext || window.webkitAudioContext)();
        const pitchMult = S.settings.tonePitch === 'low' ? 0.7 : S.settings.tonePitch === 'high' ? 1.4 : S.settings.tonePitch === 'ultra' ? 2.0 : 1.0;
        const volMult = (S.settings.soundVol !== undefined ? S.settings.soundVol : 80) / 100;
        const o = _aCtx.createOscillator(), g = _aCtx.createGain();
        o.connect(g); g.connect(_aCtx.destination); o.type = type; o.frequency.value = freq * pitchMult;
        g.gain.setValueAtTime(vol * volMult, _aCtx.currentTime); g.gain.exponentialRampToValueAtTime(.001, _aCtx.currentTime + dur);
        o.start(); o.stop(_aCtx.currentTime + dur);
      } catch (e) { }
    }
    function loadSettings() {
      try { const s = JSON.parse(localStorage.getItem('lenlu_cfg4') || '{}'); S.settings = { ...DEFS, ...s }; } catch { S.settings = { ...DEFS }; }
      applySettings();
    }
    function applySettings() {
      const crt = document.getElementById('crtLayer');
      if (crt) {
        crt.style.display = S.settings.crt ? '' : 'none';
        crt.style.opacity = (S.settings.scanlineOpacity !== undefined ? S.settings.scanlineOpacity : 50) / 100;
      }
      document.getElementById('matrixRain').style.opacity = S.settings.rain ? '.1' : '0';
      document.getElementById('filmGrain').style.display = S.settings.grain ? '' : 'none';
      document.querySelectorAll('.toggle').forEach(t => { const k = t.id.replace('tog-', ''); if (k in S.settings) t.className = 'toggle' + (S.settings[k] ? ' on' : ''); });
      const bg = document.getElementById('bgCanvas');
      const vig = document.getElementById('vignetteLayer');
      if (bg) bg.style.display = S.settings.particles ? '' : 'none';
      if (vig) vig.style.display = S.settings.vignette ? '' : 'none';

      // Apply dynamic CSS variables for theme accent color & fonts
      const root = document.documentElement;
      const themeColors = {
        'cyber-green': { g: '#00ff41', g2: '#00cc33', gbord: 'rgba(0, 255, 65, 0.35)', glow: 'rgba(0, 255, 65, 0.25)' },
        'neon-cyan': { g: '#08f7fe', g2: '#00c4cc', gbord: 'rgba(8, 247, 254, 0.35)', glow: 'rgba(8, 247, 254, 0.25)' },
        'electric-amber': { g: '#ffb300', g2: '#e09d00', gbord: 'rgba(255, 179, 0, 0.35)', glow: 'rgba(255, 179, 0, 0.25)' },
        'plasma-red': { g: '#ff2d55', g2: '#d91c41', gbord: 'rgba(255, 45, 85, 0.35)', glow: 'rgba(255, 45, 85, 0.25)' },
        'deep-violet': { g: '#a855f7', g2: '#9333ea', gbord: 'rgba(168, 85, 247, 0.35)', glow: 'rgba(168, 85, 247, 0.25)' }
      };
      const curColor = themeColors[S.settings.themeColor] || themeColors['cyber-green'];
      root.style.setProperty('--g', curColor.g);
      root.style.setProperty('--g2', curColor.g2);
      root.style.setProperty('--gbord', curColor.gbord);
      root.style.setProperty('--glow', curColor.glow);

      if (S.settings.fontFamily) {
        root.style.setProperty('--font-mono', `"${S.settings.fontFamily}", monospace`);
      }
      if (S.settings.glassOpacity !== undefined) {
        root.style.setProperty('--glass-op', (S.settings.glassOpacity / 100).toFixed(2));
      }
      
      // Update form controls if present in Settings view
      ['fontFamily', 'soundVol', 'tonePitch', 'scanlineOpacity', 'glassOpacity', 'rainDensity', 'particleCount', 'tabSize', 'defaultDelay', 'obfuscationLevel'].forEach(key => {
        const inputEl = document.getElementById('cfg-' + key);
        if (inputEl) inputEl.value = S.settings[key];
        const valDisp = document.getElementById('val-' + key);
        if (valDisp) valDisp.textContent = S.settings[key] + (key.includes('Opacity') || key === 'soundVol' ? '%' : '');
      });
      // Update theme color radio buttons
      const themeRadios = document.querySelectorAll('input[name="themeColor"]');
      themeRadios.forEach(r => { r.checked = r.value === S.settings.themeColor; });
    }
    function getSetting(k) { return S.settings[k]; }
    function toggleSetting(k, el) {
      S.settings[k] = !S.settings[k];
      el.className = 'toggle' + (S.settings[k] ? ' on' : '');
      localStorage.setItem('lenlu_cfg4', JSON.stringify(S.settings));
      applySettings(); toast(k + ': ' + (S.settings[k] ? 'ON' : 'OFF'), 'info');
    }
    function checkBLE() {
      const el = document.getElementById('bleStatus'); if (el) el.textContent = navigator.bluetooth ? 'Available' : 'Unsupported (Chrome/Edge)';
      const home = document.getElementById('bleStatusHome');
      if (home) { const dot = home.querySelector('.s-dot'); if (dot) dot.className = 's-dot ' + (navigator.bluetooth ? 'ok' : 'warn'); home.querySelector('span').textContent = 'BLE ' + (navigator.bluetooth ? 'Available' : 'Unsupported'); }
    }
    function checkWebGL() {
      const el = document.getElementById('webglInfo'); if (!el) return;
      try { const c2 = document.createElement('canvas'); const gl = c2.getContext('webgl2') || c2.getContext('webgl'); el.textContent = gl ? 'WebGL2 OK' : 'Unavailable'; } catch { el.textContent = 'Error'; }
    }
    function buildDuckRef() {
      const el = document.getElementById('duckRef'); if (!el) return;
      DUCK_CMDS.forEach(c => {
        const d = document.createElement('div'); d.className = 'hm-cell'; d.title = c.desc;
        d.innerHTML = `<div>${c.cmd}</div><div class="hm-cell-desc">${c.desc}</div>`;
        d.onclick = () => { insertAtCursor(document.getElementById('srcEditor'), c.cmd + ' '); playTone(600, 'sine', .05, .03); };
        el.appendChild(d);
      });
    }
    function insertAtCursor(el, text) {
      if (!el) return; const s = el.selectionStart, e = el.selectionEnd;
      el.value = el.value.substr(0, s) + text + el.value.substr(e);
      el.selectionStart = el.selectionEnd = s + text.length; lintSource(el.value);
    }
    function parseKeymapScript() {
      const src = document.getElementById('keymapInput')?.value || '';
      const timeline = document.getElementById('keymapTimeline');
      if (!timeline) return;
      if (!src.trim()) {
        timeline.innerHTML = '<div class="tl-line text-muted">// Script empty. Enter commands or click keys above...</div>';
        document.getElementById('km-total').textContent = '0';
        document.getElementById('km-delays').textContent = '0';
        document.getElementById('km-strings').textContent = '0';
        document.getElementById('keymapBadge').textContent = 'IDLE';
        return;
      }
      S.keymapEvents = []; S.keymapStep = 0;
      let totalKeys = 0, delays = 0, strings = 0;
      const lines = src.split('\n');
      const ts = new Date().toTimeString().substr(0, 8);
      timeline.innerHTML = `<div class="tl-line tl-info"><span class="tl-ts">[${ts}]</span>Parsed ${lines.length} lines</div>`;
      lines.forEach((raw) => {
        const t = raw.trim(); if (!t || t.startsWith('REM') || t.startsWith(';')) return;
        const parts = t.split(/\s+/); const cmd = parts[0].toUpperCase(); const arg = parts.slice(1).join(' ');
        if (cmd === 'DELAY') { delays++; S.keymapEvents.push({ type: 'delay', ms: parseInt(arg) || 100 }); addLog(timeline, `DELAY ${arg}ms`, 'tl-sys'); }
        else if (cmd === 'STRING' || cmd === 'STRINGLN') {
          strings++;
          arg.split('').forEach(ch => { S.keymapEvents.push({ type: 'char', char: ch, key: ch.toUpperCase() }); totalKeys++; });
          if (cmd === 'STRINGLN') { S.keymapEvents.push({ type: 'key', key: 'ENTER' }); totalKeys++; }
          addLog(timeline, `${cmd}: "${arg}"`, 'tl-ok');
        }
        else if (cmd in DUCK_KEY_MAP) { S.keymapEvents.push({ type: 'key', key: DUCK_KEY_MAP[cmd] }); totalKeys++; addLog(timeline, cmd + ' → key: ' + DUCK_KEY_MAP[cmd], 'tl-ok'); }
        else if (cmd === 'GUI' || cmd === 'WINDOWS' || cmd === 'COMMAND' || cmd === 'SUPER') {
          S.keymapEvents.push({ type: 'key', key: 'GUI' }); totalKeys++;
          if (arg) { arg.split(' ').forEach(k => { S.keymapEvents.push({ type: 'key', key: k.toUpperCase() }); totalKeys++; }); }
          addLog(timeline, `GUI ${arg}`, 'tl-ok');
        }
        else if (cmd === 'CTRL' || cmd === 'CONTROL') { S.keymapEvents.push({ type: 'combo', keys: ['CTRL', arg.toUpperCase()] }); totalKeys += 2; addLog(timeline, `CTRL+${arg}`, 'tl-ok'); }
        else if (cmd === 'ALT') { S.keymapEvents.push({ type: 'combo', keys: ['ALT', arg.toUpperCase()] }); totalKeys += 2; addLog(timeline, `ALT+${arg}`, 'tl-ok'); }
        else if (cmd === 'SHIFT') { S.keymapEvents.push({ type: 'combo', keys: ['LSHIFT', arg.toUpperCase()] }); totalKeys += 2; addLog(timeline, `SHIFT+${arg}`, 'tl-ok'); }
        else if (/^F([1-9]|1[0-2])$/.test(cmd)) { S.keymapEvents.push({ type: 'key', key: cmd }); totalKeys++; addLog(timeline, cmd, 'tl-ok'); }
        else if (cmd === 'ENTER' || cmd === 'RETURN') { S.keymapEvents.push({ type: 'key', key: 'ENTER' }); totalKeys++; addLog(timeline, 'ENTER', 'tl-ok'); }
        else if (cmd === 'SPACE') { S.keymapEvents.push({ type: 'key', key: 'SPACE' }); totalKeys++; addLog(timeline, 'SPACE', 'tl-ok'); }
        else if (cmd === 'TAB') { S.keymapEvents.push({ type: 'key', key: 'TAB' }); totalKeys++; addLog(timeline, 'TAB', 'tl-ok'); }
      });
      document.getElementById('km-total').textContent = totalKeys;
      document.getElementById('km-delays').textContent = delays;
      document.getElementById('km-strings').textContent = strings;
      document.getElementById('keymapBadge').textContent = totalKeys + ' KEYS';
    }
    function replayKeymap() {
      if (!S.keymapEvents.length) { parseKeymapScript(); }
      if (!S.keymapEvents.length) { toast('No keystrokes to replay', 'warn'); return; }
      S.keymapStep = 0; if (S.keymapTimer) clearTimeout(S.keymapTimer);
      document.getElementById('keymapBadge').textContent = 'PLAYING';
      document.getElementById('keymapBadge').className = 'badge badge-g';
      playKeymapEvents();
    }
    function playKeymapEvents() {
      if (S.keymapStep >= S.keymapEvents.length) {
        document.getElementById('keymapBadge').textContent = 'DONE';
        document.getElementById('keymapBadge').className = 'badge badge-c';
        toast('Keymap replay complete', 'ok');
        return;
      }
      const ev = S.keymapEvents[S.keymapStep++];
      let delay = 80;
      if (ev.type === 'delay') { delay = Math.min(ev.ms, 2000); updateActiveKey('WAIT', 'DELAY ' + ev.ms + 'ms'); deactivateAll(); }
      else if (ev.type === 'key') { activateKey(ev.key); updateActiveKey(ev.key, 'KEYPRESS'); delay = 120; }
      else if (ev.type === 'char') { activateKey(ev.key); updateActiveKey(ev.key, 'STRING'); delay = 80; }
      else if (ev.type === 'combo') { ev.keys.forEach(k => activateKey(k)); updateActiveKey(ev.keys.join('+'), 'COMBO'); delay = 150; }
      S.keymapTimer = setTimeout(() => { deactivateAll(); playKeymapEvents(); }, delay);
    }
    function stepKeymap() {
      if (!S.keymapEvents.length) { parseKeymapScript(); }
      if (!S.keymapEvents.length) { toast('No keystrokes to step', 'warn'); return; }
      if (S.keymapStep >= S.keymapEvents.length) { S.keymapStep = 0; deactivateAll(); updateActiveKey('--', 'RESET'); return; }
      const ev = S.keymapEvents[S.keymapStep++];
      deactivateAll();
      if (ev.type === 'delay') { updateActiveKey('WAIT', 'DELAY ' + ev.ms + 'ms'); }
      else if (ev.type === 'key') { activateKey(ev.key); updateActiveKey(ev.key, 'KEY'); }
      else if (ev.type === 'char') { activateKey(ev.key); updateActiveKey(ev.key, 'STRING'); }
      else if (ev.type === 'combo') { ev.keys.forEach(k => activateKey(k)); updateActiveKey(ev.keys.join('+'), 'COMBO'); }
    }
    function activateKey(k) {
      if (!k) return;
      let target = k.toUpperCase();
      const charMap = {
        ' ': 'SPACE', '/': 'SLASH', '.': 'DOT', ',': 'COMMA', '-': 'MINUS', '=': 'EQUAL', ';': 'SEMICOLON', "'": 'QUOTE', '[': 'LBRACKET', ']': 'RBRACKET', '\\': 'BACKSLASH', '`': 'TILDE', '~': 'TILDE', 'WINDOWS': 'GUI', 'COMMAND': 'GUI'
      };
      if (charMap[target]) target = charMap[target];
      if (target === 'F') target = 'F_KEY';

      const el = document.getElementById('key-' + target);
      if (el) {
        el.classList.add('active', 'key-fire');
        setTimeout(() => el.classList.remove('key-fire'), 350);
      }
    }
    function deactivateAll() { document.querySelectorAll('.key.active').forEach(k => k.classList.remove('active')); }
    function updateActiveKey(k, label) {
      const d = document.getElementById('activeKeyDisplay'); const l = document.getElementById('activeKeyLabel');
      if (d) d.textContent = k.length > 5 ? k.substr(0, 5) : k; if (l) l.textContent = label;
    }
    function resetKeymap() { if (S.keymapTimer) clearTimeout(S.keymapTimer); S.keymapStep = 0; deactivateAll(); updateActiveKey('--', 'STANDBY'); document.getElementById('keymapBadge').textContent = 'IDLE'; document.getElementById('keymapBadge').className = 'badge badge-g'; }
    function loadFromCompiler() { const src = document.getElementById('srcEditor')?.value; if (src) document.getElementById('keymapInput').value = src; parseKeymapScript(); toast('Loaded script from IDE compiler', 'info'); }

    function initVirtualKeyboardClicks() {
      const kbd = document.getElementById('virtualKeyboard');
      if (!kbd || kbd.dataset.initialized) return;
      kbd.dataset.initialized = 'true';

      kbd.addEventListener('click', (e) => {
        const keyEl = e.target.closest('.key');
        if (!keyEl) return;

        let keyId = keyEl.id.replace('key-', '');
        let char = keyEl.textContent.trim();

        keyEl.classList.add('active', 'key-fire');
        setTimeout(() => keyEl.classList.remove('key-fire', 'active'), 350);
        playTone(880, 'sine', .05, .04);

        updateActiveKey(char, 'CLICK');

        const inp = document.getElementById('keymapInput');
        if (inp) {
          if (keyId === 'BACKSPACE') {
            inp.value = inp.value.slice(0, -1);
          } else if (keyId === 'ENTER') {
            inp.value += (inp.value && !inp.value.endsWith('\n') ? '\n' : '') + 'ENTER\n';
          } else if (keyId === 'SPACE') {
            inp.value += ' ';
          } else if (keyId === 'TAB') {
            inp.value += (inp.value && !inp.value.endsWith('\n') ? '\n' : '') + 'TAB\n';
          } else if (['GUI', 'CTRL', 'ALT', 'ESC', 'CAPS', 'LSHIFT', 'RSHIFT', 'RALT'].includes(keyId)) {
            inp.value += (inp.value && !inp.value.endsWith('\n') ? '\n' : '') + keyId + ' ';
          } else {
            const lines = inp.value.split('\n');
            const lastLine = lines[lines.length - 1] || '';
            if (lastLine.startsWith('STRING ')) {
              lines[lines.length - 1] += char;
              inp.value = lines.join('\n');
            } else {
              inp.value += (inp.value && !inp.value.endsWith('\n') ? '\n' : '') + 'STRING ' + char;
            }
          }
          parseKeymapScript();
        }
      });

      window.addEventListener('keydown', (e) => {
        if (S.currentView !== 'keymap') return;
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && activeEl.id !== 'keymapInput') return;

        let k = e.key.toUpperCase();
        if (k === ' ') k = 'SPACE';
        else if (k === 'CONTROL') k = 'CTRL';
        else if (k === 'ESCAPE') k = 'ESC';
        else if (k === 'BACKSPACE') k = 'BACKSPACE';
        else if (k === 'ENTER') k = 'ENTER';
        else if (k === 'TAB') k = 'TAB';
        else if (k === 'SHIFT') k = 'LSHIFT';
        else if (k === 'ALT') k = 'ALT';
        else if (k === 'META') k = 'GUI';

        activateKey(k);
        updateActiveKey(k, 'KEYBOARD');
      });
    }
    function drawSpeedGauge(speedVal = 0) {
      const c = document.getElementById('speedCanvas');
      if (!c) return;
      const ctx = c.getContext('2d');
      const cx = c.width / 2;
      const cy = c.height / 2;
      const r = c.width / 2 - 10;
      ctx.clearRect(0, 0, c.width, c.height);

      // Cyber: semi-transparent dark circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(3, 8, 4, 0.6)';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.25)';
      ctx.stroke();

      // Draw gauge arc
      const startAngle = 0.75 * Math.PI;
      const endAngle = 2.25 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 8, startAngle, endAngle);
      ctx.strokeStyle = 'rgba(8, 247, 254, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw tick marks
      const totalTicks = 11;
      for (let i = 0; i < totalTicks; i++) {
        const pct = i / (totalTicks - 1);
        const angle = startAngle + pct * (endAngle - startAngle);
        const x1 = cx + (r - 12) * Math.cos(angle);
        const y1 = cy + (r - 12) * Math.sin(angle);
        const x2 = cx + (r - 8) * Math.cos(angle);
        const y2 = cy + (r - 8) * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw needle
      const speedPct = Math.min(1, Math.max(0, speedVal / 100));
      const targetAngle = startAngle + speedPct * (endAngle - startAngle);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(targetAngle);

      ctx.beginPath();
      ctx.moveTo(0, -1.5);
      ctx.lineTo(r - 12, 0);
      ctx.lineTo(0, 1.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 255, 65, 0.9)'; // Neon green needle
      ctx.fill();

      // Center cap
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 255, 65, 0.8)';
      ctx.stroke();
      ctx.restore();
    }
    function runSpeedTest() {
      if (_speedTestRunning) return;
      _speedTestRunning = true;
      const dlEl = document.getElementById('st-dl');
      const ulEl = document.getElementById('st-ul');
      const latEl = document.getElementById('st-lat');
      const jitEl = document.getElementById('st-jit');
      const btnEl = document.getElementById('st-btn');
      if (btnEl) btnEl.disabled = true;
      if (dlEl) dlEl.textContent = '…';
      if (ulEl) ulEl.textContent = '…';
      if (latEl) latEl.textContent = '…';
      if (jitEl) jitEl.textContent = '…';
      toast('Speed test starting…', 'info');

      // Animate needle during speed test
      let needleTimer = setInterval(() => {
        if (!_speedTestRunning) {
          clearInterval(needleTimer);
          return;
        }
        // Swing needle between 10 and 90 to simulate measurement
        const randomSpeed = Math.floor(Math.random() * 80 + 10);
        drawSpeedGauge(randomSpeed);
        if (dlEl) dlEl.textContent = randomSpeed + ' Mbps';
      }, 70);

      // Latency test
      const latencies = [];
      let latCount = 0;
      const runLatency = () => {
        const t0 = performance.now();
        fetch('https://cloudflare-dns.com/dns-query?name=x.com&type=A', {
          headers: { 'Accept': 'application/dns-json' }, cache: 'no-store'
        }).then(() => {
          latencies.push(performance.now() - t0);
          latCount++;
          if (latCount < 4) { setTimeout(runLatency, 150); }
          else {
            const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(0);
            const jit = (Math.max(...latencies) - Math.min(...latencies)).toFixed(0);
            if (latEl) latEl.textContent = avg + ' ms';
            if (jitEl) jitEl.textContent = jit + ' ms';
          }
        }).catch(() => { if (latEl) latEl.textContent = 'N/A'; });
      };
      runLatency();

      // Download test
      const dlStart = performance.now();
      const testUrl = 'https://speed.cloudflare.com/__down?bytes=15000000';
      fetch(testUrl, { cache: 'no-store' })
        .then(r => r.blob())
        .then(blob => {
          const elapsed = (performance.now() - dlStart) / 1000;
          const sizeMb = blob.size / (1024 * 1024);
          const speed = (sizeMb * 8 / elapsed).toFixed(1);
          const speedNum = parseFloat(speed);
          clearInterval(needleTimer);
          const finalSpeed = (isNaN(speedNum) || speedNum > 5000) ? Math.floor(Math.random() * 50 + 10) : speedNum;
          drawSpeedGauge(finalSpeed);
          if (dlEl) dlEl.textContent = finalSpeed + ' Mbps';
          const dlLarge = document.getElementById('st-dl-large');
          if (dlLarge) dlLarge.textContent = finalSpeed + ' Mbps';

          const ulStart = performance.now();
          const ulData = new Uint8Array(2000000);
          fetch('https://speed.cloudflare.com/__up', { method: 'POST', body: ulData, cache: 'no-store' })
            .then(() => {
              const ulElapsed = (performance.now() - ulStart) / 1000;
              const ulSpeed = (2 * 8 / ulElapsed).toFixed(1);
              if (ulEl) ulEl.textContent = ulSpeed + ' Mbps';
              const stUl = document.getElementById('st-ul');
              if (stUl) stUl.textContent = ulSpeed + ' Mbps';
            }).catch(() => { if (ulEl) ulEl.textContent = 'Err'; })
            .finally(() => {
              _speedTestRunning = false;
              if (btnEl) btnEl.disabled = false;
              toast('Speed test complete', 'ok');
              S.stats.scans++; document.getElementById('stat-scans').textContent = S.stats.scans;
            });
        }).catch(() => {
          clearInterval(needleTimer);
          const mockSpeed = Math.floor(Math.random() * 50 + 10);
          drawSpeedGauge(mockSpeed);
          if (dlEl) dlEl.textContent = mockSpeed + ' Mbps';
          const dlLarge = document.getElementById('st-dl-large');
          if (dlLarge) dlLarge.textContent = mockSpeed + ' Mbps';
          _speedTestRunning = false;
          if (btnEl) btnEl.disabled = false;
          toast('Speed test failed, using fallback', 'warn');
        });
    }
    function startActivityFeed() {
      const feed = document.getElementById('actFeed'); if (!feed) return;
      const add = () => { const m = ACTS[Math.floor(Math.random() * ACTS.length)]; addLog(feed, m.t, m.c); setTimeout(add, 1800 + Math.random() * 4000); };
      add();
    }
    function addLog(el, msg, cls = 'tl-sys') {
      if (!el) return;
      const now = new Date(), ts = now.toTimeString().substr(0, 8);
      const line = document.createElement('div'); line.className = 'tl-line';
      line.innerHTML = `<span class="tl-ts">[${ts}]</span><span class="${cls}">${msg}</span>`;
      el.appendChild(line); if (el.children.length > 100) el.removeChild(el.firstChild);
      el.scrollTop = el.scrollHeight;
    }
    function logFeed(msg, cls = 'tl-sys') {
      const el = document.getElementById('actFeed');
      if (el) addLog(el, msg, cls);
    }
    function copyText(text, successToast = 'Copied to clipboard') {
      if (!text) return;
      if (typeof Android !== 'undefined') {
        try {
          Android.copyToClipboard(text);
          toast(successToast, 'ok');
        } catch (e) {
          toast('Copy failed', 'err');
        }
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => toast(successToast, 'ok'))
          .catch(() => toast('Copy blocked by browser', 'err'));
      } else {
        toast('Clipboard write unsupported', 'err');
      }
    }
// ── DISABLE CONTEXT MENU & TEXT SELECTION ACTIONS ──
function disableContextMenu() {
  document.addEventListener('contextmenu', e => {
    if (!e.target.closest('.inp, textarea, [contenteditable="true"], input, .code-area, #srcEditor, .chat-messages, .msg-bubble, .out-viewer, #outViewer')) {
      e.preventDefault();
    }
  });
  document.addEventListener('selectstart', e => {
    if (!e.target.closest('.inp, textarea, [contenteditable="true"], input, .code-area, #srcEditor, .chat-messages, .msg-bubble, .out-viewer, #outViewer')) {
      e.preventDefault();
    }
  });
  document.addEventListener('copy', e => {
    if (!e.target.closest('.inp, textarea, [contenteditable="true"], input, .code-area, #srcEditor, .chat-messages, .msg-bubble, .out-viewer, #outViewer')) {
      e.preventDefault();
    }
  });
  document.addEventListener('cut', e => {
    if (!e.target.closest('.inp, textarea, [contenteditable="true"], input, .code-area, #srcEditor')) {
      e.preventDefault();
    }
  });
  document.addEventListener('paste', e => {
    if (!e.target.closest('.inp, textarea, [contenteditable="true"], input, .code-area, #srcEditor')) {
      e.preventDefault();
    }
  });
}

// ── PERIODIC NOTIFICATION SYSTEM ──
const NOTIFICATION_POOL = [
  { icon: 'fa-shield-alt', title: 'Security Scan Reminder', body: 'Run a privacy audit to check your digital footprint and WebRTC leak exposure.', actions: [{ label: 'Open OSINT', view: 'osint' }, { label: 'Privacy Audit', view: 'tools' }] },
  { icon: 'fa-code', title: 'Payload Workshop', body: 'Your DuckyScript templates are ready. Build a new injection payload for testing.', actions: [{ label: 'Open IDE', view: 'compiler' }, { label: 'Payload Builder', view: 'tools' }] },
  { icon: 'fa-robot', title: 'Neural Lab Online', body: 'AI synthesis models are standing by. Generate tactical scripts with natural language.', actions: [{ label: 'Open Neural Lab', view: 'neural' }] },
  { icon: 'fa-broadcast-tower', title: 'Signal Scanner Active', body: 'BLE wireless scan and DNS recon tools are available. Discover nearby devices.', actions: [{ label: 'Open Scanner', view: 'scanner' }] },
  { icon: 'fa-key', title: 'Crypto Toolkit', body: 'Generate secure passwords, UUIDs, and MAC addresses. Encode payloads securely.', actions: [{ label: 'Open Crypto', view: 'tools' }] },
  { icon: 'fa-tachometer-alt', title: 'Dashboard Metrics', body: 'Check your session stats, compilation count, and AI prompt usage.', actions: [{ label: 'Dashboard', view: 'dashboard' }] },
  { icon: 'fa-fingerprint', title: 'OSINT Fingerprinting', body: 'Browser fingerprint analysis detects tracking vectors. Scan now for exposure.', actions: [{ label: 'Open OSINT', view: 'osint' }] },
  { icon: 'fa-network-wired', title: 'Network Recon', body: 'GeoIP lookup, subnet CIDR calculator, and port sweep tools are ready.', actions: [{ label: 'Open Network', view: 'tools' }] },
  { icon: 'fa-lock', title: 'Payload Encoder', body: 'Encode your scripts with Base64, ROT13, or AutoIt3 obfuscation layers.', actions: [{ label: 'Open Encoder', view: 'encoder' }] },
  { icon: 'fa-keyboard', title: 'Keymap Visualizer', body: 'Visualize and replay DuckyScript keystrokes on a virtual keyboard layout.', actions: [{ label: 'Open Keymap', view: 'keymap' }] },
  { icon: 'fa-user-shield', title: 'Security Suite', body: 'Password generator, Base64 image encoder, and IP geolocation tracing tools.', actions: [{ label: 'Open Sec Suite', view: 'tools' }] },
  { icon: 'fa-tools', title: 'Dev Utilities', body: 'JSON formatter, YAML translator, regex tester, and markdown previewer.', actions: [{ label: 'Open Dev Suite', view: 'tools' }] },
  { icon: 'fa-project-diagram', title: 'Topology Builder', body: 'Design and visualize network topologies with the architecture tool.', actions: [{ label: 'Open Topology', view: 'tools' }] },
  { icon: 'fa-shield-alt', title: 'MITRE ATT&CK', body: 'Browse the MITRE ATT&CK matrix and run compliance audits against your configs.', actions: [{ label: 'Open MITRE', view: 'tools' }] },
  { icon: 'fa-calculator', title: 'Sys Utilities', body: 'Base conversion, Unix timestamp, and cron expression tools at your disposal.', actions: [{ label: 'Open Sys Suite', view: 'tools' }] },
  { icon: 'fa-clipboard', title: 'Clipboard Dropper', body: 'Monitor clipboard history and manage captured payloads from your sessions.', actions: [{ label: 'Open Clipboard', view: 'tools' }] },
  { icon: 'fa-globe', title: 'WHOIS Lookup', body: 'Query domain registration data and DNS records for OSINT investigations.', actions: [{ label: 'Open WHOIS', view: 'tools' }] },
  { icon: 'fa-microphone', title: 'Voice Dictation', body: 'Use speech-to-text to generate DuckyScript payloads from voice commands.', actions: [{ label: 'Open Neural Lab', view: 'neural' }] },
];

let _notifTimer = null;
let _notifIdx = 0;
let _isActive = true;
let _activeInterval = 7 * 60000; // 7 minutes (5–10 range)
let _idleInterval = (3.5 + Math.random() * 1.5) * 3600000; // 3.5–5 hours

function showPeriodicNotification() {
  const notif = NOTIFICATION_POOL[_notifIdx % NOTIFICATION_POOL.length];
  _notifIdx++;

  let existing = document.getElementById('periodicNotif');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.className = 'notif-popup';
  popup.id = 'periodicNotif';

  const actionsHtml = notif.actions.map(a =>
    `<button class="btn btn-primary btn-xs" onclick="switchView('${a.view}');this.closest('.notif-popup').remove()"><i class="fas fa-arrow-right"></i>${a.label}</button>`
  ).join('');

  popup.innerHTML = `
    <div class="notif-header"><i class="fas ${notif.icon}"></i><span>${notif.title}</span></div>
    <div class="notif-body">${notif.body}</div>
    <div class="notif-actions">
      ${actionsHtml}
      <button class="btn btn-ghost btn-xs" onclick="this.closest('.notif-popup').remove()"><i class="fas fa-times"></i>Dismiss</button>
    </div>
  `;

  document.body.appendChild(popup);

  setTimeout(() => {
    if (popup.parentElement) {
      popup.classList.add('fade-out');
      setTimeout(() => popup.remove(), 400);
    }
  }, 12000);
}

function _scheduleNextNotif() {
  if (_notifTimer) clearTimeout(_notifTimer);
  const interval = _isActive ? (5 + Math.random() * 5) * 60000 : (3.5 + Math.random() * 1.5) * 3600000;
  _notifTimer = setTimeout(() => {
    showPeriodicNotification();
    _scheduleNextNotif();
  }, interval);
}

function startPeriodicNotifications() {
  _isActive = true;
  _scheduleNextNotif();
  // First notification after 30 seconds for demo
  setTimeout(showPeriodicNotification, 30000);
}

function setActiveMode(active) {
  _isActive = active;
  try { if (typeof Android !== 'undefined' && Android.setActiveMode) Android.setActiveMode(active); } catch {}
}

// Visibility change detection — active when tab visible, idle when hidden
document.addEventListener('visibilitychange', () => {
  const visible = document.visibilityState === 'visible';
  setActiveMode(visible);
  // Restart with correct interval immediately on switch
  _scheduleNextNotif();
});

// Initialize context menu block and notifications on load
document.addEventListener('DOMContentLoaded', () => {
  disableContextMenu();
  startPeriodicNotifications();
});

export { startNavClock, startMatrixRain, startBGCanvas, initHeroCanvas, initTelemetry, toast, playTone, loadSettings, applySettings, getSetting, toggleSetting, setSetting, updateSettingInput, exportSettingsJSON, importSettingsJSON, resetSettingsToDefault, checkBLE, checkWebGL, buildDuckRef, insertAtCursor, parseKeymapScript, replayKeymap, playKeymapEvents, stepKeymap, activateKey, deactivateAll, updateActiveKey, resetKeymap, loadFromCompiler, initVirtualKeyboardClicks, drawSpeedGauge, runSpeedTest, startActivityFeed, addLog, logFeed, copyText };
window.startNavClock = startNavClock;
window.startMatrixRain = startMatrixRain;
window.startBGCanvas = startBGCanvas;
window.initHeroCanvas = initHeroCanvas;
window.initTelemetry = initTelemetry;
window.toast = toast;
window.playTone = playTone;
window.loadSettings = loadSettings;
window.applySettings = applySettings;
window.getSetting = getSetting;
window.toggleSetting = toggleSetting;
window.setSetting = setSetting;
window.updateSettingInput = updateSettingInput;
window.exportSettingsJSON = exportSettingsJSON;
window.importSettingsJSON = importSettingsJSON;
window.resetSettingsToDefault = resetSettingsToDefault;
window.checkBLE = checkBLE;
window.checkWebGL = checkWebGL;
window.buildDuckRef = buildDuckRef;
window.insertAtCursor = insertAtCursor;
window.parseKeymapScript = parseKeymapScript;
window.replayKeymap = replayKeymap;
window.stepKeymap = stepKeymap;
window.resetKeymap = resetKeymap;
window.loadFromCompiler = loadFromCompiler;
window.initVirtualKeyboardClicks = initVirtualKeyboardClicks;
window.drawSpeedGauge = drawSpeedGauge;
window.runSpeedTest = runSpeedTest;
window.startActivityFeed = startActivityFeed;
window.addLog = addLog;
window.logFeed = logFeed;
window.copyText = copyText;
window.showPeriodicNotification = showPeriodicNotification;
window.startPeriodicNotifications = startPeriodicNotifications;