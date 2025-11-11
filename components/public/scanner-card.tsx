"use client";

// import { Trash2 } from "lucide-react";
import Image from "next/image";

export function ScannerCard({
  person,
}: //   scannedAt,
{
  person: {
    name: string;
  };
  scannedAt: Date;
}) {
  return (
    <div className="flex items-center gap-1 w-full justify-between px-3 py-4  rounded-lg bg-black/30 shadow-md shadow-black">
      <div className="flex items-center justify-start gap-2">
        <div className="size-10">
          <Image
            src="/logo-app/logo-black.svg"
            alt="QuickPass"
            width={100}
            height={100}
            className="w-full"
          />
        </div>
        <div className="">
          <p className="font-semibold text-white">{person.name}</p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        {/* <Trash2 className="text-amber-400" size={20} /> */}
        <p className="text-sm text-muted-foreground text-end w-full">
          {/* {scannedAt.toLocaleString("fr-FR", { timeZone: "UTC" })}
           */}
          16 Dec 2025, 14:30
        </p>
      </div>
    </div>
  );
}
