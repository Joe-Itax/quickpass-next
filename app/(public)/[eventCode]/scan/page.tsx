"use client";
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useParams } from "next/navigation";
import { useScan, useScanByEventCode } from "@/hooks/use-event";

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
  const params = useParams();
  const eventCode = Array.isArray(params.eventCode)
    ? params.eventCode[0]
    : params.eventCode;
  console.log("event code: ", eventCode);
  if (!eventCode) {
    throw new Error("eventCode is required");
  }

  const [result, setResult] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  const { mutateAsync: scan, isPending } = useScanByEventCode(eventCode);

  const handleScan = async (
    detectedCodes: { format: unknown; rawValue: unknown }[]
  ) => {
    if (detectedCodes.length > 0 && !isPending) {
      const qrValue = detectedCodes[0].rawValue as string;
      setResult(qrValue);

      try {
        // Appel API pour enregistrer le scan
        const response = await scan(qrValue);
        setScanStatus("success");
        console.log("Scan réussi:", response);

        // Réinitialiser après 2 secondes
        setTimeout(() => {
          setResult(null);
          setScanStatus("idle");
        }, 2000);
      } catch (error) {
        setScanStatus("error");
        console.error("Erreur lors du scan:", error);

        // Réinitialiser après 3 secondes en cas d'erreur
        setTimeout(() => {
          setResult(null);
          setScanStatus("idle");
        }, 3000);
      }
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

  // return (
  //   <div className="flex flex-col items-center justify-center w-full h-screen  bg-[url(/image.jpg)] bg-center bg-no-repeat bg-cover">
  //     <div className="size-full bg-black/60 flex flex-col items-center">
  //       <h2 className="text-lg font-semibold mb-4 text-white">
  //         Scanner le billet
  //       </h2>

  //       <div className="w- mt-16 flex justify-center items-center">
  //         {" "}
  //         <div className="size-56 xs:size-96 max-h-500:shorty rounded-md overflow-hidden relative bg-transparent">
  //           <Scanner
  //             onScan={handleScan}
  //             onError={(error) => console.error(error)}
  //             scanDelay={500}
  //             constraints={{
  //               facingMode: "environment", // Use rear camera
  //               aspectRatio: 1, // Square aspect ratio
  //               width: { ideal: 1280 },
  //               height: { ideal: 720 },
  //             }}
  //             components={{
  //               onOff: true, // Show camera on/off button
  //               torch: true, // Show torch/flashlight button (if supported)
  //               zoom: true, // Show zoom control (if supported)
  //               finder: true, // Show finder overlay
  //               tracker: highlightCodeOnCanvas,
  //               //   audio: true, // Play beep sound on scan
  //             }}
  //             styles={{
  //               video: {
  //                 width: "100%",
  //                 height: "100%",
  //                 objectFit: "cover",
  //               },
  //               container: {
  //                 width: "100%",
  //                 height: "100%",
  //                 position: "absolute",
  //                 top: 0,
  //                 left: 0,
  //               },
  //             }}
  //           />

  //           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
  //             <div className="border-4 border-blue-500 w-3/4 h-3/4 rounded-lg animate-pulse" />
  //           </div>
  //         </div>
  //       </div>
  //       {result && (
  //         <p className="mt-4 text-sm text-white/70">
  //           Résultat du scan : <strong>{result}</strong>
  //         </p>
  //       )}
  //     </div>
  //   </div>
  // );
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-[url(/image.jpg)] bg-center bg-no-repeat bg-cover">
      <div className="size-full bg-black/60 flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Scanner le billet
        </h2>

        <div className="w- mt-16 flex justify-center items-center">
          <div className="size-56 xs:size-96 max-h-500:shorty rounded-md overflow-hidden relative bg-transparent">
            <Scanner
              onScan={handleScan}
              onError={(error) => console.error(error)}
              scanDelay={1000}
              constraints={{
                facingMode: "environment",
                aspectRatio: 1,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }}
              components={{
                onOff: true,
                torch: true,
                zoom: true,
                finder: true,
                tracker: highlightCodeOnCanvas,
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
          <div className="mt-4 text-center">
            <p className="text-sm text-white/70">
              QR Code détecté: <strong>{result}</strong>
            </p>
            {scanStatus === "success" && (
              <p className="text-green-400 text-sm mt-2">
                ✓ Scan enregistré avec succès!
              </p>
            )}
            {scanStatus === "error" && (
              <p className="text-red-400 text-sm mt-2">✗ Erreur lors du scan</p>
            )}
            {isPending && (
              <p className="text-yellow-400 text-sm mt-2">
                Traitement en cours...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
