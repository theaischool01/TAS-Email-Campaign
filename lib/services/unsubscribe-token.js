/**
 * Shared Unsubscribe Token Logic
 * This file is used by both the Next.js app and the background worker.
 */

const crypto = require('crypto');

const UnsubscribeTokenService = {
  /**
   * Encodes unsubscription data into a simple Base64URL token with HMAC signature
   */
  encodeToken(data) {
    try {
      const json = JSON.stringify(data);
      const payloadBase64 = Buffer.from(json).toString('base64url');
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) {
        throw new Error("NEXTAUTH_SECRET is not configured");
      }
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payloadBase64);
      const signatureBase64 = hmac.digest('base64url');
      return `${payloadBase64}.${signatureBase64}`;
    } catch (e) {
      console.error("Token Encoding Error:", e);
      return "";
    }
  },

  /**
   * Decodes a token back into its data, verifying the HMAC signature if present
   */
  decodeToken(token) {
    if (!token) return null;
    try {
      if (token.includes('.')) {
        const parts = token.split('.');
        if (parts.length !== 2) return null;
        const [payloadBase64, signatureBase64] = parts;
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
          throw new Error("NEXTAUTH_SECRET is not configured");
        }
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payloadBase64);
        const expectedSignature = hmac.digest('base64url');
        
        // Constant-time comparison to prevent timing attacks
        if (signatureBase64.length !== expectedSignature.length || 
            !crypto.timingSafeEqual(Buffer.from(signatureBase64), Buffer.from(expectedSignature))) {
          console.warn("SECURITY WARNING: Invalid token signature detected");
          return null;
        }
        
        const json = Buffer.from(payloadBase64, 'base64url').toString('utf8');
        return JSON.parse(json);
      } else {
        // Legacy unsigned token — decode but mark as legacy
        // Caller (unsubscribe.service.ts) must perform DB validation
        try {
          const json = Buffer.from(token, 'base64url').toString('utf8');
          const payload = JSON.parse(json);
          // Add legacy flag so callers know to validate against DB
          payload._isLegacy = true;
          console.warn('[SECURITY] Legacy unsigned token used',
            { em: payload.em, timestamp: new Date().toISOString() });
          return payload;
        } catch (e) {
          return null;
        }
      }
    } catch (e) {
      // Return null for invalid tokens
      return null;
    }
  }
};

module.exports = UnsubscribeTokenService;

