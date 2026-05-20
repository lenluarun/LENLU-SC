// Valid core commands dictionary matrix
const VALID_COMMANDS = [
  'REM', 'DELAY', 'DEFAULTDELAY', 'DEFAULT_DELAY', 'DEFAULTCHARDELAY', 
  'STRING', 'STRINGLN', 'REPEAT', 'GUI', 'WINDOWS', 'WIN', 'CTRL', 
  'CONTROL', 'ALT', 'SHIFT', 'COMMAND', 'OPTION', 'ENTER', 'ESC', 'ESCAPE', 
  'TAB', 'SPACE', 'BACKSPACE', 'DELETE', 'DEL', 'UP', 'UPARROW', 'DOWN', 
  'DOWNARROW', 'LEFT', 'LEFTARROW', 'RIGHT', 'RIGHTARROW', 'HOME', 'END', 
  'PAGEUP', 'PAGEDOWN', 'INSERT', 'PRINTSCREEN', 'CAPSLOCK', 'NUMLOCK', 
  'SCROLLLOCK', 'PAUSE', 'BREAK', 'MENU', 'APP', 'VAR', 'DEFINE', 'WHILE', 
  'END_WHILE', 'IF', 'ELSE', 'END_IF', 'ATTACKMODE', 'LED_R', 'LED_G', 'LED_B', 
  'LED_OFF', 'WAIT_FOR_BUTTON_PRESS', 'JITTER', 'REM_BLOCK', 'END_REM'
];

// Map modifiers/keys to AutoIt
const KEY_MAP = {
  "GUI": "{LWIN}", "WINDOWS": "{LWIN}", "WIN": "{LWIN}", "COMMAND": "{LWIN}",
  "CTRL": "^", "CONTROL": "^", "ALT": "!", "SHIFT": "+", "OPTION": "{LALT}",
  "ENTER": "{ENTER}", "ESC": "{ESC}", "ESCAPE": "{ESC}", "TAB": "{TAB}", 
  "SPACE": "{SPACE}", "BACKSPACE": "{BACKSPACE}", "DELETE": "{DELETE}", "DEL": "{DELETE}",
  "UP": "{UP}", "DOWN": "{DOWN}", "LEFT": "{LEFT}", "RIGHT": "{RIGHT}",
  "HOME": "{HOME}", "END": "{END}", "PAGEUP": "{PGUP}", "PAGEDOWN": "{PGDN}",
  "CAPSLOCK": "{CAPSLOCK}", "NUMLOCK": "{NUMLOCK}", "SCROLLLOCK": "{SCROLLLOCK}"
};

function runLinter() {
  const source = document.getElementById('sourceEditor').value;
  const mode = document.getElementById('validationMode').value;
  const logPanel = document.getElementById('diagnosticLog');
  const badge = document.getElementById('errorCounterBadge');
  
  const lines = source.split('\n');
  document.getElementById('lineCount').innerText = `LINES: ${lines.length}`;

  let errorsFound = [];
  let definedTokens = [];
  let insideBlockComment = false;
  let insideWhileBlock = false;

  if (!source.trim()) {
    logPanel.innerHTML = `<div class="text-matrix-dim">// System channel empty. Awaiting ingestion sequences...</div>`;
    badge.className = "badge bg-dark border border-matrix text-matrix text-xs";
    badge.innerText = "ERRORS: 0";
    return errorsFound;
  }

  // Iterate over string vectors line-by-line
  for (let i = 0; i < lines.length; i++) {
    let rawLine = lines[i].trim();
    let lineNum = i + 1;
    if (!rawLine) continue;

    // Comments block boundaries processing
    if (rawLine.toUpperCase() === 'REM_BLOCK') { insideBlockComment = true; continue; }
    if (rawLine.toUpperCase() === 'END_REM') { insideBlockComment = false; continue; }
    if (insideBlockComment || rawLine.startsWith('REM') || rawLine.startsWith('//')) continue;

    let parts = rawLine.split(/\s+/);
    let baseCmd = parts[0].toUpperCase();
    let argumentsStr = parts.slice(1).join(' ');

    // 1. Unrecognized structural instructions check
    if (!VALID_COMMANDS.includes(baseCmd) && !rawLine.includes('$') && !rawLine.includes('=')) {
      if (mode === 'strict' || mode === 'experimental') {
        errorsFound.push({ line: lineNum, type: 'CRITICAL', msg: `Syntax violation: Instruction target "${baseCmd}" is unmapped.` });
      }
    }

    // 2. Bound constraints monitoring on DELAY loops
    if ((baseCmd === 'DELAY' || baseCmd === 'DEFAULT_DELAY' || baseCmd === 'DEFAULTDELAY') && argumentsStr) {
      let numericVal = parseInt(argumentsStr);
      if (isNaN(numericVal)) {
        errorsFound.push({ line: lineNum, type: 'CRITICAL', msg: `Type Mismatch: "${baseCmd}" parameter must execute an Integer.` });
      } else if (numericVal <= 0 && mode === 'strict') {
        errorsFound.push({ line: lineNum, type: 'WARNING', msg: `Timing Optimization Warning: Delay metric [${numericVal}ms] allocation has no operational value.` });
      }
    }

    // 3. Register Constant Token declarations Tracking
    if (baseCmd === 'DEFINE') {
      let tokenName = parts[1];
      if (tokenName) definedTokens.push(tokenName);
    }

    // 4. Block loop balance checks
    if (baseCmd === 'WHILE') insideWhileBlock = true;
    if (baseCmd === 'END_WHILE') insideWhileBlock = false;

    // 5. Experimental profile check
    if (mode === 'strict' && (baseCmd === 'ATTACKMODE' || baseCmd === 'JITTER')) {
      errorsFound.push({ line: lineNum, type: 'WARNING', msg: `Syntax constraint: Keyword "${baseCmd}" belongs to extended engine firmware. Switch lint profile to EXPERIMENTAL.` });
    }
  }

  if (insideWhileBlock) {
    errorsFound.push({ line: lines.length, type: 'CRITICAL', msg: `Structural Failure: Opened "WHILE" logical control routine loop lacks terminating "END_WHILE" bound.` });
  }

  // Render Telemetry logs to UI drawer viewport dynamically
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

function compilePipeline() {
  const validationAnomalies = runLinter();
  const criticalIssues = validationAnomalies.filter(e => e.type === 'CRITICAL');
  const targetOutput = document.getElementById('outputViewer');
  
  if (criticalIssues.length > 0) {
    targetOutput.textContent = `;; COMPILATION TERMINATED BY INGESTION INTERFACE LINTER\n;; FIX THE ${criticalIssues.length} CRITICAL ERRORS IN THE TELEMETRY LOGGER DRAWER BELOW.`;
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
  let nestedComment = false;

  for (let idx = 0; idx < lines.length; idx++) {
    let lineText = lines[idx].trim();
    if (!lineText) continue;

    if (lineText.toUpperCase() === 'REM_BLOCK') { nestedComment = true; assemblyBuffer += '/*\n'; continue; }
    if (lineText.toUpperCase() === 'END_REM') { nestedComment = false; assemblyBuffer += '*/\n'; continue; }
    if (nestedComment) { assemblyBuffer += `  ${lineText}\n`; continue; }

    if (lineText.startsWith('REM') || lineText.startsWith('//')) {
      assemblyBuffer += `; ${lineText}\n`;
      continue;
    }

    let structures = lineText.split(/\s+/);
    let operator = structures[0].toUpperCase();
    let values = structures.slice(1).join(' ');

    switch (operator) {
      case 'DELAY':
        assemblyBuffer += `Sleep(${parseInt(values) || 100})\n`;
        break;
      case 'DEFAULT_DELAY':
      case 'DEFAULTDELAY':
        currentLatencyDelay = parseInt(values) || 100;
        assemblyBuffer += `; Baseline interface interval latency changed to: ${currentLatencyDelay}ms\n`;
        break;
      case 'STRING':
        assemblyBuffer += `Send("${values.replace(/"/g, '""')}", 1)\nSleep(${currentLatencyDelay})\n`;
        break;
      case 'STRINGLN':
        assemblyBuffer += `Send("${values.replace(/"/g, '""')}" & "{ENTER}", 1)\nSleep(${currentLatencyDelay})\n`;
        break;
      case 'WHILE':
        assemblyBuffer += `While ${values}\n`;
        break;
      case 'END_WHILE':
        assemblyBuffer += `WEnd\n`;
        break;
      case 'VAR':
        assemblyBuffer += `Local ${values}\n`;
        break;
      default:
        let modifiers = '';
        let regularKeys = '';
        let keyTokens = lineText.replace(/-/g, ' ').toUpperCase().split(/\s+/);

        for (let token of keyTokens) {
          if (['CTRL', 'CONTROL', 'ALT', 'SHIFT'].includes(token)) {
            modifiers += KEY_MAP[token];
          } else if (KEY_MAP[token]) {
            regularKeys += KEY_MAP[token];
          } else if (token.length === 1) {
            regularKeys += lineText.split(/\s+/)[keyTokens.indexOf(token)];
          }
        }

        if (modifiers || regularKeys) {
          assemblyBuffer += `Send("${modifiers}${regularKeys}")\nSleep(${currentLatencyDelay})\n`;
        } else {
          if (lineText.includes('=')) {
            assemblyBuffer += `${lineText}\n`;
          } else {
            assemblyBuffer += `; Unhandled symbolic execution structural mapping fallback: ${lineText}\n`;
          }
        }
    }
  }

  targetOutput.textContent = assemblyBuffer;
}

function loadSampleTemplate() {
  document.getElementById('sourceEditor').value = `REM Core Verification Framework\nVAR $Counter = 0\nDEFAULT_DELAY 200\n\nGUI r\nDELAY 500\nSTRING notepad.exe\nENTER\nDELAY 1000\n\nWHILE $Counter < 2\n  STRINGLN Running validation diagnostics via LENLU SC layer...\n  $Counter = $Counter + 1\nEND_WHILE`;
  runLinter();
}

function resetGrid() {
  document.getElementById('sourceEditor').value = '';
  document.getElementById('outputViewer').textContent = '';
  runLinter();
}

function copyPipelineOutput() {
  const txt = document.getElementById('outputViewer').textContent;
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(() => alert("Assembly content buffered safely to Clipboard. Ready for SciTE workspace instantiation."));
}