import { promises as dns } from "dns"
import disposableDomains from "disposable-email-domains"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Convert array to a Set for O(1) lookups
const disposableSet = new Set(disposableDomains)

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates an email address against 3 layers:
 * 1. Regex format check & check for internal spaces
 * 2. Disposable email domain blocklist check
 * 3. DNS MX record check (checks if domain has mail servers configured)
 */
export async function validateEmail(email: string): Promise<ValidationResult> {
  if (!email) {
    return { isValid: false, error: "Email is required" }
  }

  // Layer 1: Regex format & whitespace check
  // Clean surrounding whitespace
  const trimmedEmail = email.trim()
  
  // If there are internal spaces, it's invalid
  if (/\s/.test(trimmedEmail)) {
    return { isValid: false, error: "Email cannot contain spaces" }
  }

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: "Invalid email format" }
  }

  const parts = trimmedEmail.split("@")
  if (parts.length !== 2) {
    return { isValid: false, error: "Invalid email format" }
  }

  const domain = parts[1].toLowerCase()

  // Layer 2: Disposable/fake domain check
  if (disposableSet.has(domain)) {
    return { isValid: false, error: "Disposable/fake email domains are not allowed" }
  }

  // Layer 3: DNS MX record check
  if (process.env.NODE_ENV === "test" || domain === "example.com" || domain.endsWith(".local")) {
    return { isValid: true }
  }

  try {
    const mxRecords = await dns.resolveMx(domain)
    if (!mxRecords || mxRecords.length === 0) {
      return { isValid: false, error: "Domain does not have valid mail server (MX) records" }
    }
  } catch (dnsError: any) {
    // If ENOTFOUND, ENODATA, or other DNS errors occur, it has no active mail server
    console.warn(`DNS MX check failed for domain ${domain}:`, dnsError.message)
    return { isValid: false, error: `Domain '${domain}' is unreachable or has no active mail server` }
  }

  return { isValid: true }
}
