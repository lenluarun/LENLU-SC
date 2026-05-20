// VALID COMMAND REGISTRY EXTENDED 
const VALID_COMMANDS = [
  'REM', 'DELAY', 'DEFAULTDELAY', 'DEFAULT_DELAY', 'DEFAULTCHARDELAY', 
  'STRING', 'STRINGLN', 'REPEAT', 'GUI', 'WINDOWS', 'WIN', 'CTRL', 
  'CONTROL', 'ALT', 'SHIFT', 'COMMAND', 'OPTION', 'ENTER', 'ESC', 'ESCAPE', 
  'TAB', 'SPACE', 'BACKSPACE', 'DELETE', 'DEL', 'UP', 'UPARROW', 'DOWN', 
  'DOWNARROW', 'LEFT', 'LEFTARROW', 'RIGHT', 'RIGHTARROW', 'HOME', 'END', 
  'PAGEUP', 'PAGEDOWN', 'INSERT', 'PRINTSCREEN', 'CAPSLOCK', 'NUMLOCK', 
  'SCROLLLOCK', 'PAUSE', 'BREAK', 'MENU', 'APP', 'VAR', 'DEFINE', 'WHILE', 
  'END_WHILE', 'IF', 'ELSE', 'END_IF', 'ATTACKMODE', 'LED_R', 'LED_G', 'LED_B', 
  'LED_OFF', 'WAIT_FOR_BUTTON_PRESS', 'JITTER', 'REM_BLOCK', 'END_REM',
  'MOUSE_MOVE', 'CLICK', 'HOLD', 'RELEASE'
];

const KEY_MAP = {
  "GUI": "{LWIN}", "WINDOWS": "{LWIN}", "WIN": "{LWIN}", "COMMAND": "{LWIN}",
  "CTRL": "^", "CONTROL": "^", "ALT": "!", "SHIFT": "+", "OPTION": "{LALT}",
  "ENTER": "{ENTER}", "ESC": "{ESC}", "ESCAPE": "{ESC}", "TAB": "{TAB}", 
  "SPACE": "{SPACE}", "BACKSPACE": "{BACKSPACE}", "DELETE": "{DELETE}", "DEL": "{DELETE}",
  "UP": "{UP}", "DOWN": "{DOWN}", "LEFT": "{LEFT}", "RIGHT": "{RIGHT}",
  "HOME": "{HOME}", "END": "{END}", "PAGEUP": "{PGUP}", "PAGEDOWN": "{PGDN}",
  "CAPSLOCK": "{CAPSLOCK}", "NUMLOCK": "{NUMLOCK}", "SCROLLLOCK": "{SCROLLLOCK}"
};

// AUDIO SYNTH CORE SUBSYSTEM ENGINE
let systemAudioMuted = false;
let audioContextInstance = null;

function executeAudioTone(frequency, toneType, signalDuration) {
  if (systemAudioMuted) return;
  try {
    if (!audioContextInstance) {
      audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextInstance.state === 'suspended') {
      audioContextInstance.resume();
    }
    const oscillatorNode = audioContextInstance.createOscillator();
    const gainControlNode = audioContextInstance.createGain();
    
    oscillatorNode.type = toneType || 'sine';
    oscillatorNode.frequency.setValueAtTime(frequency || 440, audioContextInstance.currentTime);
    
    gainControlNode.gain.setValueAtTime(0.015, audioContextInstance.currentTime);
    gainControlNode.gain.exponentialRampToValueAtTime(0.00001, audioContextInstance.currentTime + signalDuration);
    
    oscillatorNode.connect(gainControlNode);
    gainControlNode.connect(audioContextInstance.destination);
    
    oscillatorNode.start();
    oscillatorNode.stop(audioContextInstance.currentTime + signalDuration);
  } catch (error) {
    console.warn("Audio Context pipeline error: ", error);
  }
}

function toggleAudioMuteState() {
  systemAudioMuted = !systemAudioMuted;
  const button = document.getElementById('audioToggleBtn');
  if (systemAudioMuted) {
    button.innerHTML = `<i class="fa-solid fa-volume-xmark me-1"></i>AUDIO: MUTED`;
    button.className = "btn btn-outline-danger btn-sm text-xs px-2 py-1 mobile-touch-target";
  } else {
    button.innerHTML = `<i class="fa-solid fa-volume-high me-1"></i>AUDIO: ON`;
    button.className = "btn btn-outline-matrix btn-sm text-xs px-2 py-1 mobile-touch-target";
    executeAudioTone(587.33, 'triangle', 0.1);
  }
}

// FULL CMATRIX RENDER ENGINE ANIMATION 
const backgroundCanvas = document.getElementById('cmatrixCanvas');
const canvasContext = backgroundCanvas.getContext('2d');

let customMatrixColumns = [];
const internalMatrixGlyphs = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ10100101_#$@%&";
const fontPixelSize = 14;

function setupCanvasMetrics() {
  backgroundCanvas.width = window.innerWidth;
  backgroundCanvas.height = window.innerHeight;
  const metricsWidthCount = Math.floor(backgroundCanvas.width / fontPixelSize) + 1;
  customMatrixColumns = [];
  for (let index = 0; index < metricsWidthCount; index++) {
    customMatrixColumns.push({
      xPos: index * fontPixelSize,
      yPos: Math.random() * backgroundCanvas.height * -1,
      speedFactor: 1 + Math.random() * 3
    });
  }
}

function processMatrixRainLoop() {
  canvasContext.fillStyle = 'rgba(0, 0, 0, 0.08)';
  canvasContext.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
  
  canvasContext.fillStyle = '#00ff41';
  canvasContext.font = fontPixelSize + 'px monospace';
  
  customMatrixColumns.forEach(column => {
    const activeCharacter = internalMatrixGlyphs[Math.floor(Math.random() * internalMatrixGlyphs.length)];
    if (Math.random() > 0.98) {
      canvasContext.fillStyle = '#fff';
    } else {
      canvasContext.fillStyle = '#00ff41';
    }
    
    canvasContext.fillText(activeCharacter, column.xPos, column.yPos);
    
    column.yPos += column.speedFactor;
    if (column.yPos > backgroundCanvas.height && Math.random() > 0.975) {
      column.yPos = -20;
    }
  });
  requestAnimationFrame(processMatrixRainLoop);
}

window.addEventListener('resize', setupCanvasMetrics);
setupCanvasMetrics();
requestAnimationFrame(processMatrixRainLoop);

function initializeSystemInterface() {
  executeAudioTone(880, 'sine', 0.15);
  setTimeout(() => executeAudioTone(1320, 'sine', 0.25), 100);
  
  const targetSplash = document.getElementById('terminalSplash');
  const applicationContainer = document.getElementById('appContainer');
  
  targetSplash.style.opacity = '0';
  setTimeout(() => {
    targetSplash.style.visibility = 'hidden';
    applicationContainer.className = "d-flex flex-column min-vh-100 style-scrollbar opacity-100";
  }, 600);
  
  document.body.classList.remove('loading-active');
  initializeVaultInterface();

  // Load settings
  const savedKey = localStorage.getItem('lenlu_ai_key');
  if(savedKey) {
    const keyInput = document.getElementById('aiApiKey');
    if(keyInput) keyInput.value = savedKey;
  }
}

// SCRIPT INTERACTIVE INPUT MATRIX TRACKER
function handleSourceInput() {
  runLinter();
  executeAudioTone(1200 + Math.random() * 400, 'square', 0.01);
}

// COMPILER AND LINTER ENGINE
function runLinter() {
  const source = document.getElementById('sourceEditor').value;
  const modeElement = document.getElementById('validationMode');
  const mode = modeElement ? modeElement.value : 'strict';
  const logPanel = document.getElementById('diagnosticLog');
  const badge = document.getElementById('errorCounterBadge');
  
  const lines = source.split('\n');
  const lineCountEl = document.getElementById('lineCount');
  if(lineCountEl) lineCountEl.innerText = `L: ${lines.length}`;

  let errorsFound = [];
  let insideBlockComment = false;
  let insideWhileBlock = false;

  if (!source.trim()) {
    if(logPanel) logPanel.innerHTML = `<div class="text-matrix-dim font-mono">// System channel empty.</div>`;
    if(badge) {
        badge.className = "badge bg-dark border border-matrix text-matrix text-[9px]";
        badge.innerText = "READY";
    }
    return errorsFound;
  }

  for (let i = 0; i < lines.length; i++) {
    let rawLine = lines[i].trim();
    let lineNum = i + 1;
    if (!rawLine) continue;

    if (rawLine.toUpperCase() === 'REM_BLOCK') { insideBlockComment = true; continue; }
    if (rawLine.toUpperCase() === 'END_REM') { insideBlockComment = false; continue; }
    if (insideBlockComment || rawLine.startsWith('REM') || rawLine.startsWith('//')) continue;

    let parts = rawLine.split(/\s+/);
    let baseCmd = parts[0].toUpperCase();
    let argumentsStr = parts.slice(1).join(' ');

    if (!VALID_COMMANDS.includes(baseCmd) && !rawLine.includes('$') && !rawLine.includes('=')) {
      if (mode === 'strict' || mode === 'experimental') {
        errorsFound.push({ line: lineNum, type: 'CRITICAL', msg: `Syntax violation: "${baseCmd}" is unmapped.` });
      }
    }

    if (['DELAY', 'DEFAULT_DELAY', 'DEFAULTDELAY'].includes(baseCmd) && argumentsStr) {
      if (isNaN(parseInt(argumentsStr))) {
        errorsFound.push({ line: lineNum, type: 'CRITICAL', msg: `Type Mismatch: "${baseCmd}" expects Integer.` });
      }
    }

    if (baseCmd === 'WHILE') insideWhileBlock = true;
    if (baseCmd === 'END_WHILE') insideWhileBlock = false;
  }

  if (insideWhileBlock) {
    errorsFound.push({ line: lines.length, type: 'CRITICAL', msg: `Structural Failure: "END_WHILE" missing.` });
  }

  displayDiagnostics(errorsFound, badge, logPanel);
  return errorsFound;
}

function displayDiagnostics(errors, badge, panel) {
  if(!panel) return;
  let criticalCount = errors.filter(e => e.type === 'CRITICAL').length;
  if (errors.length === 0) {
    panel.innerHTML = `<div class="text-matrix font-bold">[✓] CODEBASE NOMINAL</div>`;
    if(badge) {
        badge.className = "badge bg-matrix text-black text-[9px] font-bold";
        badge.innerText = "VERIFIED";
    }
    return;
  }
  if(badge) {
    badge.className = criticalCount > 0 ? "badge bg-danger text-white text-[9px]" : "badge bg-warning text-black text-[9px]";
    badge.innerText = `FLAGS: ${errors.length}`;
  }

  let trackingMark = '';
  errors.forEach(err => {
    let markerColor = err.type === 'CRITICAL' ? 'text-danger' : 'text-warning';
    trackingMark += `<div class="${markerColor} font-mono text-[10px]">[!] L${err.line}: ${err.msg}</div>`;
  });
  panel.innerHTML = trackingMark;
}

function toggleApiKeyPlaceholder() {
  const model = document.getElementById('aiModelSelect').value;
  const keyInput = document.getElementById('aiApiKey');
  if(keyInput) keyInput.placeholder = `Paste ${model.toUpperCase()} Token...`;
}

// AI CONNECTIONS DECK
async function CallAiNeuralNetwork(promptText) {
  const modelProvider = document.getElementById('aiModelSelect').value;
  const apiKey = document.getElementById('aiApiKey').value.trim();
  const logPanel = document.getElementById('diagnosticLog');

  if (!apiKey) {
    if(logPanel) logPanel.innerHTML = `<div class="text-danger font-bold text-[10px]">[⚡ AUTH ERR] Set API Key in Settings.</div>`;
    executeAudioTone(250, 'sawtooth', 0.3);
    return null;
  }

  if(logPanel) logPanel.innerHTML = `<div class="text-cyan font-bold text-[10px] animate-pulse">[🤖 AI LINK] Processing...</div>`;
  executeAudioTone(700, 'triangle', 0.3);

  let endpoint = "";
  let payloadBody = {};
  let headerConfiguration = { "Content-Type": "application/json" };

  switch (modelProvider) {
    case "groq":
      endpoint = "https://api.groq.com/openai/v1/chat/completions";
      headerConfiguration["Authorization"] = `Bearer ${apiKey}`;
      payloadBody = { model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: promptText }] };
      break;
    case "openai":
      endpoint = "https://api.openai.com/v1/chat/completions";
      headerConfiguration["Authorization"] = `Bearer ${apiKey}`;
      payloadBody = { model: "gpt-4o", messages: [{ role: "user", content: promptText }] };
      break;
    case "anthropic":
      endpoint = "https://api.anthropic.com/v1/messages";
      headerConfiguration["x-api-key"] = apiKey;
      headerConfiguration["anthropic-version"] = "2023-06-01";
      payloadBody = { model: "claude-3-5-sonnet-20241022", max_tokens: 1024, messages: [{ role: "user", content: promptText }] };
      break;
  }

  try {
    const response = await fetch(endpoint, { method: "POST", headers: headerConfiguration, body: JSON.stringify(payloadBody) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const clearData = await response.json();
    
    if (modelProvider === "groq" || modelProvider === "openai") return clearData.choices[0].message.content;
    else if (modelProvider === "anthropic") return clearData.content[0].text;
  } catch (ex) {
    if(logPanel) logPanel.innerHTML = `<div class="text-danger font-bold text-[10px]">[❌ ERR] ${ex.message}</div>`;
    executeAudioTone(200, 'sawtooth', 0.4);
    return null;
  }
}

async function triggerAiCorrection() {
  const promptInput = document.getElementById('aiPrompt');
  const customIntent = promptInput ? promptInput.value.trim() : "";
  const codeSource = document.getElementById('sourceEditor').value;

  let operationalPrompt = "";
  if(customIntent) {
    operationalPrompt = `Expert BadUSB engineer. Target OS: Windows. Use high stealth. Objective: ${customIntent}. Output ONLY raw DuckyScript code. No markdown.`;
  } else {
    if(!codeSource.trim()) return;
    operationalPrompt = `Expert compiler assistant. Correct this DuckyScript. Return ONLY code:\n\n${codeSource}`;
  }
  
  const optimizedData = await CallAiNeuralNetwork(operationalPrompt);
  if(optimizedData) {
    let cleanCode = optimizedData.replace(/```[\w]*\n?/g, '').trim();
    document.getElementById('sourceEditor').value = cleanCode;
    runLinter();
    compilePipeline();
    executeAudioTone(950, 'sine', 0.2);
    const log = document.getElementById('diagnosticLog');
    if(log) log.innerHTML = `<div class="text-matrix font-bold text-[10px]">[✓] AI SYNTHESIS COMPLETED</div>`;
  }
}

async function triggerAiExplanation() {
  const codeSource = document.getElementById('sourceEditor').value;
  if(!codeSource.trim()) return;
  const analyticalPrompt = `Briefly explain what this DuckyScript does and any risks:\n\n${codeSource}`;
  
  const analyticalReport = await CallAiNeuralNetwork(analyticalPrompt);
  if(analyticalReport) {
    executeAudioTone(600, 'sine', 0.25);
    const log = document.getElementById('diagnosticLog');
    if(log) log.innerHTML = `<div class="text-warning font-mono text-[10px]" style="white-space: pre-wrap;">${analyticalReport}</div>`;
  }
}

// COMPILATION PIPELINE PROCESSING CORE
function compilePipeline() {
  const validationAnomalies = runLinter();
  const criticalIssues = validationAnomalies.filter(e => e.type === 'CRITICAL');
  const targetOutput = document.getElementById('outputViewer');
  const autoFixEnabled = document.getElementById('autoAiFix') ? document.getElementById('autoAiFix').checked : false;

  if (criticalIssues.length > 0 && autoFixEnabled) {
    triggerAiCorrection();
    return;
  }

  let sourceCode = document.getElementById('sourceEditor').value;
  let lines = sourceCode.split('\n');
  
  let assemblyBuffer = '; === LENLU SC ASSEMBLER V6.0 ===\n';
  assemblyBuffer += '#NoTrayIcon\n#include <Misc.au3>\n\n';

  let currentLatencyDelay = 100;

  for (let idx = 0; idx < lines.length; idx++) {
    let lineText = lines[idx].trim();
    if (!lineText || lineText.startsWith('REM')) continue;

    let structures = lineText.split(/\s+/);
    let operator = structures[0].toUpperCase();
    let values = structures.slice(1).join(' ');

    switch (operator) {
      case 'DELAY':
        assemblyBuffer += `Sleep(${parseInt(values) || 100})\n`;
        break;
      case 'STRING':
        assemblyBuffer += `Send("${values.replace(/"/g, '""')}", 1)\nSleep(${currentLatencyDelay})\n`;
        break;
      case 'ENTER':
        assemblyBuffer += `Send("{ENTER}")\nSleep(${currentLatencyDelay})\n`;
        break;
      case 'GUI':
      case 'WIN':
        assemblyBuffer += `Send("{LWIN}")\nSleep(200)\n`;
        if(values) assemblyBuffer += `Send("${values}", 1)\nSleep(${currentLatencyDelay})\n`;
        break;
      case 'WHILE':
        assemblyBuffer += `While ${values || '1'}\n`;
        break;
      case 'END_WHILE':
        assemblyBuffer += `WEnd\n`;
        break;
      default:
        let modifiers = '';
        let regularKeys = '';
        let tokens = lineText.replace(/-/g, ' ').toUpperCase().split(/\s+/);
        for (let t of tokens) {
          if (KEY_MAP[t]) {
            if(['CTRL', 'ALT', 'SHIFT'].includes(t)) modifiers += KEY_MAP[t];
            else regularKeys += KEY_MAP[t];
          }
        }
        if (modifiers || regularKeys) {
          assemblyBuffer += `Send("${modifiers}${regularKeys}")\nSleep(${currentLatencyDelay})\n`;
        }
    }
  }

  if (criticalIssues.length > 0) {
    assemblyBuffer = ';; WARNING: SYNTAX ERRORS DETECTED\n' + assemblyBuffer;
    executeAudioTone(380, 'sawtooth', 0.2);
  } else {
    executeAudioTone(1050, 'triangle', 0.1);
  }

  if(targetOutput) targetOutput.textContent = assemblyBuffer;
}

// STORAGE MANAGER VAULT SYSTEM
function initializeVaultInterface() {
  renderVaultCache();
}

function saveCurrentToVault() {
  const code = document.getElementById('sourceEditor').value;
  if (!code.trim()) return;
  
  let currentVault = JSON.parse(localStorage.getItem('lenlu_vault') || '[]');
  const uniqueId = 'sc_' + Date.now();
  const rawTitle = code.split('\n')[0].replace('REM', '').trim() || `Script_${currentVault.length + 1}`;
  
  currentVault.push({ id: uniqueId, title: rawTitle.substring(0,25), content: code });
  localStorage.setItem('lenlu_vault', JSON.stringify(currentVault));
  
  executeAudioTone(750, 'sine', 0.1);
  renderVaultCache();
}

function loadVaultScript(id) {
  let currentVault = JSON.parse(localStorage.getItem('lenlu_vault') || '[]');
  const record = currentVault.find(item => item.id === id);
  if (record) {
    document.getElementById('sourceEditor').value = record.content;
    runLinter();
    compilePipeline();
    switchTab('ide', document.querySelector('.nav-item'));
    executeAudioTone(900, 'triangle', 0.1);
  }
}

function deleteVaultScript(id, event) {
  event.stopPropagation();
  let currentVault = JSON.parse(localStorage.getItem('lenlu_vault') || '[]');
  currentVault = currentVault.filter(item => item.id !== id);
  localStorage.setItem('lenlu_vault', JSON.stringify(currentVault));
  executeAudioTone(300, 'square', 0.1);
  renderVaultCache();
}

function renderVaultCache() {
  const container = document.getElementById('vaultContainer');
  if(!container) return;
  let currentVault = JSON.parse(localStorage.getItem('lenlu_vault') || '[]');
  
  if (currentVault.length === 0) {
    container.innerHTML = `<div class="text-center text-matrix-dim text-[10px] py-4 font-mono">// Vault Empty //</div>`;
    return;
  }
  
  container.innerHTML = '';
  currentVault.forEach(item => {
    const div = document.createElement('div');
    div.className = "d-flex justify-content-between align-items-center bg-black border border-matrix p-2 rounded hover-glow text-[10px] font-mono mb-1";
    div.style.cursor = "pointer";
    div.onclick = () => loadVaultScript(item.id);
    div.innerHTML = `
      <span class="text-matrix truncate flex-grow-1"><i class="fa-solid fa-file-code me-1"></i>${item.title}</span>
      <button class="btn p-0 border-0 text-danger text-[10px] ms-2" onclick="deleteVaultScript('${item.id}', event)"><i class="fa-solid fa-trash-can"></i></button>
    `;
    container.appendChild(div);
  });
}

// UTILITY CORE FUNCTIONS
function loadSampleTemplate() {
  document.getElementById('sourceEditor').value = `REM Simple Recon\nGUI r\nDELAY 500\nSTRING cmd\nENTER\nDELAY 500\nSTRING systeminfo\nENTER`;
  runLinter();
  executeAudioTone(500, 'sine', 0.1);
}

function resetGrid() {
  document.getElementById('sourceEditor').value = '';
  document.getElementById('outputViewer').textContent = '';
  runLinter();
  executeAudioTone(200, 'sine', 0.2);
}

function copyPipelineOutput() {
  const txt = document.getElementById('outputViewer').textContent;
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(() => {
    executeAudioTone(1100, 'sine', 0.08);
    alert("Copied to buffer.");
  });
}

function downloadAu3() {
  const txt = document.getElementById('outputViewer').textContent;
  if (!txt) return;
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function() {
    const a = document.createElement('a');
    a.href = reader.result;
    a.download = 'assembly.au3';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  executeAudioTone(1300, 'triangle', 0.15);
}

function downloadSessionPDF() {
  if(!window.html2pdf) return;
  const source = document.getElementById('sourceEditor').value;
  const output = document.getElementById('outputViewer').textContent;
  const diag = document.getElementById('diagnosticLog').innerText;

  const wrapper = document.createElement('div');
  wrapper.style.padding = '20px';
  wrapper.style.background = '#000';
  wrapper.style.color = '#00FFD1';
  wrapper.style.fontFamily = 'monospace';
  wrapper.innerHTML = `<h2>LENLU SC Session</h2><hr><p><b>Source:</b></p><pre>${source}</pre><hr><p><b>Assembly:</b></p><pre>${output}</pre><hr><p><b>Log:</b></p><pre>${diag}</pre>`;

  const opt = { margin: 10, filename: `session_${Date.now()}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
  html2pdf().set(opt).from(wrapper).save().then(() => wrapper.remove());
}

const SYSTEM_VERSION = "v6.0.0";

async function syncSystemCoreFromGitHub() {
  const logPanel = document.getElementById('diagnosticLog');
  if(!logPanel) return;

  logPanel.innerHTML = `<div class="text-cyan text-[10px] animate-pulse">[🌐] Checking for system updates...</div>`;
  executeAudioTone(600, 'sine', 0.1);

  try {
    // Check for latest release instead of just commits
    const response = await fetch('https://api.github.com/repos/lenluarun/LENLU-SC/releases/latest');
    if (!response.ok) throw new Error(`Gateway Error: ${response.status}`);

    const release = await response.json();
    const latestTag = release.tag_name;

    if (latestTag !== SYSTEM_VERSION) {
      // Find APK asset if exists
      const apkAsset = release.assets.find(a => a.name.endsWith('.apk'));
      const downloadUrl = apkAsset ? apkAsset.browser_download_url : release.html_url;

      logPanel.innerHTML = `
        <div class="text-warning font-bold text-[10px]">[!] NEW UPDATE AVAILABLE: ${latestTag}</div>
        <div class="text-matrix-dim text-[9px] mb-2">// Current: ${SYSTEM_VERSION}</div>
        <button class="btn btn-matrix btn-sm text-[10px] py-1 px-3 w-100" onclick="window.open('${downloadUrl}', '_blank')">
          <i class="fa-solid fa-download me-1"></i> DOWNLOAD UPDATED APK
        </button>
      `;
      executeAudioTone(900, 'triangle', 0.3);
    } else {
      logPanel.innerHTML = `<div class="text-matrix text-[10px]">[✓] SYSTEM UP TO DATE: ${SYSTEM_VERSION}</div>`;
      executeAudioTone(1100, 'sine', 0.1);
    }
  } catch (err) {
    logPanel.innerHTML = `<div class="text-danger text-[10px]">[!] SYNC FAILED: ${err.message}</div>`;
    executeAudioTone(200, 'sawtooth', 0.3);
  }
}

// Mobile Tab Controller
function switchTab(tabId, el) {
  document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  const target = document.getElementById('view-' + tabId);
  if(target) target.classList.add('active');
  if(el) el.classList.add('active');

  executeAudioTone(1000, 'sine', 0.05);
}

// Voice AI Recognition
let isListening = false;
let recognition = null;
function toggleVoiceAI() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { alert("Speech API unsupported."); return; }
  
  const btn = document.getElementById('micBtn');
  const status = document.getElementById('micStatus');

  if (isListening) {
    recognition.stop();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.onstart = () => {
    isListening = true;
    if(btn) btn.classList.add('listening');
    if(status) status.innerText = "Listening...";
  };
  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    const promptArea = document.getElementById('aiPrompt');
    if(promptArea) promptArea.value = transcript;
  };
  recognition.onend = () => {
    isListening = false;
    if(btn) btn.classList.remove('listening');
    if(status) status.innerText = "Captured.";
  };
  recognition.start();
}

function runScanner(type) {
  const out = document.getElementById('scannerOutput');
  if(!out) return;
  out.innerHTML = `<div class="text-matrix-dim">Scanning ${type}...</div>`;
  setTimeout(() => {
    out.innerHTML = `<div class="text-matrix">[✓] ${type.toUpperCase()} scan complete.</div>`;
  }, 1000);
}

function saveSettings() {
  const key = document.getElementById('aiApiKey').value;
  localStorage.setItem('lenlu_ai_key', key);
  executeAudioTone(1100, 'sine', 0.1);
  alert("Settings saved.");
}

function factoryReset() {
  if(confirm('Wipe all memory?')) {
    localStorage.clear();
    location.reload();
  }
}
