import { Html5Qrcode } from "html5-qrcode";

/**
 * Decodes a QR code from a Blob (usually from clipboard paste)
 * @param blob The image blob to decode
 * @returns The decoded text or null if decoding fails
 */
export async function decodeQRFromImage(blob: Blob): Promise<string | null> {
  const tempId = "qr-pasted-image-decoder";
  let tempElement = document.getElementById(tempId);

  if (!tempElement) {
    tempElement = document.createElement("div");
    tempElement.id = tempId;
    tempElement.style.display = "none";
    document.body.appendChild(tempElement);
  }

  const html5QrCode = new Html5Qrcode(tempId);
  const imageFile = new File([blob], "pasted-image.png", { type: blob.type });

  try {
    const decodedText = await html5QrCode.scanFile(imageFile, false);
    return decodedText;
  } catch (err) {
    console.warn("[QR Utils] Failed to decode QR from image:", err);
    return null;
  } finally {
    html5QrCode.clear();
  }
}
