/**
 * Browser-only account passwords. There is no auth server, so credentials live in
 * localStorage: a salted SHA-256 hash, never the password itself, kept apart from
 * the user object so it can never end up in analytics traits.
 */

export const PASSWORD_MIN_LENGTH = 8

/** Why a new password is not acceptable, or '' when it is. */
export function passwordProblem(password: string): string {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Use at least one letter and one number.'
  return ''
}

interface Credential { salt: string; hash: string }

const toHex = (bytes: Uint8Array) => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')

async function hashPassword(password: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return toHex(new Uint8Array(digest))
}

/** Credential store keyed by account id (an email or phone number, normalised by the caller). */
export function createCredentialStore(storageKey: string) {
  function read(): Record<string, Credential> {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { return {} }
  }

  return {
    has(account: string): boolean {
      return account in read()
    },

    async set(account: string, password: string): Promise<void> {
      const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
      const all = read()
      all[account] = { salt, hash: await hashPassword(password, salt) }
      localStorage.setItem(storageKey, JSON.stringify(all))
    },

    async verify(account: string, password: string): Promise<boolean> {
      const cred = read()[account]
      return !!cred && cred.hash === await hashPassword(password, cred.salt)
    }
  }
}
