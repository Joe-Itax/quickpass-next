import { Guest } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function GuestCard({ guest }: { guest: Guest }) {
  const isFull = guest.scannedCount >= guest.capacity;
  const isPartial =
    guest.scannedCount > 0 && guest.scannedCount < guest.capacity;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border border-primary rounded-lg bg-black/30 shadow-md shadow-black text-foreground">
      <CardContent className="p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{guest.name}</h3>

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
              ? `${guest.scannedCount}/${guest.capacity} - Complet`
              : isPartial
              ? `${guest.scannedCount}/${guest.capacity} scannés`
              : `0/${guest.capacity} - non scannés`}
          </Badge>
        </div>

        {guest.email && <p className="text-sm text-gray-100">{guest.email}</p>}

        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-100">
            Table:{" "}
            <span className="font-medium text-gray-200">{guest.table}</span>
          </span>

          <span className="text-xs text-gray-400">ID: {guest.id}</span>
        </div>
      </CardContent>
    </Card>
  );
}
