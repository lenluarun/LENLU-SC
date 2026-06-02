import { S, MITRE_DB } from './state.js';
import { toast } from './ui.js';
    function renderMitreGrid() {
      const q = document.getElementById('mitreSearch')?.value?.toLowerCase() || '';
      const grid = document.getElementById('mitreMatrixGrid');
      if (!grid) return;
      grid.innerHTML = '';

      const filtered = MITRE_DB.filter(t => t.name.toLowerCase().includes(q) || t.tactic.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
      
      filtered.forEach(tech => {
        const card = document.createElement('div');
        card.className = 'vault-item flex-col';
        card.style.padding = '8px';
        card.style.cursor = 'pointer';
        card.innerHTML = `
          <div class="text-xs font-bold" style="color:var(--g)">${tech.id}</div>
          <div class="text-xs truncate font-bold" style="color:var(--white);margin:2px 0">${tech.name}</div>
          <div class="text-muted" style="font-size:.56rem">${tech.tactic.toUpperCase()}</div>
        `;
        card.onclick = () => inspectMitreTechnique(tech);
        grid.appendChild(card);
      });

      if (!filtered.length) {
        grid.innerHTML = '<div class="text-muted text-xs">No matching techniques found.</div>';
      }
    }
    function inspectMitreTechnique(tech) {
      const ins = document.getElementById('mitreInspector');
      if (!ins) return;

      ins.innerHTML = `
        <div class="flex justify-between"><strong>TECHNIQUE:</strong> <span class="badge badge-r">${tech.id}</span></div>
        <div style="font-family:var(--font-display);font-size:.9rem;color:var(--white);margin-top:5px">${tech.name}</div>
        <div style="font-size:.65rem;color:var(--muted)">TACTIC: ${tech.tactic.toUpperCase()}</div>
        <hr style="border-color:var(--gbord)">
        <div class="text-xs text-muted" style="line-height:1.7">
          <strong>Description:</strong><br>${tech.desc}
        </div>
        <hr style="border-color:var(--gbord)">
        <div class="text-xs" style="line-height:1.7;color:var(--cyan)">
          <strong>Security Mitigation Controls:</strong><br>${tech.mitigation}
        </div>
      `;
    }
    function loadDefaultAuditTemplate() {
      const txt = document.getElementById('auditConfigInput');
      if (txt) {
        txt.value = JSON.stringify({
          browser_webrtc_leak: "exposed",
          canvas_entropy_hash: "unique",
          dnt_header_sent: "false",
          local_cookie_tracking: "active",
          user_agent_spoofed: "false",
          active_firewall_zone: "untrusted"
        }, null, 2);
      }
    }
    function runComplianceAudit() {
      const input = document.getElementById('auditConfigInput')?.value || '';
      const scoreVal = document.getElementById('auditScoreVal');
      const scoreFill = document.getElementById('auditScoreFill');
      const assessmentText = document.getElementById('auditAssessmentText');
      const recsPanel = document.getElementById('auditRecommendationsPanel');

      if (!input) {
        loadDefaultAuditTemplate();
        return;
      }

      let score = 92;
      const recs = [];

      try {
        const cfg = JSON.parse(input);
        
        if (cfg.browser_webrtc_leak === 'exposed') {
          score -= 20;
          recs.push({ title: 'Disable WebRTC telemetry endpoints', advice: 'WebRTC exposes your actual local IP even behind VPN tunnels. Hardening requires toggling WebRTC disable inside browser parameters.' });
        }
        if (cfg.canvas_entropy_hash === 'unique') {
          score -= 15;
          recs.push({ title: 'Randomize Canvas draw hashes', advice: 'Browsers render hidden canvas vectors to generate unique tracking identifiers. Add canvas randomizers extension to inject subtle noise.' });
        }
        if (cfg.dnt_header_sent === 'false') {
          score -= 10;
          recs.push({ title: 'Enable DNT (Do Not Track) flag', advice: 'Send active DNT headers to notify telemetry platforms to drop local session cookies.' });
        }
        if (cfg.local_cookie_tracking === 'active') {
          score -= 15;
          recs.push({ title: 'Sanitize persistent storage sweeps', advice: 'Flush local database caches, IndexedDB rows, and third-party cookies on page closures.' });
        }
        if (cfg.user_agent_spoofed === 'false') {
          score -= 12;
          recs.push({ title: 'Spoof userAgent properties', advice: 'Default navigator strings expose accurate OS builds and browsers. Install UA rotators to spoof device signatures.' });
        }
        if (cfg.active_firewall_zone === 'untrusted') {
          score -= 15;
          recs.push({ title: 'Restrict firewall subnet routing paths', advice: 'Configure network zones to lock direct communication from WAN ports directly to inner databases.' });
        }
      } catch (e) {
        toast('Non-JSON config parsed: Running default profile', 'info');
        // fall back to default scores
        score = 45;
        recs.push({ title: 'Integrate WebRTC IP masking controls', advice: 'Lock network leak points.' });
        recs.push({ title: 'Hardened Browser Profile deployment', advice: 'Install Canvas noise generators.' });
      }

      const finalScore = Math.max(0, score);
      scoreVal.textContent = finalScore + '%';
      scoreFill.style.width = finalScore + '%';

      if (finalScore > 80) {
        scoreVal.style.color = 'var(--g)';
        scoreVal.style.textShadow = '0 0 15px var(--g)';
        assessmentText.textContent = 'COMPLIANT POSTURE NOMINAL. EXPOSURE IS MINIMIZED.';
      } else if (finalScore > 50) {
        scoreVal.style.color = 'var(--amber)';
        scoreVal.style.textShadow = '0 0 15px var(--amber)';
        assessmentText.textContent = 'WARNING: MODERATE CONFIGURATION EXPOSURES DETECTED.';
      } else {
        scoreVal.style.color = 'var(--red)';
        scoreVal.style.textShadow = '0 0 15px var(--red)';
        assessmentText.textContent = 'CAUTION: COMPLIANCE VIOLATION. SEVERE TELEMETRY PROFILE RISKS.';
      }

      // Render recommendation cards
      if (recsPanel) {
        recsPanel.innerHTML = '';
        recs.forEach(rec => {
          const div = document.createElement('div');
          div.className = 'vault-item flex-col';
          div.style.padding = '10px';
          div.innerHTML = `
            <div class="text-xs font-bold" style="color:var(--amber)"><i class="fas fa-exclamation-triangle"></i> ${rec.title}</div>
            <div class="text-xs text-muted" style="margin-top:3px;line-height:1.7">${rec.advice}</div>
          `;
          recsPanel.appendChild(div);
        });
        if (!recs.length) {
          recsPanel.innerHTML = '<div class="text-g text-xs">// Configuration profile is fully hardened. All diagnostics audit checks passed.</div>';
        }
      }
      toast('Compliance audit complete', 'ok');
    }
export { renderMitreGrid, inspectMitreTechnique, loadDefaultAuditTemplate, runComplianceAudit };
window.renderMitreGrid = renderMitreGrid;
window.inspectMitreTechnique = inspectMitreTechnique;
window.loadDefaultAuditTemplate = loadDefaultAuditTemplate;
window.runComplianceAudit = runComplianceAudit;