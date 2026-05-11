/**
 * Secure Unsubscribe Token Service (CommonJS for worker compatibility)
 */

class UnsubscribeService {
  /**
   * Encodes unsubscription data into a simple Base64 token
   */
  static encodeToken(data) {
    const json = JSON.stringify(data);
    return Buffer.from(json).toString('base64url');
  }

  /**
   * Decodes a token back into its data
   */
  static decodeToken(token) {
    try {
      const json = Buffer.from(token, 'base64url').toString('utf8');
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }
}

module.exports = { UnsubscribeService };
