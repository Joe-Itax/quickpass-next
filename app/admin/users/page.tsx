"use client";

import { authClient } from "@/lib/auth-client";
import UsersDataTable from "../components/users-data-table";
import DataStatusDisplay from "@/components/data-status-display";
import { ShieldAlert, MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  if (!isAdmin) {
    return (
      <main className="py-20 px-6 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full p-8 rounded-4xl bg-red-500/5 border border-red-500/20 text-center space-y-6">
          <div className="size-16 rounded-3xl bg-red-500/10 border border-red-500/20 mx-auto flex items-center justify-center text-red-400">
            <ShieldAlert size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black italic uppercase text-white">
              Accès Réservé aux Administrateurs
            </h2>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">
              Vous n&apos;avez pas les privilèges suffisants pour consulter la liste des utilisateurs de la plateforme.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-2xl border-white/10 text-xs font-black uppercase tracking-widest">
            <Link href="/admin">
              <MoveLeft className="mr-2 size-4" /> Retour au Tableau de Bord
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="py-12 px-6">
      <UsersDataTable />
    </main>
  );
}
