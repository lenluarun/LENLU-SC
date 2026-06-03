const crypto = require('crypto');
const { addAuditLog } = require('../lib/db-helper.js');

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  // Handle server-side hardcoded credentials securely
  const user1_valid = username === 'lenlu' && password === (process.env.ADMIN_PASSWORD_LENLU || 'aruneshforgeauthor');
  const user2_valid = username === 'manisha' && password === (process.env.ADMIN_PASSWORD_MANISHA || 'manishamadam');

  if (!user1_valid && !user2_valid) {
    await addAuditLog(username || 'unknown', 'Admin Login Failed', 'FAIL', 'Incorrect passkey. Client: ' + ((req.headers || {})['user-agent'] || 'Unknown Agent'));
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }

  // Create secure signed stateless session token
  const payloadData = {
    username,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours validity
  };
  const payload = JSON.stringify(payloadData);
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  const token = Buffer.from(payload).toString('base64') + '.' + signature;

  await addAuditLog(username, 'Admin Login Success', 'SUCCESS', 'Authenticated session token issued.');

  return res.status(200).json({
    success: true,
    token,
    username
  });
};
