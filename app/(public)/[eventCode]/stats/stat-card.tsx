import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UserCheck, Users, UserX } from "lucide-react";

export default function StatCard({
  invitationsTotal,
  invitationsUnscanned,
  invitationsPartial,
  invitationsComplete,
  personsTotalCapacity,
  personsTotalScanned,
  personsRemaining,
  loading,
}: {
  invitationsTotal: number;
  invitationsUnscanned: number;
  invitationsPartial: number;
  invitationsComplete: number;
  personsTotalCapacity: number;
  personsTotalScanned: number;
  personsRemaining: number;
  loading: boolean;
}) {
  return (
    <>
      {" "}
      {/* --- INVITATIONS --- */}
      <h2 className="text-lg font-semibold mt-6 mb-2 text-white">
        Invitations
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Invitations Totales */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invitations
            </CardTitle>
            <Users className="h-5 w-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : invitationsTotal}
            </div>
          </CardContent>
        </Card>

        {/* Non scannées */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Non Scannées</CardTitle>
            <UserX className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : invitationsUnscanned}
            </div>
          </CardContent>
        </Card>

        {/* Partiellement scannées */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Partiels</CardTitle>
            <User className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : invitationsPartial}
            </div>
          </CardContent>
        </Card>

        {/* Complètes */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Complétées</CardTitle>
            <UserCheck className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : invitationsComplete}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* --- PERSONNES --- */}
      <h2 className="text-lg font-semibold mt-6 mb-2 text-white">Personnes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total attendues */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Personnes Attendues
            </CardTitle>
            <Users className="h-5 w-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : personsTotalCapacity}
            </div>
          </CardContent>
        </Card>

        {/* Scannées */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Personnes Entrées
            </CardTitle>
            <UserCheck className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : personsTotalScanned}
            </div>
          </CardContent>
        </Card>

        {/* Restants */}
        <Card className="bg-black/30 text-white/80 border-none shadow-md shadow-black">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Restants</CardTitle>
            <User className="h-5 w-5 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "…" : personsRemaining}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
