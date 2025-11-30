"use client";

import DataStatusDisplay from "@/components/data-status-display";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import formatDateToCustom from "@/utils/format-date-to-custom";

export default function ProfilePage() {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  const user = session?.user;

  if (isPending || error || !user) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const avatarFallback = user.name
    .split(" ")
    .map((name) => name[0])
    .join("");

  return (
    <div className="w-full mx-auto p-6 space-y-8">
      {/* Header Profile */}
      <div className="flex justify-center items-center gap-2">
        <h1 className="w-48 font-bold text-xl">Mon compte</h1>
        <div className="w-full h-0.5 bg-gray-500 rounded-4xl"></div>
        {/* <Separator /> */}
      </div>
      <div className="bg-black/30 text-white/90 border-none shadow-md shadow-black rounded-lg p-6 flex items-center space-x-6">
        <Avatar className="h-20 w-20 rounded-full bg-primary">
          <AvatarImage
            src={user.image || "/placeholder-avatar.png"}
            alt={user.name}
          />
          <AvatarFallback className="rounded-full text-xl bg-primary">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold text-primary">{user.name}</h2>
          <p className="text-muted/80 capitalize">{user.role}</p>
        </div>
      </div>

      {/* Informations de base */}
      <div className="bg-black/30 text-white/90 border-none shadow-md shadow-black rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Informations du compte</h3>
          {/* <EditProfile /> */}+
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <InfoItem label="Nom complet" value={user.name} />
          <InfoItem label="Adresse email" value={user.email} />
          <InfoItem label="Rôle" value={user.role} />
          <InfoItem
            label="Date de création"
            value={formatDateToCustom(user.createdAt, false)}
          />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
