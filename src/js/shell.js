import { S } from './state.js';
import { toast } from './ui.js';
import { clearDatabase } from './db.js';
    async function runOSINT() {
      const ua = navigator.userAgent;
      document.getElementById('fp-ua').textContent = ua;
      const engine = ua.includes('Chrome') ? 'Blink (Chrome)' : ua.includes('Firefox') ? 'Gecko (Firefox)' : ua.includes('Safari') ? 'WebKit (Safari)' : 'Unknown';
      document.getElementById('fp-engine').textContent = engine;
      document.getElementById('fp-platform').textContent = navigator.platform || 'N/A';
      document.getElementById('fp-lang').textContent = (navigator.languages || [navigator.language]).join(', ') || 'N/A';
      document.getElementById('fp-tz').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'N/A';
      document.getElementById('fp-screen').textContent = screen.width + '×' + screen.height;
      document.getElementById('fp-color').textContent = screen.colorDepth + ' bit';
      document.getElementById('fp-dpr').textContent = (window.devicePixelRatio || 1).toFixed(2) + 'x';
      document.getElementById('fp-cpu').textContent = (navigator.hardwareConcurrency || 'N/A') + ' cores';
      document.getElementById('fp-mem').textContent = (navigator.deviceMemory || 'N/A') + ' GB';
      document.getElementById('fp-touch').textContent = navigator.maxTouchPoints || 0;
      document.getElementById('fp-dnt').textContent = navigator.doNotTrack || 'N/A';
      document.getElementById('fp-cookie').textContent = navigator.cookieEnabled ? 'Yes' : 'No';
      document.getElementById('fp-online').textContent = navigator.onLine ? 'Yes' : 'No';

      if (typeof Android !== 'undefined') {
        try {
          const sys = JSON.parse(Android.getSystemInfo());
          document.getElementById('fp-platform').textContent = `Android ${sys.android_ver} (SDK ${sys.sdk_int})`;
          document.getElementById('fp-cpu').textContent = `${sys.brand} ${sys.model} (${sys.hardware})`;
          document.getElementById('fp-mem').textContent = `${(sys.total_mem / 1024).toFixed(1)} GB (${sys.avail_mem} MB Free)`;
          document.getElementById('fp-ua').textContent = `${ua} | [NATIVE: Battery: ${sys.battery_level}%]`;
        } catch (e) {
          console.error(e);
        }
      }

      // WebGL
      try { const c2 = document.createElement('canvas'); const gl = c2.getContext('webgl') || c2.getContext('experimental-webgl'); const ext = gl?.getExtension('WEBGL_debug_renderer_info'); document.getElementById('fp-webgl').textContent = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'N/A'; } catch { document.getElementById('fp-webgl').textContent = 'N/A'; }

      try { const c2 = document.createElement('canvas'); c2.width = 200; c2.height = 50; const ctx2 = c2.getContext('2d'); ctx2.textBaseline = 'top'; ctx2.font = '14px Arial'; ctx2.fillStyle = '#f60'; ctx2.fillRect(125, 1, 62, 20); ctx2.fillStyle = '#069'; ctx2.fillText('LENLU SC v4.0', 2, 15); ctx2.fillStyle = 'rgba(102,204,0,.7)'; ctx2.fillText('Forge', 4, 17); const hash = c2.toDataURL().split('').reduce((a, c) => (((a << 5) - a) + c.charCodeAt(0)) | 0, 0).toString(16); document.getElementById('fp-canvas').textContent = hash; } catch { document.getElementById('fp-canvas').textContent = 'N/A'; }
      const apiCheck = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = `<span style="color:${val ? 'var(--g)' : 'var(--red)'}">${val ? 'Available' : 'Unavailable'}</span>`; };
      apiCheck('api-ls', !!window.localStorage); apiCheck('api-ss', !!window.sessionStorage); apiCheck('api-idb', !!window.indexedDB); apiCheck('api-ble2', !!navigator.bluetooth); apiCheck('api-usb', !!navigator.usb); apiCheck('api-rtc', !!window.RTCPeerConnection); apiCheck('api-serial', 'serial' in navigator);
      apiCheck('api-notif', 'Notification' in window); apiCheck('api-geo', 'geolocation' in navigator); apiCheck('api-workers', 'Worker' in window); apiCheck('api-sw', 'serviceWorker' in navigator); apiCheck('api-audio2', !!(window.AudioContext || window.webkitAudioContext));
      const fp = [ua, engine, navigator.platform || '', (navigator.languages || []).join('|'), Intl.DateTimeFormat().resolvedOptions().timeZone || '', screen.width + 'x' + screen.height, screen.colorDepth, window.devicePixelRatio || 1, navigator.hardwareConcurrency || '', navigator.deviceMemory || '', navigator.maxTouchPoints || 0, navigator.cookieEnabled, document.getElementById('fp-webgl')?.textContent || '', document.getElementById('fp-canvas')?.textContent || ''].join('::');
      let hash = 'unavailable';
      try { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fp)); hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join(''); } catch { hash = fp.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0) | 0, 0).toString(16); }
      document.getElementById('fpHash').textContent = hash;
      const uniqueness = Math.min(98, 45 + (navigator.hardwareConcurrency || 2) * 3 + (window.devicePixelRatio || 1) * 7 + (navigator.languages?.length || 1) * 4);
      const plugins = Math.min(100, Array.from(navigator.plugins || []).length * 12);
      const canvas = Math.min(100, Math.abs(parseInt((document.getElementById('fp-canvas')?.textContent || '0').replace('-', ''), 16) || 50) % 100);
      const net = navigator.onLine ? 38 : 12;
      const score = Math.max(8, Math.round(100 - (uniqueness * .36 + plugins * .22 + canvas * .24 + net * .18)));
      const setBar = (id, val) => { const pct = Math.round(val) + '%'; document.getElementById('osint-' + id + '-pct').textContent = pct; document.getElementById('osint-' + id + '-bar').style.width = pct; };
      setBar('unique', uniqueness); setBar('plugin', plugins); setBar('canvas', canvas); setBar('net', net);
      document.getElementById('stealthScoreVal').textContent = score;
      document.getElementById('stealthAdvice').textContent = score > 70 ? 'Low exposure profile. Keep WebRTC and unique APIs minimized.' : score > 40 ? 'Moderate fingerprint uniqueness. Disable unused APIs and reduce browser entropy.' : 'High uniqueness detected. Consider a hardened browser profile and stricter privacy settings.';

      // Load Leaflet Map based on Geolocation resolved coordinates or falls back to public GeoIP databases
      if (!S.locationInfo) {
        await fetchLocation();
      }
      const loc = S.locationInfo || { city: 'Local Area', isp: 'Private Node', country: 'Localhost', ip: '127.0.0.1' };
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            loadLeafletAndDrawMap(pos.coords.latitude, pos.coords.longitude, loc.city);
          },
          () => {
            // Fallback: Mock slightly shifted coordinate offsets based on resolved ISP location
            const latMock = 37.7749 + (Math.random() - 0.5) * 0.15;
            const lonMock = -122.4194 + (Math.random() - 0.5) * 0.15;
            loadLeafletAndDrawMap(latMock, lonMock, loc.city);
          },
          { timeout: 5000 }
        );
      } else {
        const latMock = 37.7749 + (Math.random() - 0.5) * 0.15;
        const lonMock = -122.4194 + (Math.random() - 0.5) * 0.15;
        loadLeafletAndDrawMap(latMock, lonMock, loc.city);
      }

      toast('OSINT fingerprint scan complete', 'ok');
    }

    function exportOSINT() { downloadTxt(['LENLU SC Forge v4.0 - OSINT Report', 'Generated: ' + new Date().toISOString(), '', '=== Browser Fingerprint ===', document.getElementById('osintBrowserGrid')?.innerText || '', '', '=== APIs ===', document.getElementById('osintAPIs')?.innerText || '', '', '=== Hash ===', document.getElementById('fpHash')?.textContent || ''].join('\n'), 'osint_report.txt'); }
    function copyFPHash() { const hash = document.getElementById('fpHash')?.textContent || ''; if (!hash || hash.startsWith('--')) return toast('Run OSINT scan first', 'warn'); navigator.clipboard.writeText(hash).then(() => toast('Fingerprint hash copied', 'ok')).catch(() => toast('Clipboard unavailable', 'err')); }
    function initShell() { const out = document.getElementById('shellOutput'); if (!out) return; out.innerHTML = ''; shellPrint('LENLU SC Forge shell initialized. Type help for commands.', 'tl-ok'); }
    function shellPrint(msg, cls = 'tl-sys') { const out = document.getElementById('shellOutput'); if (!out) return; const line = document.createElement('div'); line.className = cls; line.textContent = msg; out.appendChild(line); out.scrollTop = out.scrollHeight; }
    function shellKey(e) { if (e.key === 'ArrowUp') { e.preventDefault(); if (S.shellHistory.length) { S.shellHistIdx = Math.max(0, S.shellHistIdx - 1); e.target.value = S.shellHistory[S.shellHistIdx] || ''; } return; } if (e.key === 'ArrowDown') { e.preventDefault(); S.shellHistIdx = Math.min(S.shellHistory.length, S.shellHistIdx + 1); e.target.value = S.shellHistory[S.shellHistIdx] || ''; return; } if (e.key !== 'Enter') return; const cmd = e.target.value.trim(); e.target.value = ''; if (!cmd) return; S.shellHistory.push(cmd); S.shellHistIdx = S.shellHistory.length; shellPrint('lenlu@forge:~$ ' + cmd, 'tl-info'); runShellCommand(cmd); }
    function runShellCommand(cmd) { const [name, ...args] = cmd.split(/\s+/); const lower = name.toLowerCase(); const src = document.getElementById('srcEditor')?.value || ''; const commands = { help: () => ['Commands: help, status, compile, clear, history, vault, osint, network, encode <text>, hash <text>, session, wipe'], status: () => [`Session ${S.sessionId}`, `Compiled: ${S.stats.compiled}`, `AI prompts: ${S.stats.ai}`, `Scans: ${S.stats.scans}`, `Vault items: ${S.vault.length}`], compile: () => { compilePayload(); return ['Compile pipeline executed.']; }, clear: () => { clearShell(); return []; }, history: () => S.history.length ? S.history.map((h, i) => `${i + 1}. ${new Date(h.ts).toLocaleTimeString()} - ${h.src.length} chars`) : ['No compile history.'], vault: () => S.vault.length ? S.vault.map((v, i) => `${i + 1}. ${v.name} (${v.code.length} chars)`) : ['Vault is empty.'], osint: () => { runOSINT(); return ['OSINT scan started.']; }, network: () => { refreshNetworkInfo(); return ['Network refresh started.']; }, encode: () => [btoa(unescape(encodeURIComponent(args.join(' '))))], hash: () => { document.getElementById('hashInput').value = args.join(' ') || src; generateHashes(); return ['SHA-256 generated in encoder tools.']; }, session: () => [`Session ID: ${S.sessionId}`], wipe: () => { wipeSession(); return []; } }; const fn = commands[lower]; if (!fn) { shellPrint('Unknown command: ' + name + ' (type help)', 'tl-err'); return; } const lines = fn() || []; lines.forEach(l => shellPrint(l, 'tl-ok')); }
    function clearShell() { const out = document.getElementById('shellOutput'); if (out) out.innerHTML = ''; }
    function wipeSession() { if (!confirm('Wipe all LENLU SC session data from this browser?')) return;['lenlu_booted4', 'lenlu_cfg4', 'lenlu_src4', 'lenlu_vault4', 'lenlu_ai4', 'lenlu_hist4'].forEach(k => localStorage.removeItem(k)); clearDatabase(); S.history = []; S.vault = []; renderVault(); renderHistory(); clearShell(); document.getElementById('srcEditor').value = ''; document.getElementById('outViewer').textContent = '; Compiled assembly will appear here.'; toast('Session data wiped', 'warn'); }

export { runOSINT, exportOSINT, copyFPHash, initShell, shellPrint, shellKey, runShellCommand, clearShell, wipeSession };
window.runOSINT = runOSINT;
window.exportOSINT = exportOSINT;
window.copyFPHash = copyFPHash;
window.initShell = initShell;
window.shellPrint = shellPrint;
window.shellKey = shellKey;
window.runShellCommand = runShellCommand;
window.clearShell = clearShell;
window.wipeSession = wipeSession;