"use client";
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

interface Point {
  x: number;
  y: number;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedCode {
  boundingBox: BoundingBox;
  cornerPoints: Point[];
}

export default function ScanPage() {
  const [result, setResult] = useState<string | null>(null);
  const handleScan = (
    detectedCodes: { format: unknown; rawValue: unknown }[]
  ) => {
    console.log("Detected codes:", detectedCodes);
    // detectedCodes is an array of IDetectedBarcode objects
    detectedCodes.forEach((code: { format: unknown; rawValue: unknown }) => {
      console.log(`Format: ${code.format}, Value: ${code.rawValue}`);
    });
    if (detectedCodes.length > 0) {
      setResult(detectedCodes[0].rawValue as string);
    }
  };

  const highlightCodeOnCanvas = (
    detectedCodes: DetectedCode[],
    ctx: CanvasRenderingContext2D
  ) => {
    detectedCodes.forEach((detectedCode) => {
      const { boundingBox, cornerPoints } = detectedCode;

      // Draw bounding box
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 4;
      ctx.strokeRect(
        boundingBox.x,
        boundingBox.y,
        boundingBox.width,
        boundingBox.height
      );

      // Draw corner points
      ctx.fillStyle = "#FDB623";
      cornerPoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-lg font-semibold mb-4 text-white">
        Scanner le billet
      </h2>

      <div className="w-full mt-16 flex justify-center items-center">
        {" "}
        <div className="size-96 rounded-md overflow-hidden relative bg-gray-200">
          <Scanner
            onScan={handleScan}
            onError={(error) => console.error(error)}
            scanDelay={500}
            constraints={{
              facingMode: "environment", // Use rear camera
              aspectRatio: 1, // Square aspect ratio
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }}
            components={{
              onOff: true, // Show camera on/off button
              torch: true, // Show torch/flashlight button (if supported)
              zoom: true, // Show zoom control (if supported)
              finder: true, // Show finder overlay
              tracker: highlightCodeOnCanvas,
              //   audio: true, // Play beep sound on scan
            }}
            styles={{
              video: {
                width: "100%",
                height: "100%",
                objectFit: "cover",
              },
              container: {
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
              },
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-blue-500 w-3/4 h-3/4 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
      {result && (
        <p className="mt-4 text-sm text-gray-700">
          Résultat du scan : <strong>{result}</strong>
        </p>
      )}
    </div>
  );
}
