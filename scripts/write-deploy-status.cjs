const crypto = require('crypto');
const https = require('https');

const status = process.argv[2]; // 'success' or 'failed'
const errorMsg = process.argv[3] || '';

if (!status || (status !== 'success' && status !== 'failed')) {
  console.error('Usage: node write-deploy-status.js <success|failed> [errorMessage]');
  process.exit(1);
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is missing.');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (e) {
  console.error('Failed to parse service account JSON:', e.message);
  process.exit(1);
}

function getAccessToken(sa) {
  return new Promise((resolve, reject) => {
    const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const jwtClaim = Buffer.from(JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.database',
      aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })).toString('base64url');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(jwtHeader + '.' + jwtClaim);
    const signature = sign.sign(sa.private_key, 'base64url');

    const jwt = jwtHeader + '.' + jwtClaim + '.' + signature;
    const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;

    const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
    const url = new URL(tokenUri);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.access_token) {
            resolve(data.access_token);
          } else {
            reject(new Error('No access token in response: ' + body));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function updateFirebase(accessToken, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = https.request({
      hostname: 'melishare-redirect-payo-default-rtdb.firebaseio.com',
      path: '/config/lastDeploy.json',
      method: 'PUT', // Overwrite this node
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Firebase REST API failed with code ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  try {
    console.log(`Fetching Google OAuth2 access token for ${serviceAccount.client_email}...`);
    const token = await getAccessToken(serviceAccount);
    console.log('OAuth2 token retrieved successfully.');

    const deployData = {
      status: status,
      timestamp: Date.now(),
      commit: process.env.GITHUB_SHA || 'unknown',
      runId: process.env.GITHUB_RUN_ID || 'unknown',
      actor: process.env.GITHUB_ACTOR || 'unknown',
      errorMessage: errorMsg
    };

    console.log('Writing status to Firebase RTDB /config/lastDeploy:', JSON.stringify(deployData));
    await updateFirebase(token, deployData);
    console.log('Firebase RTDB updated successfully.');
  } catch (err) {
    console.error('Error writing deploy status to Firebase:', err.message);
    process.exit(1);
  }
}

run();
