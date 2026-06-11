const crypto = require('crypto');

const keyHex = process.env.MASTER_ENCRYPTION_KEY;

if (!keyHex) {
  throw new Error("MASTER_ENCRYPTION_KEY environment variable is not configured");
}

const keyBuffer = Buffer.from(keyHex, 'hex');

if (keyBuffer.length !== 32) {
  throw new Error(`MASTER_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters). Got ${keyBuffer.length} bytes.`);
}

class NotEncryptedError extends Error {
  constructor(message = "The payload is not encrypted") {
    super(message);
    this.name = "NotEncryptedError";
  }
}

class DecryptionFailedError extends Error {
  constructor(message = "Decryption failed (authentication failure or corrupt data)") {
    super(message);
    this.name = "DecryptionFailedError";
  }
}

function encrypt(text) {
  if (!text) return "";

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}.${encrypted}.${tag}`;
}

function decrypt(encrypted) {
  if (!encrypted) return "";

  const parts = encrypted.split(".");
  if (parts.length !== 3) {
    throw new NotEncryptedError();
  }

  const [ivHex, ciphertextHex, tagHex] = parts;

  if (ivHex.length !== 24 || tagHex.length !== 32) {
    throw new NotEncryptedError("Invalid IV or authentication tag format");
  }

  try {
    const iv = Buffer.from(ivHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    throw new DecryptionFailedError();
  }
}

module.exports = {
  encrypt,
  decrypt,
  NotEncryptedError,
  DecryptionFailedError
};
