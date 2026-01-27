import { Wallet, getBytes, hexlify } from 'ethers';

// Buffer conversion utilities
export function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
}

export function arrayBufferToBase64url(ab: ArrayBuffer): string {
  const uint8 = new Uint8Array(ab);
  let binary = '';
  uint8.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - base64.length % 4) % 4;
  for (let i = 0; i < padding; i++) base64 += '=';
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

// Wallet generation
export function generateWalletData(): { mnemonic: string; privateKey: string; address: string } {
  const wallet = Wallet.createRandom();
  return {
    mnemonic: wallet.mnemonic?.phrase || '',
    privateKey: wallet.privateKey,
    address: wallet.address,
  };
}

// App-scoped encryption for cloud backup simulation
async function getScopedKey(): Promise<CryptoKey> {
  const deviceKey = localStorage.getItem('wallet_device_key') || 'coinfi-unlimited-scope-v1';
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(deviceKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('coinfi-scoped-v1'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptScoped(data: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getScopedKey();
  const encoder = new TextEncoder();
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  const totalBuffer = new Uint8Array(iv.length + encryptedContent.byteLength);
  totalBuffer.set(iv, 0);
  totalBuffer.set(new Uint8Array(encryptedContent), iv.length);
  return btoa(String.fromCharCode(...totalBuffer));
}

export async function decryptScoped(encryptedB64: string): Promise<string> {
  try {
    const binary = atob(encryptedB64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
    const iv = buffer.slice(0, 12);
    const ciphertext = buffer.slice(12);
    const key = await getScopedKey();
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.error('[Crypto] Decryption integrity failure:', e);
    throw new Error("Coin Fi Cloud Vault Decryption Failed");
  }
}

// Private key payload encryption for passkey storage
export async function createPrivPayload(keyB64: string, privHex: string): Promise<ArrayBuffer> {
  const hex = privHex.startsWith('0x') ? privHex : '0x' + privHex;
  const privBytes = getBytes(hex);
  if (privBytes.length !== 32) throw new Error("Invalid Private Key Length");
  const keyBuffer = base64ToBuffer(keyB64);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ctBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    privBytes as unknown as BufferSource
  );
  const rawPayload = new Uint8Array(12 + ctBuffer.byteLength);
  rawPayload.set(iv, 0);
  rawPayload.set(new Uint8Array(ctBuffer), 12);
  return rawPayload.buffer;
}

export async function decryptPrivPayload(keyB64: string, payloadB64: string): Promise<string> {
  const payloadBytesView = base64urlToArrayBuffer(payloadB64);
  const payloadBytes = new Uint8Array(payloadBytesView);
  if (payloadBytes.length < 12) throw new Error("Malformed Payload Buffer");
  const iv = payloadBytes.slice(0, 12);
  const ctBytes = payloadBytes.slice(12);
  const keyBuffer = base64ToBuffer(keyB64);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const privBytesBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    ctBytes
  );
  const privBytes = new Uint8Array(privBytesBuffer);
  if (privBytes.length !== 32) throw new Error(`Invalid decrypted private key length: ${privBytes.length}`);
  return hexlify(privBytes).replace('0x', '');
}

// WebAuthn Passkey Registration
export async function registerPasskey(keyB64: string, privHex: string, walletAddress: string): Promise<string> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const rpId = typeof window !== 'undefined' ? (window.location.hostname || "localhost") : "localhost";
  const payloadBuffer = await createPrivPayload(keyB64, privHex);
  if (!payloadBuffer) throw new Error('Payload generation failed - invalid buffer');

  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    throw new Error('WebAuthn not supported on this browser');
  }

  const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  if (!isAvailable) {
    throw new Error('Platform biometrics (FaceID/TouchID) not available on this device');
  }

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: { name: 'Coin Fi', id: rpId },
    user: {
      id: payloadBuffer,
      name: walletAddress,
      displayName: `Coin Fi: ${walletAddress.slice(0, 8)}`
    },
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'required'
    },
    timeout: 60000
  };

  try {
    const cred = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
    if (!cred) throw new Error("User cancelled biometric registration");
    return arrayBufferToBase64url(cred.rawId);
  } catch (e: unknown) {
    const error = e as Error & { name?: string };
    const errorMsg = error?.message || error?.name || 'Unknown WebAuthn error';
    console.error(`[WebAuthn] Registration Error: ${errorMsg}`);
    if (error.name === 'NotAllowedError') throw new Error('Biometric prompt was cancelled');
    throw new Error(error.message || "Non-custodial registration failed");
  }
}

// WebAuthn Passkey Authentication
export async function authenticatePasskey(credIdB64: string): Promise<{ success: boolean; payloadB64?: string }> {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const rpId = typeof window !== 'undefined' ? (window.location.hostname || "localhost") : "localhost";

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: [{ type: 'public-key', id: base64urlToArrayBuffer(credIdB64) }],
    userVerification: 'required',
    timeout: 60000,
    rpId
  };

  try {
    const assertion = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
    if (!assertion) throw new Error("Authentication rejected");
    const response = assertion.response as AuthenticatorAssertionResponse;
    const userHandle = response.userHandle;
    return {
      success: true,
      payloadB64: userHandle ? arrayBufferToBase64url(userHandle) : undefined
    };
  } catch (e: unknown) {
    const error = e as Error & { name?: string };
    const errorMsg = error?.message || error?.name || 'Unknown WebAuthn error';
    console.error(`[WebAuthn] Auth Error: ${errorMsg}`);
    return { success: false };
  }
}

// Check if passkeys are available
export async function isPasskeyAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}
