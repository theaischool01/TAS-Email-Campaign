import crypto from "crypto"
import { z } from "zod"

export class TrackingTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TrackingTokenError"
  }
}

const TrackingPayloadSchema = z.discriminatedUnion("t", [
  z.object({
    t: z.literal("o"),
    d: z.string()
  }),
  z.object({
    t: z.literal("c"),
    d: z.string(),
    l: z.string()
  })
])

export type TrackingPayload = z.infer<typeof TrackingPayloadSchema>

const TOKEN_VERSION = 1
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

const PRIMARY_KEY_ID = 1
const SECONDARY_KEY_ID = 2

function getKeys() {
  const primarySecret = process.env.TRACKING_TOKEN_SECRET_PRIMARY
  const secondarySecret = process.env.TRACKING_TOKEN_SECRET_SECONDARY

  if (!primarySecret || primarySecret.length !== 64) {
    throw new TrackingTokenError("TRACKING_TOKEN_SECRET_PRIMARY is invalid or missing")
  }

  const primaryKey = Buffer.from(primarySecret, "hex")
  const secondaryKey = secondarySecret && secondarySecret.length === 64
    ? Buffer.from(secondarySecret, "hex")
    : null

  return { primaryKey, secondaryKey }
}

export class TrackingTokenService {
  static encrypt(payload: TrackingPayload): string {
    // 1. Validate payload
    const parsed = TrackingPayloadSchema.parse(payload)

    try {
      // Get keys
      const { primaryKey } = getKeys()

      // 2. Serialize JSON
      const jsonStr = JSON.stringify(parsed)
      const plaintext = Buffer.from(jsonStr, "utf8")

      // 3. Generate random IV
      const iv = crypto.randomBytes(IV_LENGTH)

      // 4. Encrypt
      const cipher = crypto.createCipheriv("aes-256-gcm", primaryKey, iv)
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])

      // 5. Obtain auth tag
      const authTag = cipher.getAuthTag()

      // 6. Concatenate: version + keyId + iv + authTag + ciphertext
      const header = Buffer.alloc(2)
      header.writeUInt8(TOKEN_VERSION, 0)
      header.writeUInt8(PRIMARY_KEY_ID, 1)

      const finalBuffer = Buffer.concat([header, iv, authTag, ciphertext])

      // 7. Encode as base64url
      return finalBuffer.toString("base64url")
    } catch (e: any) {
      if (e instanceof TrackingTokenError) throw e
      throw new TrackingTokenError(`Failed to encrypt tracking token: ${e.message}`)
    }
  }

  static decrypt(token: string): TrackingPayload | null {
    try {
      if (!token) return null

      // 1. Decode Base64URL
      const finalBuffer = Buffer.from(token, "base64url")

      // 2. Validate minimum length
      const minLength = 1 + 1 + IV_LENGTH + AUTH_TAG_LENGTH
      if (finalBuffer.length < minLength) {
        return null
      }

      // 3. Read header, iv, authTag, ciphertext
      const version = finalBuffer.readUInt8(0)
      const keyId = finalBuffer.readUInt8(1)

      // 4. Validate version
      if (version !== TOKEN_VERSION) {
        return null
      }

      // Key Selection
      const { primaryKey, secondaryKey } = getKeys()
      let decryptionKey: Buffer | null = null

      if (keyId === PRIMARY_KEY_ID) {
        decryptionKey = primaryKey
      } else if (keyId === SECONDARY_KEY_ID) {
        decryptionKey = secondaryKey
      }

      if (!decryptionKey) {
        return null
      }

      const iv = finalBuffer.subarray(2, 2 + IV_LENGTH)
      const authTag = finalBuffer.subarray(2 + IV_LENGTH, 2 + IV_LENGTH + AUTH_TAG_LENGTH)
      const ciphertext = finalBuffer.subarray(2 + IV_LENGTH + AUTH_TAG_LENGTH)

      // 5. Decrypt
      const decipher = crypto.createDecipheriv("aes-256-gcm", decryptionKey, iv)
      decipher.setAuthTag(authTag)

      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])

      // 6. Validate shape
      const jsonStr = plaintext.toString("utf8")
      const parsedJson = JSON.parse(jsonStr)

      const validation = TrackingPayloadSchema.safeParse(parsedJson)
      if (!validation.success) {
        return null
      }

      return validation.data
    } catch (e) {
      // Return null on all decryption or format failures
      return null
    }
  }
}
