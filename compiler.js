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
    button.className = "btn btn-outline-danger btn-sm text-xs px-2";
  } else {
    button.innerHTML = `<i class="fa-solid fa-volume-high me-1"></i>AUDIO: ON`;
    button.className = "btn btn-outline-matrix btn-sm text-xs px-2";
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
  canvasContext.fillStyle = 'rgba(0, 0, 0, 0.06)';
  canvasContext.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
  
  canvasContext.fillStyle = '#10b981';
  canvasContext.font = fontPixelSize + 'px monospace';
  
  customMatrixColumns.forEach(column => {
    const activeCharacter = internalMatrixGlyphs[Math.floor(Math.random() * internalMatrixGlyphs.length)];
    // Make head glyph glow brighter white occasionally
    if (Math.random() > 0.98) {
      canvasContext.fillStyle = '#fff';
    } else {
      canvasContext.fillStyle = '#10b981';
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
  targetSplash.style.visibility = 'hidden';
  applicationContainer.className = "d-flex flex-column min-vh-100 style-scrollbar opacity-100";
  
  document.body.classList.remove('loading-active');
  initializeVaultInterface();
}

// SCRIPT INTERACTIVE INPUT MATRIX TRACKER
function handleSourceInput() {
  runLinter();
  executeAudioTone(1200 + Math.random() * 400, 'square', 0.015);
}

// COMPILER AND LINTER ENGINE
function runLinter() {
  const source = document.getElementById('sourceEditor').value;
  const mode = document.getElementById('validationMode').value;
  const logPanel = document.getElementById('diagnosticLog');
  const badge = document.getElementById('errorCounterBadge');
  
  const lines = source.split('\n');
  document.getElementById('lineCount').innerText = `LINES: ${lines.length}`;

  let errorsFound = [];
  let insideBlockComment = false;
  let insideWhileBlock = false;

  if (!source.trim()) {
    logPanel.innerHTML = `<div class="text-matrix-dim font-mono">// System channel empty. Awaiting ingestion sequences...</div>`;
    badge.className = "badge bg-dark border border-matrix text-matrix text-xs";
    badge.innerText = "ERRORS: 0";
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
        errorsFound.push({ line: lineNum, type: 'CRITICAL', msg: `Syntax violation: Instruction target "${baseCmd}" is unmapped.` });
      }
    }

    if ((baseCmd === 'DELAY' || baseCmd === 'DEFAULT_DELAY' || baseCmd === 'DEFAULTDELAY') && argumentsStr) {
      let numericVal = parseInt(argumentsStr);
      if (isNaN(numericVal)) {
        errorsFound.push({ line: lineNum, type: 'CRITICAL', msg: `Type Mismatch: "${baseCmd}" parameter must execute an Integer.` });
      }
    }

    if (baseCmd === 'WHILE') insideWhileBlock = true;
    if (baseCmd === 'END_WHILE') insideWhileBlock = false;
  }

  if (insideWhileBlock) {
    errorsFound.push({ line: lines.length, type: 'CRITICAL', msg: `Structural Failure: Terminating "END_WHILE" bound missing.` });
  }

  displayDiagnostics(errorsFound, badge, logPanel);
  return errorsFound;
}

function displayDiagnostics(errors, badge, panel) {
  let criticalCount = errors.filter(e => e.type === 'CRITICAL').length;
  if (errors.length === 0) {
    panel.innerHTML = `<div class="text-matrix font-bold">[✓] CODEBASE VALIDATION NOMINAL: Zero compilation flags raised. Ready for assembly deployment.</div>`;
    badge.className = "badge bg-matrix text-black text-xs font-bold";
    badge.innerText = "VERIFIED";
    return;
  }
  badge.className = criticalCount > 0 ? "badge bg-danger text-white text-xs" : "badge bg-warning text-black text-xs";
  badge.innerText = `FLAGS: ${errors.length}`;

  let trackingMark = '';
  errors.forEach(err => {
    let markerColor = err.type === 'CRITICAL' ? 'text-danger' : 'text-warning';
    trackingMark += `<div class="${markerColor} font-mono">[!] Line ${err.line} [${err.type}]: ${err.msg}</div>`;
  });
  panel.innerHTML = trackingMark;
}

function toggleApiKeyPlaceholder() {
  const model = document.getElementById('aiModelSelect').value;
  const keyInput = document.getElementById('aiApiKey');
  keyInput.placeholder = `Paste your ${model.toUpperCase()} API Key...`;
}

// AI CONNECTIONS DECK
async function CallAiNeuralNetwork(promptText) {
  const modelProvider = document.getElementById('aiModelSelect').value;
  const apiKey = document.getElementById('aiApiKey').value.trim();
  const logPanel = document.getElementById('diagnosticLog');

  if (!apiKey) {
    logPanel.innerHTML = `<div class="text-danger font-bold">[⚡ AUTH ERROR] API Key must be supplied inside the integration deck to establish connection arrays.</div>`;
    executeAudioTone(250, 'sawtooth', 0.3);
    return null;
  }

  logPanel.innerHTML = `<div class="text-cyan font-bold animate-pulse">[🤖 AI LINK INITIALIZING] Processing parameters via neural array...</div>`;
  executeAudioTone(700, 'triangle', 0.5);

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
    case "gemini":
      endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
      payloadBody = { contents: [{ parts: [{ text: promptText }] }] };
      break;
  }

  try {
    const response = await fetch(endpoint, { method: "POST", headers: headerConfiguration, body: JSON.stringify(payloadBody) });
    if (!response.ok) throw new Error(`Status error code: ${response.status}`);
    const clearData = await response.json();
    
    if (modelProvider === "groq" || modelProvider === "openai") return clearData.choices[0].message.content;
    else if (modelProvider === "anthropic") return clearData.content[0].text;
    else if (modelProvider === "gemini") return clearData.candidates[0].content.parts[0].text;
  } catch (ex) {
    logPanel.innerHTML = `<div class="text-danger font-bold">[❌ CONNECTION BREAK] Neural handshakes dropped: ${ex.message}</div>`;
    executeAudioTone(200, 'sawtooth', 0.4);
    return null;
  }
}

async function triggerAiCorrection() {
  const codeSource = document.getElementById('sourceEditor').value;
  if(!codeSource.trim()) return;
  const operationalPrompt = `You are an expert compiler engineering assistant. Analyze this script structure. Correct syntax errors or unclosed logic. Return ONLY the updated code without markdown or prose:\n\n${codeSource}`;
  
  const optimizedData = await CallAiNeuralNetwork(operationalPrompt);
  if(optimizedData) {
    document.getElementById('sourceEditor').value = optimizedData.trim();
    runLinter();
    compilePipeline();
    executeAudioTone(950, 'sine', 0.2);
    document.getElementById('diagnosticLog').innerHTML = `<div class="text-matrix font-bold">[✓] AI COGNITIVE ADJUSTMENT COMPLETED: Source stream normalized successfully.</div>`;
  }
}

async function triggerAiExplanation() {
  const codeSource = document.getElementById('sourceEditor').value;
  if(!codeSource.trim()) return;
  const analyticalPrompt = `Analyze systemic structural errors inside this script setup. Keep details concise and structured:\n\n${codeSource}`;
  
  const analyticalReport = await CallAiNeuralNetwork(analyticalPrompt);
  if(analyticalReport) {
    executeAudioTone(600, 'sine', 0.25);
    document.getElementById('diagnosticLog').innerHTML = `<div class="text-warning font-mono" style="white-space: pre-wrap;">${analyticalReport}</div>`;
  }
}

// COMPILATION PIPELINE PROCESSING CORE
function compilePipeline() {
  const validationAnomalies = runLinter();
  const criticalIssues = validationAnomalies.filter(e => e.type === 'CRITICAL');
  const targetOutput = document.getElementById('outputViewer');
  const autoFixEnabled = document.getElementById('autoAiFix') ? document.getElementById('autoAiFix').checked : false;

  if (criticalIssues.length > 0 && autoFixEnabled) {
    document.getElementById('diagnosticLog').innerHTML = `<div class="text-cyan font-bold">[⚡] Auto AI Fix enabled — invoking AI optimizer...</div>`;
    triggerAiCorrection();
    return;
  }

  let sourceCode = document.getElementById('sourceEditor').value;
  let lines = sourceCode.split('\n');
  
  let assemblyBuffer = '; =========================================================================\n';
  assemblyBuffer += '; === GENERATED BY LENLU SC ASSEMBLER PLATFORM                           ===\n';
  assemblyBuffer += '; === SciTE Compliant Compilation Frame Architecture Target: x84/x64     ===\n';
  assemblyBuffer += '; =========================================================================\n\n';
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
      case 'WHILE':
        assemblyBuffer += `While ${values}\n`;
        break;
      case 'END_WHILE':
        assemblyBuffer += `WEnd\n`;
        break;
      default:
        let modifiers = '';
        let regularKeys = '';
        let keyTokens = lineText.replace(/-/g, ' ').toUpperCase().split(/\s+/);

        for (let token of keyTokens) {
          if (['CTRL', 'CONTROL', 'ALT', 'SHIFT'].includes(token)) {
            modifiers += KEY_MAP[token];
          } else if (KEY_MAP[token]) { regularKeys += KEY_MAP[token]; }
        }
        if (modifiers || regularKeys) {
          assemblyBuffer += `Send("${modifiers}${regularKeys}")\nSleep(${currentLatencyDelay})\n`;
        }
    }
  }

  if (criticalIssues.length > 0) {
    let banner = ';; =========================================================================\n';
    banner += ';; WARNING: DIAGNOSTIC FLAGS PRESENT - Review Diagnostic Log before deployment\n';
    banner += ';; =========================================================================\n\n';
    assemblyBuffer = banner + assemblyBuffer;
    executeAudioTone(380, 'sawtooth', 0.2);
  } else {
    executeAudioTone(1050, 'triangle', 0.15);
  }

  targetOutput.textContent = assemblyBuffer;
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
  
  currentVault.push({ id: uniqueId, title: rawTitle.substring(0,20), content: code });
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
  let currentVault = JSON.parse(localStorage.getItem('lenlu_vault') || '[]');
  
  if (currentVault.length === 0) {
    container.innerHTML = `<div class="text-center text-matrix-dim text-xs py-4 font-mono">// Vault Empty //</div>`;
    return;
  }
  
  container.innerHTML = '';
  currentVault.forEach(item => {
    const div = document.createElement('div');
    div.className = "d-flex justify-content-between align-items-center bg-black border border-matrix p-2 rounded cursor-pointer hover-glow text-xs font-mono";
    div.style.cursor = "pointer";
    div.onclick = () => loadVaultScript(item.id);
    div.innerHTML = `
      <span class="text-matrix truncate flex-grow-1"><i class="fa-solid fa-file-code me-1"></i>${item.title}</span>
      <button class="btn p-0 border-0 text-danger text-xs ms-2" onclick="deleteVaultScript('${item.id}', event)"><i class="fa-solid fa-trash-can"></i></button>
    `;
    container.appendChild(div);
  });
}

// UTILITY CORE FUNCTIONS
function loadSampleTemplate() {
  document.getElementById('sourceEditor').value = `REM Broken Loop Framework\nWHILE $Value < 5\nDELAY XYZ\nSTRING Executing structural break iteration without bounds.`;
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
    alert("Assembly parameters written to memory clipboard buffer.");
  });
}

function downloadAu3() {
  const txt = document.getElementById('outputViewer').textContent;
  if (!txt) { alert('No compiled assembly available to download.'); return; }
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'assembly.au3';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  executeAudioTone(1300, 'triangle', 0.15);
}

function downloadSessionPDF() {
  const source = document.getElementById('sourceEditor').value;
  const output = document.getElementById('outputViewer').textContent;
  const diag = document.getElementById('diagnosticLog').innerText;

  const wrapper = document.createElement('div');
  wrapper.style.width = '1200px';
  wrapper.style.padding = '20px';
  wrapper.style.background = '#000';
  wrapper.style.color = '#00FFD1';
  wrapper.style.fontFamily = 'monospace';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '12px';
  header.innerHTML = `<div style="font-weight:700; font-size:18px;">LENLU SC // Session Export</div><div style="font-size:12px; color:#9be3c7">${new Date().toLocaleString()}</div>`;

  const makeSection = (title, contentText) => {
    const sec = document.createElement('div');
    const t = document.createElement('div');
    t.style.fontWeight = '700';
    t.style.margin = '8px 0 6px 0';
    t.textContent = title;
    const pre = document.createElement('pre');
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.background = '#071018';
    pre.style.padding = '12px';
    pre.style.border = '1px solid rgba(0,255,209,0.08)';
    pre.style.borderRadius = '6px';
    pre.style.color = '#a3fff0';
    pre.textContent = contentText || '';
    sec.appendChild(t);
    sec.appendChild(pre);
    return sec;
  };

  wrapper.appendChild(header);
  wrapper.appendChild(makeSection('SOURCE_INGESTION.ds', source));
  wrapper.appendChild(makeSection('AUTOIT_ASSEMBLY.au3', output));
  wrapper.appendChild(makeSection('DIAGNOSTIC_LOG', diag));
  
  wrapper.style.webkitPrintColorAdjust = 'exact';
  wrapper.style.printColorAdjust = 'exact';
  wrapper.style.colorAdjust = 'exact';

  const opt = {
    margin: 8,
    filename: `lenlu_session_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#000' },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };

  document.body.appendChild(wrapper);
  executeAudioTone(600, 'triangle', 0.5);
  setTimeout(() => {
    html2pdf().set(opt).from(wrapper).save().then(() => wrapper.remove()).catch(() => wrapper.remove());
  }, 250);
}

function downloadAu3() {
  const txt = document.getElementById('outputViewer').textContent;
  if (!txt) { 
    alert('No compiled assembly available to download.'); 
    return; 
  }
  
  // High-compatibility mobile data URI approach
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function() {
    const base64data = reader.result;
    const a = document.createElement('a');
    a.href = base64data;
    a.download = 'assembly.au3';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  executeAudioTone(1300, 'triangle', 0.15);
}