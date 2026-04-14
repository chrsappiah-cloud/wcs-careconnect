'use strict';
/**
 * cognitoAuth.js — Amazon Cognito JWT verification middleware
 *
 * Verifies Bearer tokens issued by the CareConnect Cognito User Pool.
 * Attaches decoded claims to req.user:
 *   { sub, username, email, groups: string[] }
 *
 * Only active when COGNITO_USER_POOL_ID + COGNITO_CLIENT_ID are set.
 * In development (without those vars) requireAuth is a pass-through.
 */
const { CognitoJwtVerifier } = require('aws-jwt-verify');

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID    = process.env.COGNITO_CLIENT_ID;

let verifier = null;

if (USER_POOL_ID && CLIENT_ID) {
  verifier = CognitoJwtVerifier.create({
    userPoolId: USER_POOL_ID,
    tokenUse:   'access',
    clientId:   CLIENT_ID,
  });
}

/**
 * requireAuth — rejects requests without a valid Cognito access token.
 * Skip this middleware in development by leaving COGNITO_USER_POOL_ID unset.
 */
async function requireAuth(req, res, next) {
  if (!verifier) {
    // Cognito not configured — pass through (development mode)
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifier.verify(token);
    req.user = {
      sub:      payload.sub,
      username: payload['cognito:username'],
      email:    payload.email,
      groups:   payload['cognito:groups'] || [],
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * requireGroup — returns middleware that checks the user belongs to a group.
 * Must be used after requireAuth.
 *
 * Example: router.post('/admin/route', requireAuth, requireGroup('admin'), handler)
 */
function requireGroup(group) {
  return (req, res, next) => {
    if (!verifier) return next(); // dev pass-through
    if (!req.user?.groups?.includes(group)) {
      return res.status(403).json({ error: `Forbidden — requires group: ${group}` });
    }
    next();
  };
}

module.exports = { requireAuth, requireGroup };
