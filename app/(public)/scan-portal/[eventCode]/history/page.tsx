"use client";

import { useParams } from "next/navigation";
import { useEventInvitationsByEventCode } from "@/hooks/use-event";
import { ScannerCard } from "@/components/public/scanner-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import DataStatusDisplay from "@/components/data-status-display";
import { Invitation } from "@/types/types";

export default function HistoryPage() {
  const { eventCode } = useParams();

  const {
    data: dataUseEventInvitationsByEventCode,
    isPending,
    isError,
    error,
    refetch,
  } = useEventInvitationsByEventCode(eventCode as string);
  const data = dataUseEventInvitationsByEventCode as Invitation[];

  if (isPending || isError) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={isError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  // Filtrer seulement les invités qui ont été scannés au moins une fois
  const scannedGuests =
    data?.filter((invitation) => invitation.scannedCount > 0) || [];

  return (
    <div className="flex flex-col items-center pt-8 pb-24 bg-[url(/bg-1.svg)] bg-center bg-no-repeat bg-cover bg-background">
      <div className="max-w-md p-2 min-[480px]:p-5 pb-0 space-y-4 flex flex-col items-center justify-center bg-transparent">
        <h1 className="text-3xl font-bold text-white self-start justify-self-start">
          Historique
        </h1>

        <div className="space-y-4 w-full flex justify-center">
          <Card>
            <CardHeader className="p-0">
              <CardDescription className="text-gray-400">
                L&apos;historique des personnes déjà scannées (
                {scannedGuests.length})
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 px-0 max-h[50vh] overflow-auto pb-10">
              {scannedGuests.length === 0 ? (
                <p className="text-center text-gray-400 py-4">
                  Aucun scan enregistré pour le moment.
                </p>
              ) : (
                scannedGuests.map((invitation) => (
                  <div
                    className="grid gap-3"
                    key={`scanner-card-${invitation.id}`}
                  >
                    <ScannerCard
                      person={{
                        name: invitation.label,
                      }}
                      scannedAt={new Date()} // Vous devriez avoir un champ scannedAt dans votre modèle
                      // scannedCount={invitation.scannedCount}
                      // totalCount={invitation.peopleCount}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
