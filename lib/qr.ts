// ------------------------
// Base64URL Encode ArrayBuffer
// ------------------------
function base64urlEncode(buffer: ArrayBuffer): string {
  return Buffer.from(new Uint8Array(buffer))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ------------------------
// Base64URL Decode → ArrayBuffer
// ------------------------
function base64urlDecode(str: string): ArrayBuffer {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";

  const buf = Buffer.from(str, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const SECRET = process.env.QR_SECRET!;
if (!SECRET) throw new Error("Missing QR_SECRET env var");

// Import WebCrypto HMAC Key
const keyPromise = crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(SECRET).buffer, // ArrayBuffer required
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
);

// --------------------------
// ENCODE
// --------------------------
export async function qrEncode(data: unknown): Promise<string> {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json); // Uint8Array

  const key = await keyPromise;
  const signature = await crypto.subtle.sign("HMAC", key, bytes); // returns ArrayBuffer

  const payload = base64urlEncode(bytes.buffer);
  const sig = base64urlEncode(signature);

  return `${payload}.${sig}`;
}

// --------------------------
// DECODE
// --------------------------
export async function qrDecode(token: string): Promise<unknown> {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) throw new Error("Invalid QR format");

  const bytesBuf = base64urlDecode(payload); // ArrayBuffer
  const sigBuf = base64urlDecode(sig); // ArrayBuffer

  const key = await keyPromise;

  const valid = await crypto.subtle.verify("HMAC", key, sigBuf, bytesBuf);

  if (!valid) throw new Error("Invalid QR signature");

  const json = new TextDecoder().decode(new Uint8Array(bytesBuf));
  return JSON.parse(json);
}
