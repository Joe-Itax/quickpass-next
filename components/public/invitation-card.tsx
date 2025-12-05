import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Invitation } from "@/types/types";

export default function InvitationCard({
  invitation,
}: {
  invitation: Invitation;
}) {
  const isFull = invitation.scannedCount >= invitation.peopleCount;
  const isPartial =
    invitation.scannedCount > 0 &&
    invitation.scannedCount < invitation.peopleCount;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-primary rounded-lg bg-black/30 shadow-md shadow-black text-foreground">
      <CardContent className="p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{invitation.label}</h3>

          <Badge
            className={`
              ${
                isFull
                  ? "bg-green-600 text-white"
                  : isPartial
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-400 text-black"
              }
            `}
          >
            {isFull
              ? `${invitation.scannedCount}/${invitation.peopleCount} - Complet`
              : isPartial
              ? `${invitation.scannedCount}/${invitation.peopleCount} scannés`
              : `0/${invitation.peopleCount} - non scannés`}
          </Badge>
        </div>

        {invitation.email && (
          <p className="text-sm text-gray-100">{invitation.email}</p>
        )}

        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-100">
            Table:{" "}
            <span className="font-medium text-gray-200">
              {invitation?.allocations
                ?.map((t) => `${t.table.name} (${t.seatsAssigned})`)
                .join(", ")}
            </span>
          </span>

          <span className="text-xs text-gray-400">ID: {invitation.id}</span>
        </div>
      </CardContent>
    </Card>
  );
}
