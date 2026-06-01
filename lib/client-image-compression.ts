"use client";

type CompressionOptions = {
  maxWidth?: number;
  targetBytes?: number;
  initialQuality?: number;
  minQuality?: number;
};

const DEFAULT_OPTIONS = {
  maxWidth: 4096,
  targetBytes: 4 * 1024 * 1024,
  initialQuality: 0.96,
  minQuality: 0.86,
};

export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {},
) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const bitmap = await createImageBitmap(file);

  if (
    Math.max(bitmap.width, bitmap.height) <= config.maxWidth &&
    file.size <= config.targetBytes
  ) {
    bitmap.close();
    return file;
  }

  const scale = Math.min(1, config.maxWidth / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false,
  });

  if (!context) {
    throw new Error("Impossible de preparer la compression image.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = config.initialQuality;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > config.targetBytes && quality > config.minQuality) {
    quality = Math.max(config.minQuality, quality - 0.08);
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size >= file.size) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "invitation-asset";

  return new File([blob], `${slugifyFileName(baseName)}.webp`, {
    type: "image/webp",
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Compression WebP impossible."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

function slugifyFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
}
