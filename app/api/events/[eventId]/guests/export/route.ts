import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { requireEventAccess } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const naturalCollator = new Intl.Collator("fr", {
  numeric: true,
  sensitivity: "base",
});

type GuestExportRow = {
  id: number;
  name: string;
  pax: number;
  email: string;
  whatsapp: string;
  table: string;
};

interface EventContext {
  params: Promise<{ eventId: string }>;
}

export async function GET(req: NextRequest, context: EventContext) {
  const { eventId: rawEventId } = await context.params;
  const eventId = Number(rawEventId);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const user = await requireEventAccess(req, eventId);
  if (user instanceof NextResponse) return user;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      tables: {
        select: {
          id: true,
          name: true,
          capacity: true,
        },
      },
      invitations: {
        select: {
          id: true,
          label: true,
          peopleCount: true,
          email: true,
          whatsapp: true,
          allocations: {
            select: {
              table: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Evenement introuvable" }, { status: 404 });
  }

  const guests = event.invitations
    .map((invitation) => ({
      id: invitation.id,
      name: invitation.label,
      pax: invitation.peopleCount,
      email: invitation.email || "",
      whatsapp: invitation.whatsapp || "",
      table: invitation.allocations[0]?.table.name || "Sans table",
    }))
    .sort(compareGuestRows);
  const assignedPaxByTable = getAssignedPaxByTable(guests);
  const totalPax = guests.reduce((total, guest) => total + guest.pax, 0);
  const tables = event.tables
    .map((table) => ({
      ...table,
      displayedCapacity: assignedPaxByTable.get(table.name) ?? table.capacity,
    }))
    .sort((a, b) => compareTableLabels(a.name, b.name));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "YambiPass";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Tableur invités", {
    views: [{ state: "frozen", ySplit: 2 }],
  });

  worksheet.columns = [
    { key: "line", width: 10 },
    { key: "id", width: 10 },
    { key: "name", width: 34 },
    { key: "pax", width: 10 },
    { key: "email", width: 30 },
    { key: "whatsapp", width: 22 },
    { key: "table", width: 28 },
  ];

  addTitleRow(worksheet, "Feuille Invités", 7);
  addHeaderRow(worksheet, ["Ligne", "ID", "Nom", "PAX", "Email", "WhatsApp", "Table"]);
  addGuestRows(worksheet, guests, assignedPaxByTable);

  worksheet.addRow([]);
  addTitleRow(worksheet, "Feuille Tables", 4);
  addHeaderRow(worksheet, ["Ligne", "ID", "Nom", "Capacité"]);

  tables.forEach((table, index) => {
    const row = worksheet.addRow([
      index + 1,
      table.id,
      table.name,
      table.displayedCapacity,
    ]);
    styleDataRow(row, 4);
  });

  const totalRow = worksheet.addRow(["", "", "TOTAL PAX", totalPax]);
  styleTotalRow(totalRow, 4);

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const fileName = `YambiPass_Tableur_Invites_${event.id}_${safeFileName(event.name)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": XLSX_MIME_TYPE,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}

function addGuestRows(
  worksheet: ExcelJS.Worksheet,
  guests: GuestExportRow[],
  assignedPaxByTable: Map<string, number>,
) {
  let previousTable = "";

  guests.forEach((guest, index) => {
    if (guest.table !== previousTable) {
      const groupRow = worksheet.addRow([
        guest.table,
        "",
        "",
        "",
        "",
        "",
        `${assignedPaxByTable.get(guest.table) ?? guest.pax} PAX`,
      ]);
      worksheet.mergeCells(groupRow.number, 1, groupRow.number, 6);
      styleGroupRow(groupRow, 7);
      previousTable = guest.table;
    }

    const row = worksheet.addRow([
      index + 1,
      guest.id,
      guest.name,
      guest.pax,
      guest.email,
      guest.whatsapp,
      guest.table,
    ]);
    styleDataRow(row, 7);
  });
}

function addTitleRow(
  worksheet: ExcelJS.Worksheet,
  title: string,
  endColumn: number,
) {
  const row = worksheet.addRow([title]);
  worksheet.mergeCells(row.number, 1, row.number, endColumn);

  const cell = row.getCell(1);
  cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF111827" },
  };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  row.height = 26;
}

function addHeaderRow(worksheet: ExcelJS.Worksheet, headers: string[]) {
  const row = worksheet.addRow(headers);
  styleHeaderRow(row, headers.length);
}

function styleHeaderRow(row: ExcelJS.Row, endColumn: number) {
  row.height = 22;

  for (let column = 1; column <= endColumn; column += 1) {
    const cell = row.getCell(column);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F497D" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    addThinBorder(cell);
  }
}

function styleGroupRow(row: ExcelJS.Row, endColumn: number) {
  row.height = 24;

  for (let column = 1; column <= endColumn; column += 1) {
    const cell = row.getCell(column);
    cell.font = { bold: true, color: { argb: "FF1F2937" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFE8A3" },
    };
    cell.alignment = {
      horizontal: column === endColumn ? "center" : "left",
      vertical: "middle",
    };
    addThinBorder(cell);
  }
}

function styleDataRow(row: ExcelJS.Row, endColumn: number) {
  for (let column = 1; column <= endColumn; column += 1) {
    const cell = row.getCell(column);
    cell.alignment = {
      horizontal: column === 1 || column === 2 || column === 4 ? "center" : "left",
      vertical: "middle",
    };
    addThinBorder(cell);
  }
}

function styleTotalRow(row: ExcelJS.Row, endColumn: number) {
  row.height = 24;

  for (let column = 1; column <= endColumn; column += 1) {
    const cell = row.getCell(column);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F766E" },
    };
    cell.alignment = {
      horizontal: column === endColumn ? "center" : "left",
      vertical: "middle",
    };
    addThinBorder(cell);
  }
}

function addThinBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: "FFD9E2F3" } },
    right: { style: "thin", color: { argb: "FFD9E2F3" } },
    bottom: { style: "thin", color: { argb: "FFD9E2F3" } },
    left: { style: "thin", color: { argb: "FFD9E2F3" } },
  };
}

function getAssignedPaxByTable(guests: GuestExportRow[]) {
  const assigned = new Map<string, number>();

  for (const guest of guests) {
    assigned.set(guest.table, (assigned.get(guest.table) ?? 0) + guest.pax);
  }

  return assigned;
}

function compareGuestRows(a: GuestExportRow, b: GuestExportRow) {
  const tableCompare = compareTableLabels(a.table, b.table);
  if (tableCompare !== 0) return tableCompare;

  return naturalCollator.compare(a.name, b.name);
}

function safeFileName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "event"
  );
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
