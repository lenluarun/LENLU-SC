const crypto = require('crypto');
const { readContent, writeContent, addAuditLog } = require('./lib/db-helper.js');

const SECRET_KEY = process.env.ADMIN_JWT_SECRET || 'lenlu-sc-auth-neural-default-secret-891';

module.exports = async function handler(req, res) {
  // Add CORS headers for robustness
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET Request: Retrieve dynamically saved website content
  if (req.method === 'GET') {
    try {
      const data = await readContent();
      res.setHeader('X-Storage-Engine', process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local File');
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to read content: ' + e.message });
    }
  }

  // 2. POST Request: Update dynamically saved website content (Auth Required)
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/, '').trim();

    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing' });
    }

    let sessionData;
    // Verify custom signature token
    try {
      const [base64Payload, signature] = token.split('.');
      if (!base64Payload || !signature) {
        throw new Error('Malformed token structure');
      }

      const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
      const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');

      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid session signature' });
      }

      sessionData = JSON.parse(payload);
      if (sessionData.exp < Date.now()) {
        return res.status(401).json({ error: 'Admin session expired' });
      }
    } catch (err) {
      return res.status(401).json({ error: 'Authentication failed: ' + err.message });
    }

    // Attempt to write the payload data to database/file
    try {
      // 1. Purge logs action
      if (req.body && req.body.action === 'clear_logs') {
        const oldContent = await readContent();
        oldContent.audit_logs = [];
        const success = await writeContent(oldContent);
        if (success) {
          await addAuditLog(sessionData.username || 'admin', 'Logs Purged', 'SUCCESS', 'Admin cleared all security audit trails.');
          res.setHeader('X-Storage-Engine', process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local File');
          return res.status(200).json({ success: true, message: 'Logs purged successfully' });
        } else {
          return res.status(500).json({ error: 'Failed to purge logs' });
        }
      }

      // 2. Restore backup action
      if (req.body && req.body.action === 'restore_backup') {
        const payloadData = req.body.data || {};
        const oldContent = await readContent();
        const updatedContent = {
          ...payloadData,
          audit_logs: payloadData.audit_logs || oldContent.audit_logs || []
        };
        const success = await writeContent(updatedContent);
        if (success) {
          await addAuditLog(sessionData.username || 'admin', 'System Restore', 'SUCCESS', 'Full system state restored from uploaded JSON backup.');
          res.setHeader('X-Storage-Engine', process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local File');
          return res.status(200).json({ success: true, message: 'System restored successfully' });
        } else {
          return res.status(500).json({ error: 'Failed to write restore configuration' });
        }
      }

      // 3. Standard configuration update
      const oldContent = await readContent();
      const updatedContent = {
        ...oldContent,
        ...req.body,
        audit_logs: oldContent.audit_logs || [] // preserve logs
      };

      const success = await writeContent(updatedContent);
      if (success) {
        await addAuditLog(sessionData.username || 'admin', 'Configuration Updated', 'SUCCESS', 'System variables and payload matrices refreshed.');
        res.setHeader('X-Storage-Engine', process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local File');
        return res.status(200).json({ success: true, message: 'Content pushed successfully' });
      } else {
        return res.status(500).json({ error: 'Failed to commit updates to storage' });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to write content: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
