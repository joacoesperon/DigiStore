import { randomBytes } from 'crypto'

/**
 * Generate a license key in the format: XXXXX-XXXXX-XXXXX-XXXXX
 */
export function generateLicenseKey(): string {
  const hex = randomBytes(10).toString('hex').toUpperCase()
  return `${hex.slice(0, 5)}-${hex.slice(5, 10)}-${hex.slice(10, 15)}-${hex.slice(15, 20)}`
}

/**
 * Generate a unique license key by checking for collisions.
 * @param existsCheck - async function that returns true if key already exists
 * @param maxAttempts - max retry attempts (default: 10)
 */
export async function generateUniqueLicenseKey(
  existsCheck: (key: string) => Promise<boolean>,
  maxAttempts = 10
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const key = generateLicenseKey()
    const exists = await existsCheck(key)
    if (!exists) return key
  }
  return null
}
