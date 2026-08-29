import "server-only";
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const VERSION = "v1";

function getEncryptionKey(): Buffer {
  const secret = process.env.BYOK_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("BYOK_ENCRYPTION_KEY must be set to a strong secret");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [VERSION, iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptApiKey(encryptedValue: string): string {
  const [version, encodedIv, encodedTag, encodedCiphertext] = encryptedValue.split(":");
  if (version !== VERSION || !encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error("Invalid encrypted API key format");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export type AIKeyProvider = "groq" | "openai" | "gemini" | "anthropic" | "custom";

export function getEncryptedApiKey(user: {
  apiKeys?: Partial<Record<AIKeyProvider, string | null>>;
}, provider: AIKeyProvider): string | undefined {
  const value = user.apiKeys?.[provider];
  if (!value?.startsWith(`${VERSION}:`)) {
    return undefined;
  }

  return decryptApiKey(value);
}

export function hasEncryptedApiKey(user: {
  apiKeys?: Partial<Record<AIKeyProvider, string | null>>;
}, provider: AIKeyProvider): boolean {
  return Boolean(user.apiKeys?.[provider]?.startsWith(`${VERSION}:`));
}

/** Re-encrypts keys written by versions that stored them in plaintext. */
export function encryptLegacyApiKeys(apiKeys?: Partial<Record<AIKeyProvider, string | null>>): boolean {
  if (!apiKeys) return false;
  let changed = false;
  for (const provider of ["groq", "openai", "gemini", "anthropic", "custom"] as const) {
    const value = apiKeys[provider];
    if (value && !value.startsWith(`${VERSION}:`)) {
      apiKeys[provider] = encryptApiKey(value);
      changed = true;
    }
  }
  return changed;
}
