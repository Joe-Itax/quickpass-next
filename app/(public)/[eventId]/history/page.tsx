"use client";

import { ScannerCard } from "@/components/public/scanner-card";
// import TabsUsed from "@/components/tabs-used";
import {
  Card,
  CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HistoryPage() {
  const map = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center pt-8 size-full bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover bg-[#333333]/84">
      <div className="max-w-md p-2 min-[480px]:p-5 pb-0 space-y-4 flex flex-col items-center justify-center bg-transparent">
        <h1 className="text-3xl font-bold mb-2 sm:mb-4 text-white self-start justify-self-start">
          Historique
        </h1>

        <div className="space-y-4 w-full flex justify-center">
          <Card>
            <CardHeader className="p-0">
              <CardTitle className="text-xl text-white">Scanner</CardTitle>
              <CardDescription className="text-gray-400">
                L&apos;historique des personnes déjà scanné
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 px-0 max-h-[50vh] overflow-auto pb-10">
              {map.map((e, i) => {
                return (
                  <div className="grid gap-3" key={`scanner-card-${i}`}>
                    <ScannerCard
                      person={{
                        name: "Joseph Mushagalusa carmel",
                      }}
                      scannedAt={new Date()}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
