// ─── STATE MODULE ───
    const S = {
      settings: { crt: true, rain: true, particles: true, audio: true, lint: true, persist: true, hist: true, grain: true, vignette: true, hexdump: false },
      stats: { compiled: 0, ai: 0, vault: 0, scans: 0 },
      history: [], vault: [],
      shellHistory: [], shellHistIdx: -1,
      chatHistory: [],
      sessionId: 'SID-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      scanActive: false, micActive: false, recognition: null,
      encMode: 'base64', selectedVaultId: null,
      keymapEvents: [], keymapStep: 0, keymapTimer: null,
      currentView: 'home',
      compilerOutputs: { au3: '', ps1: '', py: '', sh: '', hex: '' },
      compilerLang: 'au3',
      bleScanTimer: null,
      archNodes: [],
      archLinks: [],
      selectedArchNode: null,
      linkSourceNode: null,
      packetFlowTimer: null,
      packets: [],
      modules: {},
    };
    const BOOT = [
      { t: '[SYS] Initializing kernel modules…', c: 'sys', d: 250 },
      { t: '[OK]  Memory allocator: 1024MB reserved', c: 'ok', d: 450 },
      { t: '[OK]  WebGL context: GPU acceleration enabled', c: 'ok', d: 650 },
      { t: '[SYS] Loading DuckyScript compiler v3…', c: 'sys', d: 850 },
      { t: '[OK]  Compiler pipeline: ONLINE', c: 'ok', d: 1050 },
      { t: '[SYS] Connecting neural uplink…', c: 'sys', d: 1250 },
      { t: '[OK]  AI gateway: Anthropic/OpenAI/Groq registered', c: 'ok', d: 1450 },
      { t: '[SYS] Scanning Web Bluetooth API…', c: 'sys', d: 1650 },
      { t: navigator.bluetooth ? '[OK]  BLE scanner: AVAILABLE' : '[WARN] BLE scanner: Browser unsupported (Chrome/Edge)', c: navigator.bluetooth ? 'ok' : 'warn', d: 1850 },
      { t: '[SYS] Loading vault encryption layer…', c: 'sys', d: 2000 },
      { t: '[OK]  AES-256 vault: READY', c: 'ok', d: 2150 },
      { t: '[SYS] Initializing keymap visualizer…', c: 'sys', d: 2280 },
      { t: '[OK]  Virtual keyboard: LOADED (v4 NEW)', c: 'ok', d: 2380 },
      { t: '[SYS] OSINT fingerprint module…', c: 'sys', d: 2480 },
      { t: '[OK]  Fingerprint engine: READY (v4 NEW)', c: 'ok', d: 2570 },
      { t: '[SYS] Hex dump module: ONLINE', c: 'ok', d: 2640 },
      { t: '[OK]  All v4.0 modules nominal.', c: 'ok', d: 2720 },
    ];
    const ACTS = [
      { t: 'Compiler pipeline nominal', c: 'tl-ok' }, { t: 'Vault encryption check passed', c: 'tl-ok' },
      { t: 'Neural uplink stable', c: 'tl-info' }, { t: 'Memory: 24MB / 1024MB', c: 'tl-sys' },
      { t: 'BLE scanner: standby mode', c: 'tl-warn' }, { t: 'Session heartbeat sent', c: 'tl-sys' },
      { t: 'DNS cache cleared', c: 'tl-sys' }, { t: 'WebGL particle field: 2800 pts', c: 'tl-info' },
      { t: 'Encoder module idle', c: 'tl-sys' }, { t: 'Keymap engine: ready', c: 'tl-ok' },
    ];
    const DUCK_CMDS = [
      { cmd: 'DELAY', desc: 'Wait ms' }, { cmd: 'STRING', desc: 'Type text' }, { cmd: 'STRINGLN', desc: 'Type+Enter' }, { cmd: 'ENTER', desc: 'Enter key' }, { cmd: 'GUI', desc: 'Win/Cmd' }, { cmd: 'CTRL', desc: 'Control' }, { cmd: 'ALT', desc: 'Alt key' },
      { cmd: 'SHIFT', desc: 'Shift' }, { cmd: 'TAB', desc: 'Tab' }, { cmd: 'CAPS', desc: 'CapsLock' }, { cmd: 'DELETE', desc: 'Delete' }, { cmd: 'BACKSPACE', desc: 'Backspace' }, { cmd: 'INSERT', desc: 'Insert' }, { cmd: 'HOME', desc: 'Home' },
      { cmd: 'END', desc: 'End' }, { cmd: 'PAGEUP', desc: 'Page Up' }, { cmd: 'PAGEDOWN', desc: 'Page Down' }, { cmd: 'ESC', desc: 'Escape' }, { cmd: 'SPACE', desc: 'Space' }, { cmd: 'UP', desc: 'Arrow ↑' }, { cmd: 'DOWN', desc: 'Arrow ↓' },
      { cmd: 'LEFT', desc: 'Arrow ←' }, { cmd: 'RIGHT', desc: 'Arrow →' }, { cmd: 'F1-F12', desc: 'Function' }, { cmd: 'REM', desc: 'Comment' }, { cmd: 'REPEAT', desc: 'Repeat n' }, { cmd: 'PRINTSCREEN', desc: 'PrtScr' }, { cmd: 'MENU', desc: 'Context' },
    ];
    const DUCK_MAP = {
      DELAY: 'Sleep', STRING: 'Send', STRINGLN: 'Send_NL', ENTER: 'Send("{ENTER}")', TAB: 'Send("{TAB}")', SPACE: 'Send("{SPACE}")',
      BACKSPACE: 'Send("{BACKSPACE}")', DELETE: 'Send("{DELETE}")', INSERT: 'Send("{INSERT}")', HOME: 'Send("{HOME}")', END: 'Send("{END}")',
      PAGEUP: 'Send("{PGUP}")', PAGEDOWN: 'Send("{PGDN}")', UP: 'Send("{UP}")', DOWN: 'Send("{DOWN}")', LEFT: 'Send("{LEFT}")', RIGHT: 'Send("{RIGHT}")',
      ESC: 'Send("{ESC}")', ESCAPE: 'Send("{ESC}")', CAPSLOCK: 'Send("{CAPSLOCK}")', PRINTSCREEN: 'Send("{PRINTSCREEN}")',
      SCROLLLOCK: 'Send("{SCROLLLOCK}")', NUMLOCK: 'Send("{NUMLOCK}")', MENU: 'Send("{APPSKEY}")',
      F1: 'Send("{F1}")', F2: 'Send("{F2}")', F3: 'Send("{F3}")', F4: 'Send("{F4}")', F5: 'Send("{F5}")', F6: 'Send("{F6}")',
      F7: 'Send("{F7}")', F8: 'Send("{F8}")', F9: 'Send("{F9}")', F10: 'Send("{F10}")', F11: 'Send("{F11}")', F12: 'Send("{F12}")',
    };
    const FALLBACK_TEMPLATES = [
      { id: 'T1', name: 'Open Notepad', code: 'DELAY 1500\nGUI r\nDELAY 400\nSTRING notepad\nENTER\nDELAY 600\nSTRING Hello from LENLU SC Forge v4.0!' },
      { id: 'T2', name: 'Classic Rickroll', code: 'DELAY 1500\nGUI r\nDELAY 400\nSTRING https://www.youtube.com/watch?v=dQw4w9WgXcQ\nENTER' },
      { id: 'T3', name: 'System Info Dump', code: 'GUI r\nDELAY 400\nSTRING cmd\nENTER\nDELAY 600\nSTRING systeminfo > %TEMP%\\sysinfo.txt && notepad %TEMP%\\sysinfo.txt\nENTER' },
      { id: 'T4', name: 'Lock Workstation', code: 'GUI r\nDELAY 300\nSTRING rundll32.exe user32.dll,LockWorkStation\nENTER' },
      { id: 'T5', name: 'Open Calculator (Spam)', code: 'GUI r\nDELAY 300\nSTRING calc\nENTER\nREPEAT 10' },
      { id: 'T6', name: 'DuckyScript 3.0 Function Example', code: 'FUNCTION openNotepad()\n    GUI r\n    DELAY 300\n    STRING notepad\n    ENTER\n    DELAY 800\nEND_FUNCTION\n\nopenNotepad()\nSTRING Hello from DuckyScript 3.0!' },
    ];
    let parsedTemplates = [...FALLBACK_TEMPLATES];
    const SNIPPETS = [
      { name: 'Run Dialog', code: 'GUI r\nDELAY 300\n' },
      { name: 'PowerShell Hidden', code: 'STRING powershell -WindowStyle Hidden\nENTER\n' },
      { name: 'Wait 1 Second', code: 'DELAY 1000\n' },
      { name: 'Copy Clipboard', code: 'CTRL c\n' },
      { name: 'Paste', code: 'CTRL v\n' },
      { name: 'Select All', code: 'CTRL a\n' },
      { name: 'Close Window', code: 'ALT F4\n' },
      { name: 'Task Manager', code: 'CTRL SHIFT ESC\n' },
      { name: 'New Tab', code: 'CTRL t\n' },
      { name: 'Screenshot', code: 'PRINTSCREEN\n' },
    ];
    const DUCK_KEY_MAP = {
      'ENTER': 'ENTER', 'TAB': 'TAB', 'SPACE': 'SPACE', 'BACKSPACE': 'BACKSPACE', 'DELETE': 'DELETE', 'ESC': 'ESC', 'ESCAPE': 'ESC',
      'UP': 'UP', 'DOWN': 'DOWN', 'LEFT': 'LEFT', 'RIGHT': 'RIGHT', 'CAPS': 'CAPS', 'CAPSLOCK': 'CAPS',
      'CTRL': 'CTRL', 'ALT': 'ALT', 'SHIFT': 'LSHIFT', 'GUI': 'GUI', 'WINDOWS': 'GUI', 'LSHIFT': 'LSHIFT', 'RSHIFT': 'RSHIFT',
      'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6', 'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
      'HOME': 'CAPS', 'END': 'CAPS', 'PAGEUP': 'CAPS', 'PAGEDOWN': 'CAPS', 'INSERT': 'INSERT',
    };
    const MITRE_DB = [
      { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', desc: 'Adversaries may send phishing messages to gain access to system networks.', mitigation: 'User awareness training, attachment sandboxing, email gateway verification.' },
      { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', desc: 'Adversaries may abuse scripting interfaces (Bash, PowerShell, Python) to execute malicious code.', mitigation: 'Script signing enforcement, restrict interpreter execution, command audit logs.' },
      { id: 'T1053', name: 'Scheduled Task/Job', tactic: 'Persistence', desc: 'Adversaries may abuse scheduling tools (cron, task scheduler) to maintain persistent host access.', mitigation: 'Monitor task folder creations, audit run command contexts.' },
      { id: 'T1027', name: 'Obfuscated Files or Information', tactic: 'Defense Evasion', desc: 'Adversaries may encrypt, encode, or compress file data structures to evade signature detectors.', mitigation: 'De-obfuscation decoding filters, heuristic analysis, behavioral indicators.' },
      { id: 'T1082', name: 'System Information Discovery', tactic: 'Discovery', desc: 'Adversaries may query system profile, build specs, and active users to survey targets.', mitigation: 'Limit command executions, query monitoring.' },
      { id: 'T1041', name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration', desc: 'Adversaries may siphon sensitive database outputs back toCommand and Control nodes.', mitigation: 'Network boundary filters, egress payload inspects, rate monitoring.' }
    ];
export { S, BOOT, ACTS, DUCK_CMDS, DUCK_MAP, FALLBACK_TEMPLATES, SNIPPETS, DUCK_KEY_MAP, MITRE_DB };
window.S = S;
window.BOOT = BOOT;
window.ACTS = ACTS;
window.DUCK_CMDS = DUCK_CMDS;
window.DUCK_MAP = DUCK_MAP;
window.FALLBACK_TEMPLATES = FALLBACK_TEMPLATES;
window.SNIPPETS = SNIPPETS;
window.DUCK_KEY_MAP = DUCK_KEY_MAP;
window.MITRE_DB = MITRE_DB;