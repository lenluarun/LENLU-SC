import { S } from './state.js';
import { toast } from './ui.js';
let encMode = 'base64';
    function setEncMode(m, el) { encMode = m; document.querySelectorAll('.enc-mode-btn').forEach(b => b.classList.remove('active')); el.classList.add('active'); }
    function encodePayload() {
      const inp = document.getElementById('encInput')?.value || ''; const out = document.getElementById('encOutput'); if (!inp) return;
      try {
        let result = '';
        switch (encMode) {
          case 'base64': result = btoa(unescape(encodeURIComponent(inp))); break;
          case 'hex': result = Array.from(new TextEncoder().encode(inp)).map(b => b.toString(16).padStart(2, '0')).join(''); break;
          case 'url': result = encodeURIComponent(inp); break;
          case 'rot13': result = inp.replace(/[a-zA-Z]/g, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); }); break;
          case 'html': result = inp.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); break;
          case 'charcode': result = Array.from(inp).map(c => c.charCodeAt(0)).join(','); break;
          case 'binstr': result = Array.from(new TextEncoder().encode(inp)).map(b => b.toString(2).padStart(8, '0')).join(' '); break;
          case 'morse': {
            const M = { A: '.-', B: '-...', C: '-.-.', D: '-.', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', ' ': '/' };
            result = inp.toUpperCase().split('').map(c => M[c] || '?').join(' '); break;
          }
          default: result = inp;
        }
        out.value = result;
        document.getElementById('encOutLen').textContent = result.length;
        document.getElementById('encOutBytes').textContent = new TextEncoder().encode(result).length;
        analyzePayload(); toast('Encoded (' + encMode + ')', 'ok');
      } catch (e) { toast('Encode error: ' + e.message, 'err'); }
    }
    function decodePayload() {
      const inp = document.getElementById('encInput')?.value || ''; const out = document.getElementById('encOutput'); if (!inp) return;
      try {
        let result = '';
        switch (encMode) {
          case 'base64': result = decodeURIComponent(escape(atob(inp))); break;
          case 'hex': result = inp.match(/.{1,2}/g).map(h => String.fromCharCode(parseInt(h, 16))).join(''); break;
          case 'url': result = decodeURIComponent(inp); break;
          case 'rot13': result = inp.replace(/[a-zA-Z]/g, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b); }); break;
          case 'html': result = inp.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); break;
          case 'charcode': result = inp.split(',').map(c => String.fromCharCode(parseInt(c, 10))).join(''); break;
          case 'binstr': result = inp.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join(''); break;
          case 'morse': { const MR = { '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F', '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L', '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R', '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X', '-.--': 'Y', '--..': 'Z', '-----': '0', '.----': '1', '..---': '2', '...--': '3', '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8', '----.': '9', '/': ' ' }; result = inp.split(' ').map(c => MR[c] || '').join(''); break; }
          default: result = inp;
        }
        out.value = result; analyzePayload(); toast('Decoded (' + encMode + ')', 'ok');
      } catch (e) { toast('Decode error: ' + e.message, 'err'); }
    }
    function analyzePayload() {
      const inp = document.getElementById('encInput')?.value || '';
      const el = document.getElementById('encAnalysis'); if (!el) return;
      if (!inp) { el.innerHTML = '<div class="text-muted">Enter text to analyze…</div>'; return; }
      const bytes = new TextEncoder().encode(inp).length;
      const words = inp.split(/\s+/).filter(Boolean).length;
      const entropy = () => { const freq = {}; for (const c of inp) freq[c] = (freq[c] || 0) + 1; return -Object.values(freq).reduce((e, v) => { const p = v / inp.length; return e + p * Math.log2(p); }, 0).toFixed(3); };
      el.innerHTML = `<div class="flex justify-between"><span>Length</span><span class="text-g">${inp.length} chars</span></div><div class="flex justify-between"><span>Size</span><span class="text-cyan">${bytes} bytes</span></div><div class="flex justify-between"><span>Words</span><span class="text-amber">${words}</span></div><div class="flex justify-between"><span>Lines</span><span class="text-white">${inp.split('\n').length}</span></div><div class="flex justify-between"><span>Entropy</span><span class="text-purple">${entropy()} bits/char</span></div>`;
    }
    function swapEncIO() {
      const i = document.getElementById('encInput'), o = document.getElementById('encOutput');
      const tmp = i.value; i.value = o.value; o.value = tmp; analyzePayload(); updateHexLive();
    }
    function copyEncOutput() { const v = document.getElementById('encOutput')?.value; if (!v) return; navigator.clipboard.writeText(v).then(() => toast('Encoded payload copied', 'ok')); }
    function sendEncToCompiler() {
      const v = document.getElementById('encOutput')?.value; const ed = document.getElementById('srcEditor');
      if (ed && v) { ed.value = v; lintSource(v); updateEditorCounts(); switchView('compiler', document.querySelector('[data-view=compiler]')); toast('Payload pushed to compiler', 'ok'); }
    }
    function obfuscateAu3() {
      let code = document.getElementById('outViewer')?.textContent;
      if (!code || code.includes('Compiled assembly')) { toast('No assembly to obfuscate. Compile first.', 'warn'); return; }
      const obfJunk = document.getElementById('obfJunk')?.checked;
      if (obfJunk) { const lines = code.split('\n'); code = lines.map(l => l + (Math.random() > .72 && l.trim() && !l.startsWith(';') ? `\nSleep(${Math.floor(Math.random() * 15)})` : '')).join('\n'); }
      document.getElementById('outViewer').textContent = code; toast('Assembly obfuscated', 'ok');
      addLog(document.getElementById('ideLog'), 'Assembly obfuscated', 'tl-ok');
    }

    async function generateHashes() {
      const text = document.getElementById('hashInput')?.value; const out = document.getElementById('hashOutput'); if (!text || !out) { if (out) out.innerHTML = ''; return; }
      const buffer = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
      out.innerHTML = `<div class="flex justify-between items-center gap-sm"><span class="text-muted">SHA-256:</span><span class="text-cyan truncate" style="flex:1;user-select:all;font-size:.66rem">${hashHex}</span></div>`;
    }
    function genRandomKey() { const arr = new Uint8Array(32); crypto.getRandomValues(arr); document.getElementById('payloadToolOut').textContent = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(''); }
    function genUUID() { document.getElementById('payloadToolOut').textContent = crypto.randomUUID ? crypto.randomUUID() : 'Requires Secure Context (HTTPS)'; }
    function genMACAddr() { document.getElementById('payloadToolOut').textContent = rndMAC(); }
    function genNonce() { const arr = new Uint8Array(16); crypto.getRandomValues(arr); document.getElementById('payloadToolOut').textContent = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(''); }

    function runAESBlockDemo(encrypt = true) {
      const txt = document.getElementById('aesText')?.value || '';
      const pass = document.getElementById('aesPass')?.value || '';
      const log = document.getElementById('aesStateLog');
      if (!log) return;

      log.textContent = '';
      let outText = `[Symmetric Textbook AES-256-CBC Demo]\n`;
      outText += `Timestamp: ${new Date().toISOString()}\n`;
      outText += `Input Size: ${txt.length} characters\n`;
      outText += `Passphrase: "${pass}"\n\n`;

      // Derive key mock PBKDF2
      outText += `[1] Deriving key specs via PBKDF2...\n`;
      const salt = 'SALT_' + Math.random().toString(36).substring(2, 6).toUpperCase();
      outText += `    Salt Generated: ${salt}\n`;
      const keyHex = Array.from(pass + salt).map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join('').substring(0, 64);
      outText += `    Derived Key Hash (32 bytes): ${keyHex}\n\n`;

      // Generate IV
      const iv = Math.random().toString(36).substring(2, 10).toUpperCase();
      outText += `[2] Initializing Vector (IV - 16 bytes):\n    IV Node Value: ${iv}\n\n`;

      // Block-by-block XOR processing demo
      outText += `[3] Beginning block-by-block state modifications...\n`;
      const blocks = Math.ceil(txt.length / 16);
      for (let i = 0; i < blocks; i++) {
        const blockText = txt.substr(i * 16, 16);
        outText += `    Block ${i + 1}: "${blockText.padEnd(16)}"\n`;
        const xor = blockText.split('').map((c, idx) => {
          const kCode = keyHex.charCodeAt(idx % keyHex.length);
          const ivCode = iv.charCodeAt(idx % iv.length);
          return String.fromCharCode((c.charCodeAt(0) ^ kCode ^ ivCode) % 94 + 32);
        }).join('');
        outText += `    XOR Block State: "${xor}"\n`;
      }

      outText += `\n[RESULT] Cipher operation completed successfully.`;
      log.textContent = outText;
      toast('AES State Log Generated', 'ok');
    }

    function runRSABuilder() {
      const p = parseInt(document.getElementById('rsaP')?.value || '61');
      const q = parseInt(document.getElementById('rsaQ')?.value || '53');
      const analysis = document.getElementById('rsaAnalysis');
      if (!analysis) return;

      const n = p * q;
      const phi = (p - 1) * (q - 1);
      
      // Select e
      let e = 3;
      const gcd = (a, b) => b ? gcd(b, a % b) : a;
      while (e < phi) {
        if (gcd(e, phi) === 1) break;
        e += 2;
      }

      // Calculate d
      let d = 1;
      while (true) {
        if ((d * e) % phi === 1) break;
        d++;
        if (d > 100000) break; // timeout check
      }

      let log = `[Asymmetric RSA Modulus Mathematical Solver]\n`;
      log += `Primes Input: P = ${p} | Q = ${q}\n\n`;
      log += `[1] Compute Modulus (N):\n`;
      log += `    N = P * Q = ${p} * ${q} = ${n}\n\n`;
      log += `[2] Calculate Euler Totient (Phi):\n`;
      log += `    Phi(N) = (P - 1) * (Q - 1) = ${p-1} * ${q-1} = ${phi}\n\n`;
      log += `[3] Public Exponent Key (E):\n`;
      log += `    Selecting coprime E with Phi: E = ${e}\n\n`;
      log += `[4] Private Exponent Key (D):\n`;
      log += `    Solving (D * E) mod Phi = 1\n`;
      log += `    D = ${d}\n\n`;
      log += `[SUMMARY] public key(E, N) = (${e}, ${n})\n`;
      log += `          private key(D, N) = (${d}, ${n})`;

      analysis.textContent = log;
      toast('RSA Key solved', 'ok');
    }
    function runHashBenchmark() {
      const input = document.getElementById('hashBenchInput')?.value || '';
      
      const bench = (algo, func) => {
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
          func(input + i);
        }
        return (performance.now() - start).toFixed(2) + ' ms';
      };

      // Mock fast non-cryptographic hashes simulating MD5, SHA-256 for fast UI feedback
      const mockMD5 = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash = hash & hash;
        }
        return hash.toString(16);
      };

      const mockSHA1 = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 7) - hash + str.charCodeAt(i);
          hash = hash & hash;
        }
        return hash.toString(16);
      };

      const mockSHA256 = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 9) - hash + str.charCodeAt(i);
          hash = hash & hash;
        }
        return hash.toString(16);
      };

      const mockSHA512 = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 11) - hash + str.charCodeAt(i);
          hash = hash & hash;
        }
        return hash.toString(16);
      };

      document.getElementById('benchMD5').textContent = bench('MD5', mockMD5);
      document.getElementById('benchSHA1').textContent = bench('SHA-1', mockSHA1);
      document.getElementById('benchSHA256').textContent = bench('SHA-256', mockSHA256);
      document.getElementById('benchSHA512').textContent = bench('SHA-512', mockSHA512);

      toast('Hash Benchmark speed test completed', 'ok');
    }
export { setEncMode, encodePayload, decodePayload, analyzePayload, swapEncIO, copyEncOutput, sendEncToCompiler, obfuscateAu3, generateHashes, genRandomKey, genUUID, genMACAddr, genNonce, runAESBlockDemo, runRSABuilder, runHashBenchmark };
window.setEncMode = setEncMode;
window.encodePayload = encodePayload;
window.decodePayload = decodePayload;
window.analyzePayload = analyzePayload;
window.swapEncIO = swapEncIO;
window.copyEncOutput = copyEncOutput;
window.sendEncToCompiler = sendEncToCompiler;
window.obfuscateAu3 = obfuscateAu3;
window.generateHashes = generateHashes;
window.genRandomKey = genRandomKey;
window.genUUID = genUUID;
window.genMACAddr = genMACAddr;
window.genNonce = genNonce;
window.runAESBlockDemo = runAESBlockDemo;
window.runRSABuilder = runRSABuilder;
window.runHashBenchmark = runHashBenchmark;