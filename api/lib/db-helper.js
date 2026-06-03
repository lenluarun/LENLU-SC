const fs = require('fs');
const path = require('path');

const LOCAL_JSON_PATH = path.resolve(__dirname, '../../src/data/content.json');

// Memory cache for backend calls
let memoryCache = null;

async function readContent() {
  // 1. Try MongoDB if URI provided
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = require('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db('lenlu_sc');
      const doc = await db.collection('content').findOne({ id: 'site_data' });
      await client.close();
      if (doc) {
        // Remove MongoDB internal ID before returning
        delete doc._id;
        return doc;
      }
    } catch (err) {
      console.error('MongoDB Read Error, falling back to file:', err.message);
    }
  }

  // 2. Return memory cache if populated
  if (memoryCache) {
    return memoryCache;
  }

  // 3. Fallback to local JSON file
  try {
    if (fs.existsSync(LOCAL_JSON_PATH)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_JSON_PATH, 'utf8'));
      memoryCache = data;
      return data;
    }
  } catch (err) {
    console.error('Local JSON file read error:', err.message);
  }

  // 4. Default Seed data structure
  return getSeedData();
}

async function writeContent(data) {
  memoryCache = data;

  // 1. Try MongoDB if URI provided
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = require('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db('lenlu_sc');
      await db.collection('content').replaceOne(
        { id: 'site_data' },
        { id: 'site_data', ...data },
        { upsert: true }
      );
      await client.close();
      return true;
    } catch (err) {
      console.error('MongoDB Write Error, falling back to file:', err.message);
    }
  }

  // 2. Save to local JSON file
  try {
    const dir = path.dirname(LOCAL_JSON_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Local JSON file write error:', err.message);
    return false;
  }
}

function getSeedData() {
  return {
    site_settings: {
      title_cyber: "BLACKBOX <em>FORGE</em> v4.0",
      title_skeu: "ANALOG <em>FORGE</em> v4.0",
      sub_cyber: "Real-world cybernetic command console. DuckyScript → Aut2Exe EXE compiler, live BLE scanner, DNS recon, localhost port sweep. All operations client-side sandboxed.",
      sub_skeu: "An analog command desk with brass dials, leather lining, and vacuum-tube amplifiers. Mechanical keystroke relays, physical Bluetooth proximity sweeps, DNS wiretap records, and WebRTC leakage diagnostics. Completely client-side sandboxed relays."
    },
    profile: {
      name: "Arunesh",
      role: "AI & ML Engineer",
      bio: "Arunesh is a Senior AI & Machine Learning Engineer specializing in agentic workflows, embedded inference models, and real-time telemetry processing. As the lead architect of the <strong>LENLU SC Command Deck</strong>, he designs and deploys local LLM pipelines, speech-recognition neural synthesis engines, and client-side security sandboxes optimized for low-latency tactical diagnostics.",
      tags: ["Agentic Workflows", "Local LLMs", "Speech & DSP", "Telemetry Parsing"],
      avatar_icon: "fas fa-user-secret"
    },
    capabilities: [
      { id: "A01", title: "DuckyScript 3.0 Interpreter", desc: "Supports recursion limits, function declarations, multi-arg loops, execution speeds delay metrics calibration, and full syntax validation.", target_view: "compiler" },
      { id: "A02", title: "Neural Generative Synth", desc: "Asynchronous integration with leading LLMs using CORS proxy support warnings, speech translation API, and direct code ingestion channels.", target_view: "neural" },
      { id: "A03", title: "Web Bluetooth BLE Telemetry", desc: "Active scan triggers to detect surrounding wireless nodes, capturing RSSI metrics and streaming structured base64 data to our frontend displays.", target_view: "scanner" },
      { id: "A04", title: "GeoIP and Network Jitter API", desc: "Pinpoint local ISP parameters to evaluate latency drops, round-trip connection stability checks, and Cloudflare deauth test mocks.", target_view: "network" },
      { id: "A05", title: "Local Sockets Sweep", desc: "Asynchronously pings common developer host ports (like 80, 443, 3000, 8080) to detect open network server channels on local environments.", target_view: "network" },
      { id: "A06", title: "Acoustic Audio Analyser", desc: "Leverages the Web Audio API FFT analyser node to parse sound wave frequencies, driving dynamic 2D canvas spectrum visualizations.", target_view: "scanner" }
    ],
    templates: [
      { id: "T1", name: "Open Notepad and Type Message", code: "DELAY 1500\nGUI r\nDELAY 400\nSTRING notepad\nENTER\nDELAY 600\nSTRINGLN Welcome to the DuckyScript Payload Collection!\nSTRING This is for authorized testing only." },
      { id: "T2", name: "Rickroll", code: "DELAY 1000\nGUI r\nDELAY 300\nSTRING https://www.youtube.com/watch?v=dQw4w9wgxcq\nENTER" }
    ]
  };
}

async function addAuditLog(username, action, status, details = '') {
  try {
    const data = await readContent();
    if (!data.audit_logs) {
      data.audit_logs = [];
    }
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
      username,
      action,
      status,
      details
    };
    data.audit_logs.unshift(newLog);
    if (data.audit_logs.length > 100) {
      data.audit_logs = data.audit_logs.slice(0, 100);
    }
    await writeContent(data);
  } catch (err) {
    console.error('Failed to add audit log:', err.message);
  }
}

module.exports = {
  readContent,
  writeContent,
  addAuditLog
};
