import { S, ACTS } from './state.js';
const DEFS = { crt: true, rain: true, particles: true, audio: true, lint: true, persist: true, hist: true, grain: true, vignette: true, hexdump: false };
let _aCtx = null;
let _speedTestRunning = false;
    function startNavClock() {
      const el = document.getElementById('navClock');
      const update = () => el.textContent = new Date().toTimeString().substr(0, 8);
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
        const theme = document.documentElement.getAttribute('data-theme') || 'cyber';
        const isSkeu = theme === 'skeu';
        for (let i = 0; i < drops.length; i++) {
          const t = chars[Math.floor(Math.random() * chars.length)];
          const b = Math.random();
          if (isSkeu) {
            ctx.fillStyle = b > .96 ? '#fff' : b > .82 ? '#e8b84e' : '#7d5a3c';
          } else {
            ctx.fillStyle = b > .96 ? '#fff' : b > .82 ? '#00ff41' : '#007a20';
          }
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
        const theme = document.documentElement.getAttribute('data-theme') || 'cyber';
        const isSkeu = theme === 'skeu';
        const connectionColorBase = isSkeu ? '200,146,42' : '0,255,65';
        const particleColor = isSkeu ? 'rgba(200,146,42,.4)' : 'rgba(0,255,65,.4)';
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
        const theme = document.documentElement.getAttribute('data-theme') || 'cyber';
        const isSkeu = theme === 'skeu';
        const colorG = isSkeu ? 'rgba(200,146,42,.7)' : 'rgba(0,255,65,.7)';
        const colorC = isSkeu ? 'rgba(140,155,171,.6)' : 'rgba(8,247,254,.5)';
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
        const o = _aCtx.createOscillator(), g = _aCtx.createGain();
        o.connect(g); g.connect(_aCtx.destination); o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, _aCtx.currentTime); g.gain.exponentialRampToValueAtTime(.001, _aCtx.currentTime + dur);
        o.start(); o.stop(_aCtx.currentTime + dur);
      } catch (e) { }
    }
    function loadSettings() {
      try { const s = JSON.parse(localStorage.getItem('lenlu_cfg4') || '{}'); S.settings = { ...DEFS, ...s }; } catch { S.settings = { ...DEFS }; }
      applySettings();
    }
    function applySettings() {
      document.getElementById('crtLayer').style.display = S.settings.crt ? '' : 'none';
      document.getElementById('matrixRain').style.opacity = S.settings.rain ? '.1' : '0';
      document.getElementById('filmGrain').style.display = S.settings.grain ? '' : 'none';
      document.querySelectorAll('.toggle').forEach(t => { const k = t.id.replace('tog-', ''); if (k in S.settings) t.className = 'toggle' + (S.settings[k] ? ' on' : ''); });
      const bg = document.getElementById('bgCanvas');
      const vig = document.getElementById('vignetteLayer');
      if (bg) bg.style.display = S.settings.particles ? '' : 'none';
      if (vig) vig.style.display = S.settings.vignette ? '' : 'none';
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
      if (!src) { toast('No script to parse', 'warn'); return; }
      S.keymapEvents = []; S.keymapStep = 0;
      let totalKeys = 0, delays = 0, strings = 0;
      const lines = src.split('\n');
      const ts = new Date().toTimeString().substr(0, 8);
      timeline.innerHTML = `<div class="tl-line tl-info"><span class="tl-ts">[${ts}]</span>Parsed ${lines.length} lines</div>`;
      lines.forEach((raw, i) => {
        const t = raw.trim(); if (!t || t.startsWith('REM') || t.startsWith(';')) return;
        const parts = t.split(/\s+/); const cmd = parts[0].toUpperCase(); const arg = parts.slice(1).join(' ');
        if (cmd === 'DELAY') { delays++; S.keymapEvents.push({ type: 'delay', ms: parseInt(arg) || 100 }); addLog(timeline, `DELAY ${arg}ms`, 'tl-sys'); }
        else if (cmd === 'STRING' || cmd === 'STRINGLN') { strings++; arg.split('').forEach(ch => { S.keymapEvents.push({ type: 'char', char: ch, key: ch.toUpperCase() }); totalKeys++; }); if (cmd === 'STRINGLN') { S.keymapEvents.push({ type: 'key', key: 'ENTER' }); totalKeys++; } }
        else if (cmd in DUCK_KEY_MAP) { S.keymapEvents.push({ type: 'key', key: DUCK_KEY_MAP[cmd] }); totalKeys++; addLog(timeline, cmd + ' → key: ' + DUCK_KEY_MAP[cmd], 'tl-ok'); }
        else if (cmd === 'GUI') { S.keymapEvents.push({ type: 'key', key: 'GUI' }); if (arg) { arg.split(' ').forEach(k => { S.keymapEvents.push({ type: 'key', key: k.toUpperCase() }); totalKeys++; }); } totalKeys++; }
        else if (cmd === 'CTRL') { S.keymapEvents.push({ type: 'combo', keys: ['CTRL', arg.toUpperCase()] }); totalKeys += 2; }
        else if (cmd === 'ALT') { S.keymapEvents.push({ type: 'combo', keys: ['ALT', arg.toUpperCase()] }); totalKeys += 2; }
        else if (cmd === 'SHIFT') { S.keymapEvents.push({ type: 'combo', keys: ['LSHIFT', arg.toUpperCase()] }); totalKeys += 2; }
        else if (/^F([1-9]|1[0-2])$/.test(cmd)) { S.keymapEvents.push({ type: 'key', key: cmd }); totalKeys++; addLog(timeline, cmd, 'tl-ok'); }
      });
      document.getElementById('km-total').textContent = totalKeys;
      document.getElementById('km-delays').textContent = delays;
      document.getElementById('km-strings').textContent = strings;
      document.getElementById('keymapBadge').textContent = totalKeys + ' KEYS';
      toast('Keymap parsed: ' + totalKeys + ' keystrokes', 'ok');
    }
    function replayKeymap() {
      if (!S.keymapEvents.length) { parseKeymapScript(); return; }
      S.keymapStep = 0; if (S.keymapTimer) clearTimeout(S.keymapTimer);
      document.getElementById('keymapBadge').textContent = 'PLAYING';
      document.getElementById('keymapBadge').className = 'badge badge-g';
      playKeymapEvents();
    }
    function playKeymapEvents() {
      if (S.keymapStep >= S.keymapEvents.length) { document.getElementById('keymapBadge').textContent = 'DONE'; return; }
      const ev = S.keymapEvents[S.keymapStep++];
      let delay = 80;
      if (ev.type === 'delay') { delay = Math.min(ev.ms, 2000); updateActiveKey('WAIT', 'DELAY ' + ev.ms + 'ms'); deactivateAll(); }
      else if (ev.type === 'key') { activateKey(ev.key); updateActiveKey(ev.key, 'KEYPRESS'); delay = 120; }
      else if (ev.type === 'char') { activateKey(ev.key); updateActiveKey(ev.key, 'STRING'); delay = 80; }
      else if (ev.type === 'combo') { ev.keys.forEach(k => activateKey(k)); updateActiveKey(ev.keys.join('+'), 'COMBO'); delay = 150; }
      S.keymapTimer = setTimeout(() => { deactivateAll(); playKeymapEvents(); }, delay);
    }
    function stepKeymap() {
      if (!S.keymapEvents.length) { parseKeymapScript(); return; }
      if (S.keymapStep >= S.keymapEvents.length) { S.keymapStep = 0; deactivateAll(); return; }
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
        ' ': 'SPACE',
        '/': 'SLASH',
        '.': 'DOT',
        ',': 'COMMA',
        '-': 'MINUS',
        '=': 'EQUAL',
        ';': 'SEMICOLON',
        "'": 'QUOTE',
        '[': 'LBRACKET',
        ']': 'RBRACKET',
        '\\': 'BACKSLASH',
        '`': 'TILDE',
        '~': 'TILDE'
      };
      if (charMap[target]) {
        target = charMap[target];
      }

      // If we are looking for the "F" key, prevent conflict with F1-F12 keys
      if (target === 'F') {
        target = 'F_KEY';
      }

      const el = document.getElementById('key-' + target);
      if (el) {
        el.classList.add('active', 'key-fire');
        setTimeout(() => el.classList.remove('key-fire'), 350);
      }
    }
    function deactivateAll() { document.querySelectorAll('.key.active').forEach(k => k.classList.remove('active')); }
    function updateActiveKey(k, label) {
      const d = document.getElementById('activeKeyDisplay'); const l = document.getElementById('activeKeyLabel');
      if (d) d.textContent = k.length > 4 ? k.substr(0, 4) : k; if (l) l.textContent = label;
    }
    function resetKeymap() { if (S.keymapTimer) clearTimeout(S.keymapTimer); S.keymapStep = 0; deactivateAll(); updateActiveKey('--', 'STANDBY'); document.getElementById('keymapBadge').textContent = 'IDLE'; document.getElementById('keymapBadge').className = 'badge badge-g'; }
    function loadFromCompiler() { const src = document.getElementById('srcEditor')?.value; if (src) document.getElementById('keymapInput').value = src; parseKeymapScript(); }
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'cyber' ? 'skeu' : 'cyber';
      html.setAttribute('data-theme', next);
      localStorage.setItem('lenlu_theme4', next);
      const label = document.getElementById('themeToggleLabel');
      if (label) label.textContent = next === 'cyber' ? 'Skeuomorph' : 'Cyber';
      const icon = document.querySelector('#themeToggleBtn .ttb-icon i');
      if (icon) {
        icon.className = next === 'cyber' ? 'fas fa-palette' : 'fas fa-bolt';
      }
      // Re-apply matrix rain visibility for theme
      applySettings();
      // Redraw speed gauge with current value to match new theme colors
      const txt = document.getElementById('st-dl')?.textContent;
      const speed = parseFloat(txt) || 0;
      drawSpeedGauge(speed);
      toast('Theme: ' + (next === 'cyber' ? 'CYBER EDITION' : 'ANALOG FORGE'), 'info');
    }

    function loadTheme() {
      const saved = localStorage.getItem('lenlu_theme4') || 'cyber';
      document.documentElement.setAttribute('data-theme', saved);
      const label = document.getElementById('themeToggleLabel');
      if (label) label.textContent = saved === 'cyber' ? 'Skeuomorph' : 'Cyber';
      const icon = document.querySelector('#themeToggleBtn .ttb-icon i');
      if (icon) icon.className = saved === 'cyber' ? 'fas fa-palette' : 'fas fa-bolt';
    }

    function toggleLayout() {
      const html = document.documentElement;
      const current = html.getAttribute('data-layout') || 'cyber';
      const next = current === 'cyber' ? 'skeu' : 'cyber';
      changeLayout(next);
      toast('Layout: ' + (next === 'cyber' ? 'CYBER GRIDS' : 'ANALOG CONSOLE'), 'info');
    }

    function changeLayout(val) {
      document.documentElement.setAttribute('data-layout', val);
      localStorage.setItem('lenlu_layout4', val);

      const select = document.getElementById('layoutSelect');
      if (select) select.value = val;

      const label = document.getElementById('layoutToggleLabel');
      if (label) label.textContent = val === 'cyber' ? 'Skeu Layout' : 'Cyber Layout';

      const icon = document.querySelector('#layoutToggleBtn .ttb-icon i');
      if (icon) {
        icon.className = val === 'cyber' ? 'fas fa-th-large' : 'fas fa-sliders-h';
      }

      updateSkeuNeedles();
    }

    function loadLayout() {
      const saved = localStorage.getItem('lenlu_layout4') || 'cyber';
      changeLayout(saved);
    }

    function updateSkeuNeedles() {
      const isSkeuLayout = document.documentElement.getAttribute('data-layout') === 'skeu';
      if (!isSkeuLayout) return;

      const items = [
        { valId: 'stat-compiled', needleId: 'needle-compiled', max: 20 },
        { valId: 'stat-ai', needleId: 'needle-ai', max: 20 },
        { valId: 'stat-vault', needleId: 'needle-vault', max: 10 },
        { valId: 'stat-scans', needleId: 'needle-scans', max: 15 },
        { valId: 'sc-nets', needleId: 'needle-sc-nets', max: 12 },
        { valId: 'sc-ble', needleId: 'needle-sc-ble', max: 10 },
        { valId: 'sc-deauth', needleId: 'needle-sc-deauth', max: 5 },
        { valId: 'sc-threats', needleId: 'needle-sc-threats', max: 6 },
        { valId: 'net-latency', needleId: 'needle-net-latency', max: 300 }
      ];

      items.forEach(item => {
        const valEl = document.getElementById(item.valId);
        const needleEl = document.getElementById(item.needleId);
        if (valEl && needleEl) {
          let text = valEl.textContent || '0';
          let num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
          const pct = Math.min(1, num / item.max);
          const deg = -60 + (pct * 120);
          needleEl.style.transform = `rotate(${deg}deg)`;
        }
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

      const theme = document.documentElement.getAttribute('data-theme') || 'cyber';
      const isSkeu = theme === 'skeu';

      // Draw dial background
      if (isSkeu) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = '#ede5d0'; // Ivory2 background
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#5c3d1e'; // Walnut border
        ctx.stroke();
      } else {
        // Cyber: semi-transparent dark circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(3, 8, 4, 0.6)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.25)';
        ctx.stroke();
      }

      // Draw gauge arc
      const startAngle = 0.75 * Math.PI;
      const endAngle = 2.25 * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 8, startAngle, endAngle);
      ctx.strokeStyle = isSkeu ? '#8b1a1a' : 'rgba(8, 247, 254, 0.4)';
      ctx.lineWidth = isSkeu ? 2 : 1;
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
        ctx.strokeStyle = isSkeu ? '#5c3d1e' : 'rgba(0, 255, 65, 0.6)';
        ctx.lineWidth = isSkeu ? 1.5 : 1;
        ctx.stroke();
      }

      // Draw needle
      // Clamp speedVal between 0 and 100 for gauge angle representation
      const speedPct = Math.min(1, Math.max(0, speedVal / 100));
      const targetAngle = startAngle + speedPct * (endAngle - startAngle);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(targetAngle);

      // Draw needle shape
      ctx.beginPath();
      if (isSkeu) {
        ctx.moveTo(0, -3);
        ctx.lineTo(r - 15, 0);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fillStyle = '#8b1a1a'; // Deep red needle
        ctx.fill();

        // Center cap
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#c8922a'; // Brass cap
        ctx.fill();
        ctx.strokeStyle = '#5c3d1e';
        ctx.stroke();
      } else {
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
      }
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

      // Download test (rough estimate using image fetch)
      const dlStart = performance.now();
      const testUrl = 'https://via.assets.so/img.png?w=800&h=600&tc=blue&bg=%23cecece&t=' + Date.now();
      fetch(testUrl, { cache: 'no-store' })
        .then(r => r.blob())
        .then(blob => {
          const elapsed = (performance.now() - dlStart) / 1000;
          const sizeMb = blob.size / (1024 * 1024);
          const speed = (sizeMb * 8 / elapsed).toFixed(1);
          const speedNum = parseFloat(speed);
          clearInterval(needleTimer);
          const finalSpeed = (isNaN(speedNum) || speedNum > 1000) ? Math.floor(Math.random() * 50 + 10) : speedNum;
          drawSpeedGauge(finalSpeed);
          if (dlEl) dlEl.textContent = finalSpeed + ' Mbps';
          const dlLarge = document.getElementById('st-dl-large');
          if (dlLarge) dlLarge.textContent = finalSpeed + ' Mbps';
        }).catch(() => {
          clearInterval(needleTimer);
          const mockSpeed = Math.floor(Math.random() * 50 + 10);
          drawSpeedGauge(mockSpeed);
          if (dlEl) dlEl.textContent = mockSpeed + ' Mbps';
          const dlLarge = document.getElementById('st-dl-large');
          if (dlLarge) dlLarge.textContent = mockSpeed + ' Mbps';
        }).finally(() => {
          // Simulated upload (browsers can't truly test upload to external)
          const ulSpeed = Math.floor(Math.random() * 20 + 5);
          if (ulEl) ulEl.textContent = '~' + ulSpeed + ' Mbps';
          const stUl = document.getElementById('st-ul');
          if (stUl) stUl.textContent = '~' + ulSpeed + ' Mbps';
          _speedTestRunning = false;
          if (btnEl) btnEl.disabled = false;
          toast('Speed test complete', 'ok');
          S.stats.scans++; document.getElementById('stat-scans').textContent = S.stats.scans;
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
export { startNavClock, startMatrixRain, startBGCanvas, initHeroCanvas, initTelemetry, toast, playTone, loadSettings, applySettings, getSetting, toggleSetting, checkBLE, checkWebGL, buildDuckRef, insertAtCursor, parseKeymapScript, replayKeymap, playKeymapEvents, stepKeymap, activateKey, deactivateAll, updateActiveKey, resetKeymap, loadFromCompiler, toggleTheme, toggleLayout, changeLayout, loadLayout, updateSkeuNeedles, drawSpeedGauge, runSpeedTest, startActivityFeed, addLog, logFeed, copyText };
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
window.checkBLE = checkBLE;
window.checkWebGL = checkWebGL;
window.buildDuckRef = buildDuckRef;
window.insertAtCursor = insertAtCursor;
window.parseKeymapScript = parseKeymapScript;
window.replayKeymap = replayKeymap;
window.stepKeymap = stepKeymap;
window.resetKeymap = resetKeymap;
window.loadFromCompiler = loadFromCompiler;
window.toggleTheme = toggleTheme;
window.toggleLayout = toggleLayout;
window.changeLayout = changeLayout;
window.loadLayout = loadLayout;
window.updateSkeuNeedles = updateSkeuNeedles;
window.drawSpeedGauge = drawSpeedGauge;
window.runSpeedTest = runSpeedTest;
window.startActivityFeed = startActivityFeed;
window.addLog = addLog;
window.logFeed = logFeed;
window.copyText = copyText;