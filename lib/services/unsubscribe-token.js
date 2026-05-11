/**
 * Shared Unsubscribe Token Logic
 * This file is used by both the Next.js app and the background worker.
 */

const UnsubscribeTokenService = {
  /**
   * Encodes unsubscription data into a simple Base64URL token
   */
  encodeToken(data) {
    try {
      const json = JSON.stringify(data);
      return Buffer.from(json).toString('base64url');
    } catch (e) {
      console.error("Token Encoding Error:", e);
      return "";
    }
  },

  /**
   * Decodes a token back into its data
   */
  decodeToken(token) {
    if (!token) return null;
    try {
      const json = Buffer.from(token, 'base64url').toString('utf8');
      return JSON.parse(json);
    } catch (e) {
      // Return null for invalid tokens
      return null;
    }
  }
};

module.exports = UnsubscribeTokenService;
