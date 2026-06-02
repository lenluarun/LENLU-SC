# ⚡ LENLU SC v4.1 — QUICK REFERENCE CARD

## 🎯 MOST USED COMMANDS

### **Open Console First** (F12)

```javascript
// System Status
logSystemStatus()                    // Full system info
performHealthCheck()                 // Run diagnostics

// C2 Operations
exportC2History()                    // Download logs
window.S.beacons                     // List beacons
window.S.currentBeacon               // Current session

// Hardware
enumerateUSBDevices()                // List devices
connectUSBDevice(0x1209, 0x0001)    // Connect device
streamPayloadToUSB(payload)          // Send payload

// Database
await getDBStats()                   // Record counts
await exportAllData()                // Full backup
await clearAllData()                 // Wipe everything
```

---

## 🚀 QUICK WORKFLOWS

### **C2 Hive Workflow**
1. Click **C2 HIVE** tab in nav
2. Select a beacon from list
3. Type command in input box
4. Press Enter or click SEND
5. View response in console

**Example Commands**:
```
DELAY 500 | STRING password | ENTER
GUI r | DELAY 300 | STRING cmd
```

### **Payload Generation Workflow**
1. Click **COMPILER** tab
2. Select target OS
3. Choose language (PowerShell, Python, etc.)
4. Select action (Beacon, Shell, etc.)
5. Enter C2 server
6. Click "Generate Payload"
7. Copy or Save or Export

### **Hardware Flashing Workflow**
1. Compile payload in IDE
2. Click **FLASH TO RUBBER DUCKY** button
3. Select device from browser prompt
4. Wait for device connection message
5. Once connected, "INJECT TO DEVICE" appears
6. Click INJECT to flash
7. Check console for "Payload transmitted"

### **Network Scanning Workflow**
1. Click **SCANNER** tab (if available)
2. Enter target IP (e.g., 192.168.1.1)
3. Select scan type
4. Click "Start Scan"
5. Wait for results
6. Click "Export Results" for HTML report

---

## 🔑 KEY NAVIGATION

| View | Access | Purpose |
|------|--------|---------|
| Compiler | Main nav | Payload generation & flashing |
| C2 HIVE | Main nav | Beacon management |
| ID/Vault | Main nav (original) | Payload storage |
| Scanner | Module system | Network reconnaissance |
| Cracker | Module system | Hash breaking |

---

## 📊 STORAGE & BACKUP

```javascript
// Backup Strategy
exportAllData()                      // Full backup
exportC2History()                    // C2 logs only
exportPayloadAsFile()                // Single payload
exportScanResults()                  // Scan report

// Import Strategy (Manual)
// Saved JSON files can be re-imported via:
// DevTools → Application → Storage → IndexedDB → [right-click] → Put Item
```

---

## 🐛 QUICK TROUBLESHOOT

| Issue | Command |
|-------|---------|
| System broken | `performHealthCheck()` |
| DB not working | `getDBStats()` |
| Beacons missing | `initC2Hive()` |
| USB not detected | `enumerateUSBDevices()` |
| Worker error | Check DevTools console (F12) |
| Page slow | `logSystemStatus()` |
| Lost data | Check IndexedDB in DevTools |

---

## 📱 KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| **F12** | Open DevTools |
| **Ctrl+F5** | Hard refresh (clear cache) |
| **Ctrl+Shift+I** | Open Inspector |
| **Ctrl+L** | Clear console |
| **Enter** (in C2 console) | Send command |

---

## 💾 DATABASE LOCATIONS

**DevTools Access**:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Left sidebar → **Storage** → **IndexedDB**
4. Click **lenluForgeDB**
5. Select store: `vault`, `history`, `captures`, `payloads`, or `beacons`

**Export All Data**:
```javascript
exportAllData()  // Downloads JSON file
```

---

## 🔗 USEFUL LINKS

- **MDN WebUSB**: https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API
- **MDN IndexedDB**: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Web Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
- **WebAssembly**: https://developer.mozilla.org/en-US/docs/WebAssembly

---

## ⚙️ COMMON SETTINGS

```javascript
// Beacon refresh interval
S.beaconRefreshInterval = 5000  // 5 seconds

// Command timeout
S.commandTimeout = 30000  // 30 seconds

// USB device timeout
S.usbTimeout = 60000  // 1 minute

// Hash crack timeout
S.crackTimeout = 300000  // 5 minutes

// Network scan timeout
S.scanTimeout = 30000  // 30 seconds
```

---

## 🎯 MODULE QUICK LOAD

```javascript
// Manual module loading (if nav buttons not working)
window.modules.ide()           // Load Payload IDE
window.modules.cracker()       // Load Hash Cracker
window.modules.scanner()       // Load Network Scanner
window.modules.c2_hive()       // Load C2 Hive
window.modules.hardware()      // Load Hardware Flasher
```

---

## 📞 SUPPORT COMMANDS

```javascript
// Get comprehensive logs
console.log(window.S)          // State object
console.log(window.app)        // App core
console.log(window.dbOperations)  // DB operations

// Check feature availability
'usb' in navigator             // WebUSB available
typeof Worker !== 'undefined'  // Web Workers available
typeof WebAssembly !== 'undefined'  // WASM available

// System information
navigator.hardwareConcurrency  // CPU cores
navigator.userAgent            // Browser info
navigator.language             // System language
```

---

## 🚨 EMERGENCY COMMANDS

```javascript
// Clear corrupted data
clearAllData()                 // ⚠️ Irreversible!

// Force reinitialize
initLenluForge()               // Full restart

// Purge specific store
for (let r of await dbOperations.getAll('vault')) {
  await dbOperations.delete('vault', r.id);
}
```

---

## 🎖️ PRODUCTION CHECKLIST

Before deploying to production:

- [ ] Test all modules in Chrome/Edge
- [ ] Verify IndexedDB persistence
- [ ] Test WebUSB with actual device
- [ ] Check all exports work
- [ ] Verify HTTPS is used
- [ ] Test on target network
- [ ] Backup critical data
- [ ] Document custom settings
- [ ] Test disaster recovery
- [ ] Set proper CORS headers

---

## 📈 PERFORMANCE TIPS

```javascript
// Monitor database size
const stats = await getDBStats()

// Optimize by clearing old history
const oldHistory = await dbOperations.getAll('history')
for (let r of oldHistory) {
  if (Date.now() - r.timestamp > 30*24*60*60*1000) {
    await dbOperations.delete('history', r.id)
  }
}

// Check worker activity
window.app.workerManager.workers
```

---

**Version**: 4.1 | **Status**: Production Ready | **Updated**: June 2, 2026
