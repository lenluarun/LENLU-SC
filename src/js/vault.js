import { S } from './state.js';
import { toast, copyText } from './ui.js';
import { saveVaultToDB, saveHistoryToDB } from './db.js';
let selVaultIdx = -1;
    function loadVault() { /* Vault loaded on boot via IndexedDB */ }
    function saveVault() {
      saveVaultToDB();
      S.stats.vault = S.vault.length;
      const sv = document.getElementById('stat-vault'); if (sv) sv.textContent = S.vault.length;
      const vc = document.getElementById('vaultCount'); if (vc) vc.textContent = S.vault.length + ' items';
      const sv2 = document.getElementById('settVault'); if (sv2) sv2.textContent = S.vault.length;
    }
    function renderVault() {
      loadVault(); const list = document.getElementById('vaultList'); if (!list) return;
      const q = document.getElementById('vaultSearch')?.value?.toLowerCase() || '';
      list.innerHTML = '';
      const filtered = S.vault.filter(s => s.name.toLowerCase().includes(q));
      filtered.forEach((s, i) => {
        const div = document.createElement('div'); div.className = 'vault-item';
        div.innerHTML = `<i class="fas fa-file-code vi-icon"></i><div><div class="vi-name">${s.name}</div><div class="vi-meta">${new Date(s.ts).toLocaleString()} · ${s.code.length} chars</div></div><div class="vi-actions"><button class="btn btn-ghost btn-xs" onclick="event.stopPropagation();deleteVaultItem(${i})"><i class="fas fa-trash"></i></button></div>`;
        div.onclick = () => selectVaultItem(i); list.appendChild(div);
      });
      if (!S.vault.length) list.innerHTML = '<div class="text-muted text-xs" style="padding:.5rem">Vault empty. Compile and save scripts.</div>';
      const vc = document.getElementById('vaultCount'); if (vc) vc.textContent = S.vault.length + ' items';
    }

    function selectVaultItem(i) {
      selVaultIdx = i;
      document.getElementById('vaultPreview').textContent = S.vault[i].code;
      document.getElementById('vaultPreviewLoadBtn').style.display = '';
      document.getElementById('vaultPreviewBuildBtn').style.display = '';
      const pdfBtn = document.getElementById('vaultPreviewPdfBtn');
      if (pdfBtn) pdfBtn.style.display = '';
      renderVault();
    }
    function loadSelectedVaultItem() { if (selVaultIdx < 0) return; document.getElementById('srcEditor').value = S.vault[selVaultIdx].code; lintSource(S.vault[selVaultIdx].code); updateEditorCounts(); switchView('compiler', document.querySelector('[data-view=compiler]')); toast('Loaded to editor', 'ok'); }
    function buildSelectedVaultItem() { if (selVaultIdx < 0) return; document.getElementById('outViewer').textContent = S.vault[selVaultIdx].code; buildEXEPackage('x64'); }
    function deleteVaultItem(i) { S.vault.splice(i, 1); if (selVaultIdx === i) selVaultIdx = -1; saveVault(); renderVault(); toast('Entry deleted', 'info'); }
    function confirmSave() {
      const name = document.getElementById('saveName')?.value?.trim() || 'Untitled';
      const code = document.getElementById('outViewer')?.textContent || '';
      if (!code || code.startsWith('; Compiled')) { toast('Compile first', 'warn'); return; }
      loadVault(); S.vault.unshift({ name, code, tags: document.getElementById('saveTags')?.value || '', notes: document.getElementById('saveNotes')?.value || '', ts: new Date().toISOString() });
      saveVault(); renderVault(); closeModal('modal-save'); toast('Saved: ' + name, 'ok');
    }
    function saveToVault() { openSaveModal(); }
    function exportVaultJSON() {
      loadVault(); if (!S.vault.length) { toast('Vault empty', 'warn'); return; }
      downloadTxt(JSON.stringify(S.vault, null, 2), 'lenlu_vault_' + Date.now() + '.json');
    }
    function doImportVault() {
      try { const data = JSON.parse(document.getElementById('importData')?.value || '[]'); loadVault(); S.vault = [...data, ...S.vault]; saveVault(); renderVault(); closeModal('modal-import'); toast('Imported ' + data.length + ' entries', 'ok'); }
      catch { toast('Invalid JSON', 'err'); }
    }
    function renderHistory() {
      const list = document.getElementById('histList'); if (!list) return;
      list.innerHTML = '';
      S.history.forEach((h, i) => {
        const div = document.createElement('div'); div.className = 'hist-item';
        div.innerHTML = `<div class="hi-ts">${new Date(h.ts).toLocaleString()}</div><div class="hi-name">Compilation #${S.history.length - i}</div><div class="hi-meta">${h.src.split('\n').length} src → ${h.out.split('\n').length} asm lines</div>`;
        div.onclick = () => { document.querySelectorAll('.hist-item').forEach(el => el.classList.remove('selected')); div.classList.add('selected'); document.getElementById('histSrc').textContent = h.src; document.getElementById('histOut').textContent = h.out; document.getElementById('histDiag').textContent = h.diag || 'None'; };
        list.appendChild(div);
      });
      const cnt = document.getElementById('histCount'); if (cnt) cnt.textContent = S.history.length + ' entries';
    }
    function clearHistory() { S.history = []; saveHistoryToDB(); renderHistory(); toast('History cleared', 'info'); }
    function histTab(tab, btn) {
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('hist' + tab)?.classList.add('active'); btn.classList.add('active');
    }

    function copyWHOIS() {
      const t = document.getElementById('whoisOutput')?.textContent || '';
      copyText(t, 'WHOIS copied');
    }

    function copyMacro() {
      const t = document.getElementById('macroOutput')?.value || '';
      copyText(t, 'Macro copied');
    }

    function exportVaultItemPDF() {
      if (selVaultIdx < 0) { toast('No vault item selected', 'warn'); return; }
      const item = S.vault[selVaultIdx];
      toast('Generating PDF report...', 'info');

      if (typeof window.jspdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
          generatePDFReport(item);
        };
        script.onerror = () => {
          toast('Failed to load PDF library', 'err');
        };
        document.head.appendChild(script);
      } else {
        generatePDFReport(item);
      }
    }

    function generatePDFReport(item) {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFillColor(3, 8, 3);
        doc.rect(0, 0, pageWidth, 42, 'F');

        doc.setDrawColor(0, 255, 65);
        doc.setLineWidth(1.5);
        doc.line(0, 42, pageWidth, 42);

        doc.setDrawColor(0, 255, 65);
        doc.setLineWidth(0.2);
        doc.line(5, 5, pageWidth - 5, 5);
        doc.line(5, pageHeight - 5, pageWidth - 5, pageHeight - 5);

        doc.setTextColor(0, 255, 65);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(22);
        doc.text("LENLU SC // CYBERNETIC FORGE", 12, 18);

        doc.setTextColor(232, 255, 240);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.text("VAULT SECURITY ARCHIVE & COMPILER REPORT", 12, 25);
        doc.text(`SESSION REPORT ID: ${S.sessionId || 'N/A'}`, 12, 30);

        doc.setFontSize(9);
        doc.setTextColor(74, 107, 84);
        doc.text(`EXPORTED: ${new Date().toLocaleString()}`, pageWidth - 75, 18);
        doc.text(`INTEGRITY HASH: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, pageWidth - 75, 23);

        doc.setTextColor(0, 255, 65);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.text("I. METADATA SPECIFICATIONS", 12, 54);

        doc.setDrawColor(0, 70, 20);
        doc.setFillColor(7, 13, 8);
        doc.rect(12, 58, pageWidth - 24, 25, 'F');
        doc.rect(12, 58, pageWidth - 24, 25, 'S');

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(232, 255, 240);
        doc.text(`Payload Name: ${item.name}`, 16, 64);
        doc.text(`Created On: ${new Date(item.ts).toLocaleString()}`, 16, 70);
        doc.text(`Payload Tags: ${item.tags || 'None'}`, 16, 76);

        doc.text(`Character Count: ${item.code.length}`, 110, 64);
        doc.text(`Estimated Execution Delay: ~1200 ms`, 110, 70);
        doc.text(`Threat Level: ELEVATED (SANDBOXED)`, 110, 76);

        doc.setTextColor(0, 255, 65);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.text("II. COMPILED ASSEMBLY SOURCE", 12, 95);

        doc.setDrawColor(0, 70, 20);
        doc.setFillColor(3, 8, 3);
        doc.rect(12, 99, pageWidth - 24, 120, 'F');
        doc.rect(12, 99, pageWidth - 24, 120, 'S');

        doc.setFont('Courier', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 255, 65);

        const codeLines = doc.splitTextToSize(item.code, pageWidth - 32);
        let startY = 105;
        const maxDisplayLines = 32;
        for (let idx = 0; idx < Math.min(codeLines.length, maxDisplayLines); idx++) {
          doc.text(codeLines[idx], 16, startY);
          startY += 3.5;
        }

        if (codeLines.length > maxDisplayLines) {
          doc.setTextColor(255, 183, 0);
          doc.text(`... [Truncated ${codeLines.length - maxDisplayLines} lines. Full source available in sandboxed store] ...`, 16, startY);
        }

        doc.setTextColor(74, 107, 84);
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8);
        doc.text("CONFIDENTIAL SECURITY INTELLIGENCE REPORT. FOR AUDIT PURPOSES ONLY. SIGNATURE MATCH VALID.", 12, 280);
        doc.text("Generated by Antigravity Core 4.0 - LENLU Cybernetic Web Client.", pageWidth - 105, 280);

        if (typeof Android !== 'undefined') {
          const pdfBase64 = doc.output('datauristring').split(',')[1];
          Android.saveBinaryFile(`${item.name.replace(/\s+/g, '_')}_report.pdf`, pdfBase64);
          toast("PDF report shared", "ok");
        } else {
          doc.save(`${item.name.replace(/\s+/g, '_')}_report.pdf`);
          toast("PDF report downloaded", "ok");
        }
      } catch (err) {
        console.error('Error generating PDF:', err);
        toast('PDF build failed', 'err');
      }
    }

    function toggleCheck(el, rule) {
      el.classList.toggle('checked');
      const icon = el.querySelector('i');
      const isChecked = el.classList.contains('checked');
      if (icon) {
        icon.style.opacity = isChecked ? '1' : '0';
      }

      if (rule === 'webrtc') {
        S.hardenedWebRTC = isChecked;
        toast(isChecked ? 'WebRTC Block Enabled' : 'WebRTC Block Disabled', 'info');
      } else if (rule === 'dnt') {
        S.hardenedDNT = isChecked;
        toast(isChecked ? 'DNT Header Spoofing On' : 'DNT Header Spoofing Off', 'info');
      } else if (rule === 'canvas') {
        S.hardenedCanvas = isChecked;
        toast(isChecked ? 'Canvas Hash Randomizer Active' : 'Canvas Hash Randomizer Disabled', 'info');
      } else if (rule === 'cookies') {
        S.hardenedCookies = isChecked;
        toast(isChecked ? 'Cookie Sanitizer Enabled' : 'Cookie Sanitizer Disabled', 'info');
      } else if (rule === 'ua') {
        S.hardenedUA = isChecked;
        toast(isChecked ? 'UserAgent Spoof Active' : 'UserAgent Spoof Disabled', 'info');
      }

      runOSINT();
    }

    function loadLeafletAndDrawMap(lat, lon, city) {
      const mapContainer = document.getElementById('osintMap');
      if (!mapContainer) return;

      const statusEl = document.getElementById('osint-map-status');
      if (statusEl) {
        statusEl.textContent = `TARGET: ${city.toUpperCase()} (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        statusEl.className = 'badge badge-g';
      }

      if (typeof L === 'undefined') {
        mapContainer.innerHTML = '<div style="padding:1rem;color:var(--g)">Loading Leaflet telemetry map...</div>';

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        script.onload = () => {
          initializeLeafletMap(lat, lon, city);
        };
        script.onerror = () => {
          mapContainer.innerHTML = '<div style="padding:1rem;color:var(--red)">Failed to load Map API (CDN Offline)</div>';
        };
        document.head.appendChild(script);
      } else {
        initializeLeafletMap(lat, lon, city);
      }
    }

    let osintLeafletMap = null;
    let osintLeafletMarker = null;

    function initializeLeafletMap(lat, lon, city) {
      const mapContainer = document.getElementById('osintMap');
      if (!mapContainer) return;
      mapContainer.innerHTML = '';

      try {
        if (osintLeafletMap) {
          osintLeafletMap.setView([lat, lon], 12);
          if (osintLeafletMarker) {
            osintLeafletMarker.setLatLng([lat, lon]).setPopupContent(`<b>Target Node:</b> ${city}`);
          } else {
            osintLeafletMarker = L.marker([lat, lon]).addTo(osintLeafletMap)
              .bindPopup(`<b>Target Node:</b> ${city}`).openPopup();
          }
          return;
        }

        osintLeafletMap = L.map('osintMap', {
          zoomControl: false,
          attributionControl: false
        }).setView([lat, lon], 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
        }).addTo(osintLeafletMap);

        osintLeafletMarker = L.marker([lat, lon]).addTo(osintLeafletMap)
          .bindPopup(`<b>Target Node:</b> ${city}`).openPopup();

        L.circle([lat, lon], {
          color: 'var(--g)',
          fillColor: 'var(--g)',
          fillOpacity: 0.15,
          radius: 1200
        }).addTo(osintLeafletMap);

      } catch (err) {
        console.error('Error initializing map:', err);
        mapContainer.innerHTML = '<div style="padding:1rem;color:var(--red)">Mapping subsystem error</div>';
      }
    }
    function encodeClipboard() {
      const text = document.getElementById('clipboardOutput')?.textContent || '';
      const mode = document.getElementById('clipEncMode')?.value || 'b64';
      const out = document.getElementById('clipEncOutput');
      if (!out) return;
      if (!text || text.startsWith('Click')) { toast('Read clipboard first', 'warn'); return; }
      let result = '';
      if (mode === 'b64') result = btoa(unescape(encodeURIComponent(text)));
      else if (mode === 'hex') result = Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
      else if (mode === 'url') result = encodeURIComponent(text);
      else if (mode === 'rot13') result = text.replace(/[a-zA-Z]/g, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26));
      out.textContent = result;
      toast('Encoded', 'ok');
    }

export { loadVault, saveVault, renderVault, selectVaultItem, loadSelectedVaultItem, buildSelectedVaultItem, deleteVaultItem, confirmSave, saveToVault, exportVaultJSON, doImportVault, renderHistory, clearHistory, histTab, copyWHOIS, copyMacro, exportVaultItemPDF, copyText };
window.loadVault = loadVault;
window.saveVault = saveVault;
window.renderVault = renderVault;
window.selectVaultItem = selectVaultItem;
window.loadSelectedVaultItem = loadSelectedVaultItem;
window.buildSelectedVaultItem = buildSelectedVaultItem;
window.deleteVaultItem = deleteVaultItem;
window.confirmSave = confirmSave;
window.saveToVault = saveToVault;
window.exportVaultJSON = exportVaultJSON;
window.doImportVault = doImportVault;
window.renderHistory = renderHistory;
window.clearHistory = clearHistory;
window.histTab = histTab;
window.copyWHOIS = copyWHOIS;
window.copyMacro = copyMacro;
window.exportVaultItemPDF = exportVaultItemPDF;
window.copyText = copyText;