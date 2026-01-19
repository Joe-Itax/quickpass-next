"use client";

import { authClient } from "@/lib/auth-client";
import UsersDataTable from "../components/users-data-table";
import DataStatusDisplay from "@/components/data-status-display";

export default function UsersPage() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const user = session?.user;

  if (isPending || error) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const isAdmin = user?.role === "ADMIN";
  return (
    <main className="py-12 px-6">
      {isAdmin ? (
        <UsersDataTable />
      ) : (
        <div>
          <p>Vous n&apos;êtes pas autorisé à accéder à ces données !</p>
        </div>
      )}
    </main>
  );
}
