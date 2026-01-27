"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  EditIcon,
  Table2,
  RefreshCcw,
  Wand2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Mail,
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
import { Input } from "@/components/ui/input";
import {
  useUpdateInvitation,
  useTables,
  useEventInvitations,
} from "@/hooks/use-event";
import { Invitation, Table } from "@/types/types";
import { cn } from "@/lib/utils";

type GuestFormData = {
  label: string;
  peopleCount: number;
  email: string;
  whatsapp: string;
  tableAssignments: { tableId: number; seatsAssigned: number }[];
};

type TableWithAvailability = Table & {
  availableSeatsForAll: number;
  currentGuestSeats: number;
  otherGuestsSeats: number;
  maxForThisGuest: number;
};

export default function ModifyGuest({
  eventId,
  guest,
  onGuestUpdated,
}: {
  eventId: number;
  guest: Invitation;
  onGuestUpdated?: () => void;
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<GuestFormData>({
    label: "",
    peopleCount: 1,
    email: "",
    whatsapp: "",
    tableAssignments: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutateAsync: updateInvitation, isPending } = useUpdateInvitation(
    eventId,
    guest.id,
  );
  const { data: dataTables } = useTables(eventId);
  const { data: existingInvitations } = useEventInvitations(eventId);

  const tables = useMemo(() => (dataTables as Table[]) || [], [dataTables]);
  const invitations = useMemo(
    () => (existingInvitations as Invitation[]) || [],
    [existingInvitations],
  );
  const currentGuest = invitations?.find((inv) => inv.id === guest.id) || guest;

  const [availableTables, setAvailableTables] = useState<
    TableWithAvailability[]
  >([]);

  // --- LOGIQUE DE CALCUL DISPONIBILITÉS ---
  const calculateTableAvailability = useCallback(
    (tables: Table[], invitations: Invitation[], currentGuest: Invitation) => {
      const currentGuestSeatsMap = new Map<number, number>();
      const otherGuestsSeatsMap = new Map<number, number>();

      invitations?.forEach((invitation) => {
        invitation.allocations?.forEach((allocation) => {
          const tableId = allocation.table?.id || allocation.tableId;
          if (tableId) {
            if (invitation.id === currentGuest.id) {
              currentGuestSeatsMap.set(
                tableId,
                (currentGuestSeatsMap.get(tableId) || 0) +
                  allocation.seatsAssigned,
              );
            } else {
              otherGuestsSeatsMap.set(
                tableId,
                (otherGuestsSeatsMap.get(tableId) || 0) +
                  allocation.seatsAssigned,
              );
            }
          }
        });
      });

      return tables.map((table) => {
        const otherSeats = otherGuestsSeatsMap.get(table.id) || 0;
        const currentSeats = currentGuestSeatsMap.get(table.id) || 0;
        return {
          ...table,
          availableSeatsForAll: Math.max(
            0,
            table.capacity - (otherSeats + currentSeats),
          ),
          currentGuestSeats: currentSeats,
          otherGuestsSeats: otherSeats,
          maxForThisGuest: Math.max(0, table.capacity - otherSeats),
        };
      });
    },
    [],
  );

  const initializeForm = useCallback(() => {
    if (tables.length && currentGuest) {
      const tablesWithAvail = calculateTableAvailability(
        tables,
        invitations,
        currentGuest,
      );
      const assignments =
        currentGuest.allocations?.map((a) => ({
          tableId: a.table?.id || a.tableId,
          seatsAssigned: a.seatsAssigned,
        })) || [];

      setAvailableTables(tablesWithAvail);
      setFormData({
        label: currentGuest.label,
        peopleCount: currentGuest.peopleCount,
        email: currentGuest.email || "",
        whatsapp: currentGuest.whatsapp || "",
        tableAssignments: assignments,
      });
    }
  }, [tables, currentGuest, invitations, calculateTableAvailability]);

  useEffect(() => {
    if (openDialog) {
      const timer = setTimeout(initializeForm, 0);
      return () => clearTimeout(timer);
    }
  }, [openDialog, initializeForm]);

  // --- ACTIONS : AUTO-FILL & RESET ---
  const handleAutoFill = () => {
    let remaining = formData.peopleCount;
    const newAssignments: { tableId: number; seatsAssigned: number }[] = [];
    const sorted = [...availableTables].sort(
      (a, b) => b.maxForThisGuest - a.maxForThisGuest,
    );

    for (const t of sorted) {
      if (remaining <= 0) break;
      const toAssign = Math.min(t.maxForThisGuest, remaining);
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.label.trim()) newErrors.label = "Le nom est requis";
    if (formData.email && !emailRegex.test(formData.email))
      newErrors.email = "Email invalide";
    if (formData.whatsapp && !isValidPhoneNumber(formData.whatsapp))
      newErrors.whatsapp = "Numéro invalide";

    const totalAssigned = formData.tableAssignments.reduce(
      (sum, a) => sum + a.seatsAssigned,
      0,
    );
    if (totalAssigned !== formData.peopleCount) {
      newErrors.tables = `Répartition incomplète (${totalAssigned}/${formData.peopleCount})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      await updateInvitation({
        ...formData,
        whatsapp: formData.whatsapp,
      } as unknown as Invitation);
      setOpenDialog(false);
      onGuestUpdated?.();
    } catch (e) {
      console.error(e);
    }
  };

  const getMaxLength = () => {
    if (!formData.whatsapp) return 20;
    const phoneNumber = parsePhoneNumber(formData.whatsapp);
    return phoneNumber?.country === "CD" ? 16 : 20;
  };

  const totalAssigned = formData.tableAssignments.reduce(
    (s, a) => s + a.seatsAssigned,
    0,
  );

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary font-black uppercase italic text-[10px] tracking-widest transition-all"
        >
          <EditIcon className="w-4 h-4 mr-2" /> Modifier
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl bg-[#0a0a0a] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="bg-white/5 p-8 border-b border-white/5 flex flex-row justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <RefreshCcw className="text-primary" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase text-white">
                Guest Edit
              </DialogTitle>
              <p className="text-[10px] font-bold text-gray-500 uppercase">
                Mise à jour des données
              </p>
            </div>
          </div>
          <div
            className={cn(
              "px-4 py-2 rounded-xl border font-black italic text-xs flex items-center gap-2",
              totalAssigned === formData.peopleCount
                ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
                : "text-red-500 border-red-500/20 bg-red-500/10",
            )}
          >
            {totalAssigned === formData.peopleCount ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertTriangle size={14} />
            )}
            {totalAssigned} / {formData.peopleCount} ALLOUÉS
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">
                Identifiant
              </Label>
              <Input
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
                className={cn(
                  "h-12 bg-white/5 border-white/10 text-white font-bold italic",
                  errors.label && "border-red-500",
                )}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-500 ml-1">
                Effectif
              </Label>
              <Input
                type="number"
                value={formData.peopleCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    peopleCount: Math.max(1, Number(e.target.value)),
                    tableAssignments: [],
                  })
                }
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
                  "rounded-xl border bg-white/5 px-3 transition-all flex items-center",
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
                    setFormData({ ...formData, whatsapp: val || "" });
                    if (errors.whatsapp) setErrors({ ...errors, whatsapp: "" });
                  }}
                  className="whatsapp-field h-12 text-white font-bold w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-2">
                <Mail size={10} className="text-blue-500" /> Email
              </Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={cn(
                  "h-12 bg-white/5 border-white/10 text-white font-bold",
                  errors.email && "border-red-500",
                )}
                placeholder="exemple@mail.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                <Table2 size={14} /> Répartition des places
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAutoFill}
                  className="h-8 text-[9px] font-black uppercase bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                >
                  <Wand2 size={12} className="mr-2" /> Auto-Fill
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetTables}
                  className="h-8 text-[9px] font-black uppercase text-red-500 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 size={12} className="mr-2" /> Reset
                </Button>
              </div>
            </div>

            {errors.tables && (
              <p className="text-red-500 text-[10px] font-black uppercase italic animate-pulse flex items-center gap-2">
                <AlertTriangle size={12} /> {errors.tables}
              </p>
            )}

            <div className="grid gap-3">
              {availableTables.map((table) => {
                const currentSeats =
                  formData.tableAssignments.find((a) => a.tableId === table.id)
                    ?.seatsAssigned || 0;
                return (
                  <div
                    key={table.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex items-center justify-between",
                      currentSeats > 0
                        ? "bg-white/5 border-primary/30"
                        : "bg-white/1 border-white/5",
                    )}
                  >
                    <div>
                      <p className="font-black uppercase italic text-sm text-white">
                        {table.name}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase">
                        Disponible pour lui : {table.maxForThisGuest}
                      </p>
                    </div>
                    <select
                      value={currentSeats}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const filtered = formData.tableAssignments.filter(
                          (a) => a.tableId !== table.id,
                        );
                        setFormData({
                          ...formData,
                          tableAssignments:
                            val > 0
                              ? [
                                  ...filtered,
                                  { tableId: table.id, seatsAssigned: val },
                                ]
                              : filtered,
                        });
                        setErrors({ ...errors, tables: "" });
                      }}
                      className="bg-black border border-white/20 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:border-primary"
                    >
                      {Array.from(
                        { length: table.maxForThisGuest + 1 },
                        (_, i) => (
                          <option key={i} value={i}>
                            {i} places
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 flex items-center justify-between">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:text-black transition-colors"
            >
              Annuler
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className={cn(
              "rounded-2xl font-black uppercase italic text-xs px-10 h-12 transition-all",
              totalAssigned === formData.peopleCount
                ? "bg-primary shadow-lg"
                : "bg-white/10 text-gray-500 hover:bg-white/10",
            )}
          >
            {isPending ? "Sync..." : "Confirmer"}
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
        .whatsapp-field .PhoneInputCountry {
          margin-right: 8px;
        }
      `}</style>
    </Dialog>
  );
}
