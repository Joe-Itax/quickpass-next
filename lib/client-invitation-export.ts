"use client";

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export type InvitationExportFormat = "pdf" | "image";

export async function captureInvitationElement(
  element: HTMLElement,
  scale = 4,
) {
  await waitForPaint();
  await document.fonts?.ready;
  await waitForImages(element);
  await waitForBackgroundImages(element);

  return html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: null,
    removeContainer: true,
  });
}

export async function buildInvitationExportBlobs(
  element: HTMLElement,
  scale = 4,
) {
  const canvas = await captureInvitationElement(element, scale);
  const imageBlob = await canvasToPngBlob(canvas);
  const pdfBlob = buildExactPdfBlob(canvas);

  return { canvas, imageBlob, pdfBlob };
}

export async function buildInvitationExportBlob(
  element: HTMLElement,
  format: InvitationExportFormat,
  scale = 4,
) {
  const canvas = await captureInvitationElement(element, scale);

  return format === "pdf" ? buildExactPdfBlob(canvas) : canvasToPngBlob(canvas);
}

export function buildExactPdfBlob(canvas: HTMLCanvasElement) {
  const imageData = canvas.toDataURL("image/png");
  const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imageData, "PNG", 0, 0, canvas.width, canvas.height);

  return pdf.output("blob") as Blob;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Impossible de generer l'image PNG."));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes?: number | null) {
  if (!bytes) return "Calcul...";
  const units = ["o", "Ko", "Mo", "Go"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function safeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export async function createZipBlob(
  entries: Array<{ name: string; blob: Blob }>,
) {
  const encoder = new TextEncoder();
  const chunks: BlobPart[] = [];
  const centralDirectory: Uint8Array[] = [];
  const { dosTime, dosDate } = getDosDateTime(new Date());
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(data);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localHeader.set(nameBytes, 30);

    chunks.push(toArrayBuffer(localHeader), toArrayBuffer(data));

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);
    centralDirectory.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralDirectory.reduce(
    (total, header) => total + header.length,
    0,
  );
  chunks.push(...centralDirectory.map(toArrayBuffer));

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralDirectorySize, true);
  endView.setUint32(16, centralDirectoryOffset, true);
  chunks.push(toArrayBuffer(endRecord));

  return new Blob(chunks, { type: "application/zip" });
}

async function waitForPaint() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));

  return Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    }),
  );
}

function waitForBackgroundImages(root: HTMLElement) {
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  const urls = new Set<string>();

  for (const node of nodes) {
    const backgroundImage = getComputedStyle(node).backgroundImage;
    for (const match of backgroundImage.matchAll(/url\((['"]?)(.*?)\1\)/g)) {
      if (match[2]) urls.add(match[2]);
    }
  }

  return Promise.all(Array.from(urls).map(loadImage));
}

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

function toArrayBuffer(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  return copy.buffer;
}

function getDosDateTime(date: Date) {
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dosDate =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return { dosTime, dosDate };
}

let crcTable: Uint32Array | null = null;

function crc32(data: Uint8Array) {
  const table = getCrcTable();
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getCrcTable() {
  if (crcTable) return crcTable;

  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  crcTable = table;
  return table;
}
