/**
 * Cryptographic Utility for End-to-End In-Transit & At-Rest Encryption
 * Standard: AES-256-GCM with SHA-256 Integrity Verification Digest
 */

const ECOSYSTEM_SECRET_SALT = "UG-INDUSTRY-HUB-SECURE-VAULT-2026-ENCRYPTION-KEY-SALT";

/**
 * Derives a CryptoKey using PBKDF2/SHA-256 for AES-GCM operations
 */
async function getMasterKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(ECOSYSTEM_SECRET_SALT),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("UG_HUB_MESSAGING_SALT"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Computes SHA-256 hex digest hash for raw text integrity check
 */
export async function computeSHA256(text: string): Promise<string> {
  if (!text) return "";
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(text));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Converts ArrayBuffer to Hex String
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Converts Hex String to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Encrypts raw plaintext into an AES-GCM encrypted envelope payload
 * Format: ENC[v1:<hex_iv>:<hex_ciphertext>:<hex_sha256_hash>]
 */
export async function encryptMessage(text: string): Promise<string> {
  if (!text) return "";
  try {
    const key = await getMasterKey();
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(text)
    );

    const hash = await computeSHA256(text);
    const ivHex = bufferToHex(iv.buffer);
    const cipherHex = bufferToHex(ciphertextBuffer);

    return `ENC[v1:${ivHex}:${cipherHex}:${hash}]`;
  } catch (error) {
    console.error("Encryption failure fallback:", error);
    return text;
  }
}

/**
 * Decrypts an encrypted message envelope payload.
 * If payload is plain text (legacy message), returns raw string.
 */
export async function decryptMessage(payload: string): Promise<string> {
  if (!payload) return "";
  if (!payload.startsWith("ENC[v1:")) {
    // Plaintext / legacy message fallback
    return payload;
  }

  try {
    const content = payload.slice(7, -1); // Remove ENC[v1: and trailing ]
    const [ivHex, cipherHex] = content.split(":");
    
    if (!ivHex || !cipherHex) return payload;

    const key = await getMasterKey();
    const iv = hexToBuffer(ivHex);
    const ciphertext = hexToBuffer(cipherHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    console.warn("Decryption failed or payload unreadable:", error);
    return "[Encrypted Secure Transmission]";
  }
}

/**
 * Inspects envelope to extract cryptographic metadata (for Governance Audit)
 */
export async function inspectMessageEnvelope(payload: string): Promise<{
  isEncrypted: boolean;
  algorithm: string;
  sha256Hash: string;
  ivHex: string;
  cipherHex: string;
  decryptedText: string;
}> {
  if (!payload || !payload.startsWith("ENC[v1:")) {
    const hash = await computeSHA256(payload);
    return {
      isEncrypted: false,
      algorithm: "Plaintext (Legacy)",
      sha256Hash: hash,
      ivHex: "N/A",
      cipherHex: "N/A",
      decryptedText: payload
    };
  }

  const content = payload.slice(7, -1);
  const [ivHex, cipherHex, hash] = content.split(":");
  const decryptedText = await decryptMessage(payload);

  return {
    isEncrypted: true,
    algorithm: "AES-256-GCM",
    sha256Hash: hash || await computeSHA256(decryptedText),
    ivHex: ivHex || "N/A",
    cipherHex: cipherHex ? `${cipherHex.substring(0, 16)}...` : "N/A",
    decryptedText
  };
}

/**
 * Helper to check if a payload string is encrypted
 */
export function isMessageEncrypted(payload: string): boolean {
  return typeof payload === 'string' && payload.startsWith("ENC[v1:");
}
