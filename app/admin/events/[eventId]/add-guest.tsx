"use client";

import { useState, useMemo } from "react";
import {
  PlusIcon,
  Users,
  Table2,
  Wand2,
  AlertTriangle,
  Trash2,
} from "lucide-react";

import PhoneInput, {
  isValidPhoneNumber,
  parsePhoneNumber,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useCreateInvitation,
  useTables,
  useEventInvitations,
} from "@/hooks/use-event";
import { authClient } from "@/lib/auth-client";
import { Invitation, Table } from "@/types/types";
import { cn } from "@/lib/utils";
import AddTable from "./add-table";
import { Input } from "@/components/ui/input";

export default function AddGuest({ eventId }: { eventId: number }) {
  const [openDialog, setOpenDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    label: "",
    peopleCount: 1,
    email: "",
    whatsapp: "",
    tableAssignments: [] as { tableId: number; seatsAssigned: number }[],
  });

  const { mutateAsync: createInvitation, isPending } =
    useCreateInvitation(eventId);
  const { data: session } = authClient.useSession();
  const { data: datatables } = useTables(eventId);
  const { data: dataInvs } = useEventInvitations(eventId);

  const dataTables = datatables as Table[];

  // --- STATISTIQUES DES TABLES ---
  const tableStats = useMemo(() => {
    const tables = dataTables || [];
    const invitations = (dataInvs as Invitation[]) || [];

    const map = new Map<number, number>();
    invitations.forEach((inv) => {
      inv.allocations?.forEach((alloc) => {
        map.set(
          alloc.tableId,
          (map.get(alloc.tableId) || 0) + alloc.seatsAssigned,
        );
      });
    });

    return tables.map((t) => {
      const occupied = map.get(t.id) || 0;
      const currentAssigned =
        formData.tableAssignments.find((a) => a.tableId === t.id)
          ?.seatsAssigned || 0;
      return {
        ...t,
        alreadyOccupied: occupied,
        realAvailable: Math.max(0, t.capacity - occupied),
        currentAssigned,
      };
    });
  }, [dataTables, dataInvs, formData.tableAssignments]);

  const hasNoTables = !dataTables || dataTables.length === 0;
  const totalAssigned = formData.tableAssignments.reduce(
    (sum, a) => sum + a.seatsAssigned,
    0,
  );
  const isAllocationComplete = totalAssigned === formData.peopleCount;

  // --- VALIDATION ---
  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.label.trim()) newErrors.label = "Le nom est requis";
    if (formData.email && !emailRegex.test(formData.email))
      newErrors.email = "Format d'email invalide";

    if (formData.whatsapp && !isValidPhoneNumber(formData.whatsapp)) {
      newErrors.whatsapp = "Numéro invalide pour ce pays";
    }

    if (!isAllocationComplete) {
      newErrors.tables = `Incomplet (${totalAssigned}/${formData.peopleCount})`;
    }
    if (hasNoTables) newErrors.tables = "Configurez d'abord les tables";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAutoFill = () => {
    let remaining = formData.peopleCount;
    const newAssignments: { tableId: number; seatsAssigned: number }[] = [];
    const sorted = [...tableStats].sort(
      (a, b) => b.realAvailable - a.realAvailable,
    );

    for (const t of sorted) {
      if (remaining <= 0) break;
      const toAssign = Math.min(t.realAvailable, remaining);
      if (toAssign > 0) {
        newAssignments.push({ tableId: t.id, seatsAssigned: toAssign });
        remaining -= toAssign;
      }
    }
    setFormData((p) => ({ ...p, tableAssignments: newAssignments }));
    setErrors((prev) => ({ ...prev, tables: "" }));
  };

  const handleResetTables = () => {
    setFormData((p) => ({ ...p, tableAssignments: [] }));
    setErrors((prev) => ({ ...prev, tables: "" }));
  };

  const handleTableChange = (tableId: number, seats: number) => {
    setFormData((prev) => {
      const filtered = prev.tableAssignments.filter(
        (a) => a.tableId !== tableId,
      );
      return {
        ...prev,
        tableAssignments:
          seats > 0
            ? [...filtered, { tableId, seatsAssigned: seats }]
            : filtered,
      };
    });
    setErrors((prev) => ({ ...prev, tables: "" }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await createInvitation({
        ...formData,
        whatsapp: formData.whatsapp,
        eventId,
        userId: session?.user?.id || "",
      } as unknown as Invitation);

      setFormData({
        label: "",
        peopleCount: 1,
        email: "",
        whatsapp: "",
        tableAssignments: [],
      });
      setErrors({});
      setOpenDialog(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Limite dynamique pour WhatsApp
  const getMaxLength = () => {
    if (!formData.whatsapp) return 20;
    const phoneNumber = parsePhoneNumber(formData.whatsapp);
    return phoneNumber?.country === "CD" ? 16 : 20;
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
        >
          <PlusIcon className="mr-2 size-4 text-primary" /> Ajouter Invité
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 flex flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Users className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase text-white tracking-tighter">
                Guest Entry
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Attribution des places
              </p>
            </div>
          </div>
          <div
            className={cn(
              "px-4 py-2 rounded-xl border font-black italic text-xs",
              isAllocationComplete
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-red-500/10 border-red-500/20 text-red-500",
            )}
          >
            {totalAssigned} / {formData.peopleCount} PLACES
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Nom du groupe
              </Label>
              <Input
                value={formData.label}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, label: e.target.value }));
                  if (errors.label) setErrors((p) => ({ ...p, label: "" }));
                }}
                className={cn(
                  "h-12 bg-white/5 border text-white font-bold italic",
                  errors.label ? "border-red-500" : "border-white/10",
                )}
                placeholder="Ex: FAMILLE MBOMA"
              />
              {errors.label && (
                <p className="text-[9px] text-red-500 font-bold uppercase ml-1">
                  {errors.label}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Nombre d&apos;invités
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.peopleCount}
                onChange={(e) => {
                  setFormData((p) => ({
                    ...p,
                    peopleCount: Number(e.target.value),
                    tableAssignments: [],
                  }));
                  setErrors((p) => ({ ...p, tables: "" }));
                }}
                className="h-12 bg-white/5 border-white/10 text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                WhatsApp
              </Label>
              <div
                className={cn(
                  "rounded-xl border bg-white/5 px-3 transition-all",
                  errors.whatsapp
                    ? "border-red-500"
                    : "border-white/10 focus-within:border-primary",
                )}
              >
                <PhoneInput
                  international
                  defaultCountry="CD"
                  value={formData.whatsapp}
                  maxLength={getMaxLength()}
                  onChange={(val) => {
                    setFormData((p) => ({ ...p, whatsapp: val || "" }));
                    if (errors.whatsapp)
                      setErrors((p) => ({ ...p, whatsapp: "" }));
                  }}
                  className="whatsapp-field h-12 text-white font-bold"
                />
              </div>
              {errors.whatsapp && (
                <p className="text-[9px] text-red-500 font-bold uppercase ml-1">
                  {errors.whatsapp}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">
                Email
              </Label>
              <Input
                value={formData.email}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, email: e.target.value }));
                  if (errors.email) setErrors((p) => ({ ...p, email: "" }));
                }}
                className={cn(
                  "h-12 bg-white/5 border text-white font-bold",
                  errors.email ? "border-red-500" : "border-white/10",
                )}
                placeholder="exemple@mail.com"
              />
              {errors.email && (
                <p className="text-[9px] text-red-500 font-bold uppercase ml-1">
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <Table2 size={14} /> Allocation par table
              </span>
              <div className="flex items-center gap-2">
                {!hasNoTables && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAutoFill}
                      className="h-8 text-[9px] font-black uppercase bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"
                    >
                      <Wand2 size={12} className="mr-2" /> Auto-Fill
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetTables}
                      className="h-8 text-[9px] font-black uppercase text-red-500 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 size={12} className="mr-2" /> Reset
                    </Button>
                  </>
                )}
              </div>
            </div>

            {errors.tables && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                <AlertTriangle size={14} />
                <p className="text-[10px] font-black uppercase">
                  {errors.tables}
                </p>
              </div>
            )}

            <div className="grid gap-3">
              {hasNoTables ? (
                <div className="p-8 rounded-4xl border border-dashed border-red-500/30 bg-red-500/5 flex flex-col items-center">
                  <AlertTriangle className="text-red-500 mb-4" size={32} />
                  <p className="text-sm font-black uppercase italic text-white mb-2">
                    Aucune table
                  </p>
                  <AddTable eventId={eventId} />
                </div>
              ) : (
                tableStats.map((table) => (
                  <div
                    key={table.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex items-center justify-between",
                      table.currentAssigned > 0
                        ? "bg-white/5 border-primary/30"
                        : "bg-white/1 border-white/5",
                    )}
                  >
                    <div className="flex-1">
                      <p className="font-black uppercase italic text-sm text-white">
                        {table.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              table.alreadyOccupied / table.capacity > 0.9
                                ? "bg-red-500"
                                : "bg-emerald-500",
                            )}
                            style={{
                              width: `${(table.alreadyOccupied / table.capacity) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase">
                          {table.alreadyOccupied} / {table.capacity} OCCUPÉS
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-2">
                        <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">
                          Libre
                        </p>
                        <p className="text-xs font-mono font-bold text-emerald-400">
                          {table.realAvailable}
                        </p>
                      </div>
                      <select
                        value={table.currentAssigned}
                        onChange={(e) =>
                          handleTableChange(table.id, Number(e.target.value))
                        }
                        className="bg-black border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-primary"
                      >
                        {Array.from(
                          { length: table.realAvailable + 1 },
                          (_, i) => (
                            <option key={i} value={i}>
                              {i} places
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-gray-500 font-bold uppercase text-[10px]"
            >
              Annuler
            </Button>
          </DialogClose>
          <Button
            disabled={isPending}
            onClick={handleSubmit}
            className={cn(
              "rounded-2xl font-black uppercase italic text-xs px-10 h-12 transition-all",
              isPending
                ? "bg-white/10 text-gray-100"
                : "bg-primary shadow-xl shadow-primary/20",
            )}
          >
            {isPending ? "Traitement..." : "Enregistrer l'invité"}
          </Button>
        </div>
      </DialogContent>

      <style jsx global>{`
        .PhoneInputInput {
          background: transparent !important;
          border: none !important;
          color: white !important;
          font-weight: bold !important;
          outline: none !important;
          width: 100%;
          padding-left: 10px;
        }
        .PhoneInputCountrySelect {
          background: #0a0a0a;
          color: white;
        }
      `}</style>
    </Dialog>
  );
}
