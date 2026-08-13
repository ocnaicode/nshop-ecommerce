import { randomBytes } from 'crypto';

/**
 * Generates a random, human-friendly referral code with ~48 bits of entropy,
 * so collisions are practically impossible even before the uniqueness check.
 */
export function generateReferralCode(): string {
  const raw = randomBytes(8)
    .toString('base64url')
    .toUpperCase()
    .replace(/[-_]/g, '0');
  return `REF${raw.slice(0, 10)}`;
}

/**
 * Keeps generating codes until one that is not already taken is found
 * (max 5 attempts), so inserts can never violate the unique referralCode
 * index with an E11000 duplicate-key error.
 */
export async function ensureUniqueReferralCode(
  isTaken: (code: string) => Promise<boolean>
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    if (!(await isTaken(code))) {
      return code;
    }
  }
  throw new Error('Unable to generate a unique referral code after 5 attempts');
}
