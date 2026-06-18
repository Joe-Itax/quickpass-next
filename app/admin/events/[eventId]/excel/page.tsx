"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  MoveLeftIcon,
  Plus,
  Save,
  Table2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataStatusDisplay from "@/components/data-status-display";
import { useEvent } from "@/hooks/use-event";
import { cn } from "@/lib/utils";
import type { Event2 } from "@/types/types";

type GuestSheetRow = {
  id?: number;
  label: string;
  peopleCount: number;
  email: string;
  whatsapp: string;
  tableName: string;
};

type TableSheetRow = {
  id?: number;
  name: string;
  capacity: number;
};

type ValidationError = {
  sheet: "guests" | "tables";
  row: number;
  column: string;
  message: string;
};

type ActiveSheet = "guests" | "tables";

const naturalCollator = new Intl.Collator("fr", {
  numeric: true,
  sensitivity: "base",
});

export default function EventExcelPage() {
  const { eventId } = useParams();
  const router = useRouter();
  const numericEventId = Number(eventId);
  const { data, isPending, isError, error, refetch } = useEvent(numericEventId);
  const event = data as Event2 | undefined;
  const [guestRows, setGuestRows] = useState<GuestSheetRow[]>([]);
  const [tableRows, setTableRows] = useState<TableSheetRow[]>([]);
  const [guestSearch, setGuestSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>("guests");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!event || hasHydrated) return;

    queueMicrotask(() => {
      setGuestRows(
        event.invitations.map((invitation) => ({
          id: invitation.id,
          label: invitation.label,
          peopleCount: invitation.peopleCount,
          email: invitation.email ?? "",
          whatsapp: invitation.whatsapp ?? "+243",
          tableName: invitation.allocations?.[0]?.table.name ?? "",
        })),
      );
      setTableRows(
        event.tables.map((table) => ({
          id: table.id,
          name: table.name,
          capacity: table.capacity,
        })),
      );
      setHasHydrated(true);
    });
  }, [event, hasHydrated]);

  const tableNames = useMemo(
    () =>
      Array.from(
        new Set(
          tableRows
            .map((table) => table.name.trim())
            .filter(Boolean)
            .sort(compareTableLabels),
        ),
      ),
    [tableRows],
  );

  const assignedCapacityByTable = useMemo(() => {
    const assigned = new Map<string, number>();

    for (const guest of guestRows) {
      const tableName = guest.tableName.trim();
      if (!tableName) continue;
      assigned.set(
        tableName,
        (assigned.get(tableName) ?? 0) + Math.max(1, Number(guest.peopleCount) || 1),
      );
    }

    return assigned;
  }, [guestRows]);

  const sortedGuestRows = useMemo(() => {
    return guestRows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => compareGuestRowsByTable(a.row, b.row))
      .map((item, sheetIndex) => ({
        ...item,
        sheetRow: sheetIndex + 1,
        groupName: getGuestTableGroup(item.row),
      }));
  }, [guestRows]);

  const visibleGuestRows = useMemo(() => {
    const query = guestSearch.trim().toLocaleLowerCase("fr-FR");
    return sortedGuestRows
      .filter(({ row }) => {
        if (!query) return true;
        return [
          row.label,
          row.email,
          row.whatsapp,
          row.tableName,
          String(row.id ?? ""),
        ]
          .join(" ")
          .toLocaleLowerCase("fr-FR")
          .includes(query);
      });
  }, [guestSearch, sortedGuestRows]);

  const visibleTableRows = useMemo(() => {
    const query = tableSearch.trim().toLocaleLowerCase("fr-FR");
    return tableRows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => compareTableLabels(a.row.name, b.row.name))
      .filter(({ row }) => {
        if (!query) return true;
        return [row.name, String(row.id ?? "")]
          .join(" ")
          .toLocaleLowerCase("fr-FR")
          .includes(query);
      });
  }, [tableRows, tableSearch]);

  if (isPending || isError || error || !event) {
    return (
      <DataStatusDisplay
        isPending={isPending}
        hasError={isError}
        errorObject={error}
        refetch={refetch}
      />
    );
  }

  const addGuestRow = () => {
    setGuestRows((current) => [
      {
        label: "",
        peopleCount: 1,
        email: "",
        whatsapp: "+243",
        tableName: tableNames[0] ?? "",
      },
      ...current,
    ]);
  };

  const addTableRow = () => {
    setTableRows((current) => [{ name: "", capacity: 1 }, ...current]);
  };

  const saveSheet = async () => {
    const guestsForSave = sortedGuestRows.map(({ row }) => row);
    const payload = {
      guests: guestsForSave,
      tables: tableRows.map((table) => ({
        ...table,
        capacity:
          table.name.trim() && assignedCapacityByTable.has(table.name.trim())
            ? assignedCapacityByTable.get(table.name.trim())!
            : table.capacity,
      })),
    };
    const localErrors = validateRows(payload.guests, payload.tables);
    setErrors(localErrors);

    if (localErrors.length > 0) {
      toast.error("Corrigez les erreurs avant d'enregistrer.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/events/${eventId}/excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setErrors(result.errors ?? []);
        toast.error(result.error || "Enregistrement impossible.");
        return;
      }

      toast.success("Tableur enregistre.");
      await refetch();
      setHasHydrated(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur reseau.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="min-h-screen w-full max-w-full min-w-0 space-y-6 overflow-x-hidden bg-background px-2 py-6 text-white">
      <div className="flex min-w-0 flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/admin/events/${eventId}`)}
            className="size-12 rounded-2xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <MoveLeftIcon className="size-5" />
          </Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Tableur evenement
            </p>
            <h1 className="text-3xl font-black uppercase italic tracking-tight">
              Invites & tables
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-500">
              {event.name}
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={saveSheet}
          disabled={isSaving}
          className="h-12 rounded-2xl bg-primary px-6 font-black uppercase italic text-black hover:bg-white"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          Enregistrer
        </Button>
      </div>

      {errors.length > 0 ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase text-red-300">
            <AlertCircle className="size-4" />
            Erreurs detectees
          </div>
          <div className="grid gap-2 text-xs font-bold text-red-100 md:grid-cols-2">
            {errors.map((item, index) => (
              <div key={`${item.sheet}-${item.row}-${item.column}-${index}`}>
                {item.sheet === "guests" ? "Invites" : "Tables"} - ligne{" "}
                {item.row}, {item.column}: {item.message}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex w-full max-w-full min-w-0 gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-1">
        <SheetTab
          active={activeSheet === "guests"}
          icon={FileSpreadsheet}
          label="Feuille invites"
          count={guestRows.length}
          onClick={() => setActiveSheet("guests")}
        />
        <SheetTab
          active={activeSheet === "tables"}
          icon={Table2}
          label="Feuille tables"
          count={tableRows.length}
          onClick={() => setActiveSheet("tables")}
        />
      </div>

      {activeSheet === "guests" ? (
        <SheetTable
          title="Invites"
          actionLabel="Ajouter un invite"
          searchValue={guestSearch}
          onSearchChange={setGuestSearch}
          onAdd={addGuestRow}
        >
          <div className="w-full min-w-[1150px]">
            <div className="sticky top-0 z-10 grid grid-cols-[70px_80px_220px_90px_220px_180px_220px_70px] border-b border-white/10 bg-[#141414] text-[10px] font-black uppercase tracking-widest text-gray-400">
              {[
                "Ligne",
                "ID",
                "Nom",
                "PAX",
                "Email",
                "WhatsApp",
                "Table",
                "",
              ].map((head) => (
                <div key={head} className="truncate px-3 py-3">
                  {head}
                </div>
              ))}
            </div>
            {visibleGuestRows.map(({ row, index, sheetRow, groupName }, idx) => {
              const previousGroup = visibleGuestRows[idx - 1]?.groupName;
              const shouldRenderGroup = idx === 0 || previousGroup !== groupName;
              const groupCapacity = assignedCapacityByTable.get(row.tableName.trim());

              return (
                <Fragment key={row.id ?? `new-${index}`}>
                  {shouldRenderGroup ? (
                    <div className="grid grid-cols-[70px_80px_220px_90px_220px_180px_220px_70px] border-b border-primary/20 bg-primary/10">
                      <div className="col-span-8 flex min-h-11 items-center justify-between gap-4 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                        <span>{groupName}</span>
                        {groupCapacity ? <span>{groupCapacity} pax</span> : null}
                      </div>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-[70px_80px_220px_90px_220px_180px_220px_70px] border-b border-white/5">
                    <Cell>{sheetRow}</Cell>
                    <Cell>{row.id ?? "new"}</Cell>
                    <CellInput
                      value={row.label}
                      onChange={(value) =>
                        setGuestRows((current) =>
                          updateAt(current, index, { ...row, label: value }),
                        )
                      }
                    />
                    <CellNumber
                      value={row.peopleCount}
                      onChange={(value) =>
                        setGuestRows((current) =>
                          updateAt(current, index, {
                            ...row,
                            peopleCount: value,
                          }),
                        )
                      }
                    />
                    <CellInput
                      value={row.email}
                      onChange={(value) =>
                        setGuestRows((current) =>
                          updateAt(current, index, { ...row, email: value }),
                        )
                      }
                    />
                    <CellInput
                      value={row.whatsapp}
                      onChange={(value) =>
                        setGuestRows((current) =>
                          updateAt(current, index, { ...row, whatsapp: value }),
                        )
                      }
                    />
                    <div className="border-r border-white/5 p-1">
                      <select
                        value={row.tableName}
                        onChange={(event) =>
                          setGuestRows((current) =>
                            updateAt(current, index, {
                              ...row,
                              tableName: event.target.value,
                            }),
                          )
                        }
                        className="h-10 w-full min-w-0 rounded-none border-0 bg-transparent px-3 text-sm text-white outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="" className="bg-[#0f0f0f]">
                          Sans table
                        </option>
                        {tableNames.map((tableName) => (
                          <option
                            key={tableName}
                            value={tableName}
                            className="bg-[#0f0f0f]"
                          >
                            {tableName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Cell>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setGuestRows((current) =>
                            current.filter((_, rowIndex) => rowIndex !== index),
                          )
                        }
                        className="size-9 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </Cell>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </SheetTable>
      ) : (
        <SheetTable
          title="Tables"
          actionLabel="Ajouter une table"
          searchValue={tableSearch}
          onSearchChange={setTableSearch}
          onAdd={addTableRow}
        >
          <div className="w-full min-w-[620px]">
            <div className="sticky top-0 z-10 grid grid-cols-[70px_80px_260px_140px_70px] border-b border-white/10 bg-[#141414] text-[10px] font-black uppercase tracking-widest text-gray-400">
              {["Ligne", "ID", "Nom", "Capacite", ""].map((head) => (
                <div key={head} className="truncate px-3 py-3">
                  {head}
                </div>
              ))}
            </div>
            {visibleTableRows.map(({ row, index }) => {
              const assignedCapacity = row.name.trim()
                ? assignedCapacityByTable.get(row.name.trim())
                : undefined;
              const displayedCapacity = assignedCapacity ?? row.capacity;

              return (
                <div
                  key={row.id ?? `new-${index}`}
                  className="grid grid-cols-[70px_80px_260px_140px_70px] border-b border-white/5"
                >
                  <Cell>{index + 1}</Cell>
                  <Cell>{row.id ?? "new"}</Cell>
                  <CellInput
                    value={row.name}
                    onChange={(value) =>
                      setTableRows((current) =>
                        updateAt(current, index, { ...row, name: value }),
                      )
                    }
                  />
                  <Cell>
                    <span className={assignedCapacity ? "text-primary" : ""}>
                      {displayedCapacity}
                    </span>
                  </Cell>
                  <Cell>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setTableRows((current) =>
                          current.filter((_, rowIndex) => rowIndex !== index),
                        )
                      }
                      className="size-9 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </Cell>
                </div>
              );
            })}
          </div>
        </SheetTable>
      )}
    </section>
  );
}

function SheetTab({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-xl px-4 text-[10px] font-black uppercase italic tracking-widest text-white hover:bg-white/10 hover:text-white",
        active && "bg-primary text-black hover:bg-primary/90 hover:text-black",
      )}
    >
      <Icon className="size-4" />
      {label}
      <span className="rounded-full bg-black/20 px-2 py-0.5 text-[9px]">
        {count}
      </span>
    </Button>
  );
}

function SheetTable({
  title,
  actionLabel,
  searchValue,
  onSearchChange,
  onAdd,
  children,
}: {
  title: string;
  actionLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-black/30">
      <div className="flex min-w-0 flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-black uppercase italic text-white">{title}</h2>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={`Rechercher ${title.toLocaleLowerCase("fr-FR")}`}
            className="h-10 w-full rounded-xl border-white/10 bg-white/5 text-white sm:w-64"
          />
          <Button
            type="button"
            onClick={onAdd}
            className="h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Plus className="size-4" />
            {actionLabel}
          </Button>
        </div>
      </div>
      <div className="custom-scrollbar max-h-[55vh] max-w-full overflow-auto">
        {children}
      </div>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-12 min-w-0 items-center truncate border-r border-white/5 px-2 text-xs font-bold text-gray-400">
      {children}
    </div>
  );
}

function CellInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="border-r border-white/5 p-1">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-none border-0 bg-transparent px-2 text-sm text-white focus-visible:ring-1"
      />
    </div>
  );
}

function CellNumber({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="border-r border-white/5 p-1">
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 rounded-none border-0 bg-transparent px-2 text-sm text-white focus-visible:ring-1"
      />
    </div>
  );
}

function updateAt<T>(items: T[], index: number, value: T) {
  return items.map((item, rowIndex) => (rowIndex === index ? value : item));
}

function getGuestTableGroup(row: GuestSheetRow) {
  return row.tableName.trim() || "Sans table";
}

function compareGuestRowsByTable(a: GuestSheetRow, b: GuestSheetRow) {
  const tableA = getGuestTableGroup(a);
  const tableB = getGuestTableGroup(b);
  const tableCompare = compareTableLabels(tableA, tableB);

  if (tableCompare !== 0) return tableCompare;

  return naturalCollator.compare(a.label, b.label);
}

function compareTableLabels(a: string, b: string) {
  const aLabel = a.trim() || "Sans table";
  const bLabel = b.trim() || "Sans table";
  const aIsUnassigned = aLabel.toLocaleLowerCase("fr-FR") === "sans table";
  const bIsUnassigned = bLabel.toLocaleLowerCase("fr-FR") === "sans table";

  if (aIsUnassigned && !bIsUnassigned) return 1;
  if (!aIsUnassigned && bIsUnassigned) return -1;

  return naturalCollator.compare(aLabel, bLabel);
}

function validateRows(guests: GuestSheetRow[], tables: TableSheetRow[]) {
  const errors: ValidationError[] = [];
  const tableNames = new Set<string>();

  tables.forEach((table, index) => {
    const row = index + 1;
    const name = table.name.trim();
    if (!name) {
      errors.push({ sheet: "tables", row, column: "Nom", message: "Nom requis." });
    }
    if (name && tableNames.has(name.toLocaleLowerCase("fr-FR"))) {
      errors.push({
        sheet: "tables",
        row,
        column: "Nom",
        message: "Nom de table duplique.",
      });
    }
    if (name) tableNames.add(name.toLocaleLowerCase("fr-FR"));
  });

  guests.forEach((guest, index) => {
    const row = index + 1;
    if (!guest.label.trim()) {
      errors.push({ sheet: "guests", row, column: "Nom", message: "Nom requis." });
    }
    if (!Number.isInteger(Number(guest.peopleCount)) || Number(guest.peopleCount) < 1) {
      errors.push({
        sheet: "guests",
        row,
        column: "PAX",
        message: "Nombre entier positif requis.",
      });
    }
    if (guest.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) {
      errors.push({
        sheet: "guests",
        row,
        column: "Email",
        message: "Format email invalide.",
      });
    }
    if (guest.whatsapp.trim() && !/^\+?[0-9\s().-]{7,24}$/.test(guest.whatsapp.trim())) {
      errors.push({
        sheet: "guests",
        row,
        column: "WhatsApp",
        message: "Numero WhatsApp invalide.",
      });
    }
    if (guest.tableName.trim() && !tableNames.has(guest.tableName.trim().toLocaleLowerCase("fr-FR"))) {
      errors.push({
        sheet: "guests",
        row,
        column: "Table",
        message: "Selectionnez une table existante dans le tableau Tables.",
      });
    }
  });

  return errors;
}
