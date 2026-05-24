import ExcelJS from "exceljs";
import { EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const EVENT_TIME_ZONE = "Africa/Kinshasa";

const COLORS = {
  navy: "FF1F497D",
  white: "FFFFFFFF",
  zebra: "FFF2F5F9",
  lightBlue: "FFEAF1FB",
  border: "FFD9E2F3",
  darkText: "FF1F2937",
  mutedText: "FF667085",
  green: "FF107C41",
  red: "FFC00000",
  orange: "FFC65911",
};

const STRINGS = {
  delivered: "D\u00c9LIVR\u00c9",
  failed: "\u00c9CHEC",
  notSent: "NON ENVOY\u00c9",
  present: "PR\u00c9SENT",
  absent: "ABSENT",
  unassigned: "Non assign\u00e9e",
};

const BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: COLORS.border } },
  right: { style: "thin", color: { argb: COLORS.border } },
  bottom: { style: "thin", color: { argb: COLORS.border } },
  left: { style: "thin", color: { argb: COLORS.border } },
};

type EventExportData = Awaited<ReturnType<typeof getEventStatsExportData>>;

type ArrivalBucket = {
  sortKey: string;
  dateLabel: string;
  rangeLabel: string;
  count: number;
};

export class EventStatsExportError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "EventStatsExportError";
  }
}

export function getEventStatsExportFileName(eventId: number, eventName: string) {
  return `YambiPass_Stats_Event_${eventId}_${eventName}.xlsx`;
}

export function getEventStatsExportContentType() {
  return XLSX_MIME_TYPE;
}

export async function buildEventStatsWorkbookBuffer(eventId: number) {
  const exportData = await getEventStatsExportData(eventId);
  const workbook = buildWorkbook(exportData);
  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}

async function getEventStatsExportData(eventId: number) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
        eventCode: true,
        status: true,
        invitations: {
          orderBy: { label: "asc" },
          select: {
            id: true,
            label: true,
            peopleCount: true,
            whatsapp: true,
            isSentWhatsapp: true,
            scannedCount: true,
            allocations: {
              orderBy: { table: { name: "asc" } },
              select: {
                seatsAssigned: true,
                table: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new EventStatsExportError("Evenement introuvable.", 404);
    }

    if (event.status !== EventStatus.FINISHED) {
      throw new EventStatsExportError(
        "Le bilan Excel est disponible uniquement lorsque l'evenement est termine.",
        403,
      );
    }

    const scanLogs = await tx.scanLog.findMany({
      where: { eventCode: event.eventCode },
      orderBy: { scannedAt: "asc" },
      select: {
        id: true,
        invitationId: true,
        guestName: true,
        status: true,
        scannedAt: true,
        terminalCode: true,
        assignedTable: true,
      },
    });

    return { event, scanLogs };
  });
}

function buildWorkbook(exportData: EventExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "YambiPass";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = false;

  const metrics = calculateMetrics(exportData);
  addDashboardSheet(workbook, exportData, metrics);
  addDetailsSheet(workbook, exportData);

  return workbook;
}

function calculateMetrics({ event, scanLogs }: EventExportData) {
  const totalInvitations = event.invitations.length;
  const totalExpected = event.invitations.reduce(
    (sum, invitation) => sum + invitation.peopleCount,
    0,
  );
  const totalScanned = event.invitations.reduce(
    (sum, invitation) => sum + invitation.scannedCount,
    0,
  );
  const successScanLogs = scanLogs.filter((log) => log.status === "SUCCESS");
  const attendanceRate =
    totalExpected > 0 ? Math.min(totalScanned / totalExpected, 1) : 0;

  return {
    totalInvitations,
    totalExpected,
    totalScanned,
    successScanLogs,
    arrivalBuckets: buildArrivalBuckets(successScanLogs),
    attendanceRate,
  };
}

function addDashboardSheet(
  workbook: ExcelJS.Workbook,
  exportData: EventExportData,
  metrics: ReturnType<typeof calculateMetrics>,
) {
  const sheet = workbook.addWorksheet("Tableau de Bord");
  sheet.views = [{ showGridLines: true }];
  sheet.properties.defaultRowHeight = 20;

  [18, 18, 18, 18, 18, 18, 18, 18].forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = "YambiPass - Bilan statistique complet";
  sheet.getCell("A1").font = {
    bold: true,
    size: 18,
    color: { argb: COLORS.white },
  };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell("A1").fill = navyFill();
  sheet.getRow(1).height = 32;

  sheet.mergeCells("A2:H2");
  sheet.getCell("A2").value = exportData.event.name;
  sheet.getCell("A2").font = {
    bold: true,
    size: 14,
    color: { argb: COLORS.darkText },
  };
  sheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell("A2").fill = solidFill(COLORS.lightBlue);
  sheet.getRow(2).height = 26;

  addMetadataRow(sheet, 4, [
    ["Nom de l'evenement", exportData.event.name],
    ["Lieu", exportData.event.location],
    ["Date de l'evenement", formatDateTime(exportData.event.date)],
  ]);

  addKpiCard(sheet, 6, 1, "Total invitations creees", metrics.totalInvitations);
  addKpiCard(sheet, 6, 3, "Invites attendus", metrics.totalExpected);
  addKpiCard(sheet, 6, 5, "Personnes scannees", metrics.totalScanned);
  addKpiCard(
    sheet,
    6,
    7,
    "Taux de presence",
    { formula: "IF(C7=0,0,E7/C7)", result: metrics.attendanceRate },
    "0.00%",
  );

  sheet.mergeCells("A11:D11");
  sheet.getCell("A11").value = "Flux d'arrivee par tranche horaire";
  sheet.getCell("A11").font = {
    bold: true,
    size: 13,
    color: { argb: COLORS.white },
  };
  sheet.getCell("A11").fill = navyFill();
  sheet.getCell("A11").alignment = { horizontal: "center" };

  const flowHeaderRow = sheet.getRow(12);
  flowHeaderRow.values = [
    "Tranche horaire",
    "Scans SUCCESS",
    "% du flux",
    "Cumul",
  ];
  styleHeaderRow(flowHeaderRow, 4);

  let currentRow = 13;
  let cumulative = 0;
  const successTotal = metrics.successScanLogs.length;
  const showDate = hasMultipleArrivalDates(metrics.arrivalBuckets);

  if (metrics.arrivalBuckets.length === 0) {
    sheet.mergeCells(currentRow, 1, currentRow, 4);
    sheet.getCell(currentRow, 1).value = "Aucun scan SUCCESS enregistre";
    sheet.getCell(currentRow, 1).font = {
      italic: true,
      color: { argb: COLORS.mutedText },
    };
    sheet.getCell(currentRow, 1).alignment = { horizontal: "center" };
    applyRowStyle(sheet, currentRow, 1, 4, false);
  } else {
    metrics.arrivalBuckets.forEach((bucket, index) => {
      cumulative += bucket.count;
      const row = sheet.getRow(currentRow);
      row.values = [
        showDate ? `${bucket.dateLabel} ${bucket.rangeLabel}` : bucket.rangeLabel,
        bucket.count,
        successTotal > 0 ? bucket.count / successTotal : 0,
        cumulative,
      ];
      row.getCell(3).numFmt = "0.00%";
      applyRowStyle(sheet, currentRow, 1, 4, index % 2 === 0);
      currentRow += 1;
    });

    const totalRow = sheet.getRow(currentRow);
    totalRow.values = ["Total", successTotal, 1, successTotal];
    totalRow.getCell(3).numFmt = "0.00%";
    totalRow.font = { bold: true };
    applyRowStyle(sheet, currentRow, 1, 4, false);
  }

  sheet.autoFilter = {
    from: { row: 12, column: 1 },
    to: { row: Math.max(currentRow, 12), column: 4 },
  };
}

function addDetailsSheet(workbook: ExcelJS.Workbook, exportData: EventExportData) {
  const sheet = workbook.addWorksheet("Invites_Details");
  sheet.views = [{ state: "frozen", ySplit: 3, showGridLines: true }];
  sheet.properties.defaultRowHeight = 20;

  const columns = [
    { header: "Invitation ID", width: 16 },
    { header: "Nom Complet", width: 32 },
    { header: "Nombre de personnes", width: 22 },
    { header: "Telephone WhatsApp", width: 24 },
    { header: "Statut WhatsApp", width: 20 },
    { header: "Statut Presence", width: 20 },
    { header: "Table Assignee", width: 32 },
  ];

  columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = column.width;
  });

  sheet.mergeCells("A1:G1");
  sheet.getCell("A1").value = "Details des invites";
  sheet.getCell("A1").font = {
    bold: true,
    size: 16,
    color: { argb: COLORS.white },
  };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell("A1").fill = navyFill();
  sheet.getRow(1).height = 30;

  sheet.mergeCells("A2:G2");
  sheet.getCell("A2").value =
    `${exportData.event.name} - ${formatDateTime(exportData.event.date)}`;
  sheet.getCell("A2").font = {
    bold: true,
    color: { argb: COLORS.darkText },
  };
  sheet.getCell("A2").alignment = { horizontal: "center" };
  sheet.getCell("A2").fill = solidFill(COLORS.lightBlue);

  const headerRow = sheet.getRow(3);
  headerRow.values = columns.map((column) => column.header);
  styleHeaderRow(headerRow, columns.length);

  if (exportData.event.invitations.length === 0) {
    sheet.mergeCells("A4:G4");
    sheet.getCell("A4").value = "Aucune invitation";
    sheet.getCell("A4").alignment = { horizontal: "center" };
    sheet.getCell("A4").font = { italic: true, color: { argb: COLORS.mutedText } };
    applyRowStyle(sheet, 4, 1, columns.length, false);
  } else {
    exportData.event.invitations.forEach((invitation, index) => {
      const whatsappStatus = getWhatsappStatus(invitation);
      const presenceStatus =
        invitation.scannedCount > 0 ? STRINGS.present : STRINGS.absent;
      const rowNumber = 4 + index;
      const row = sheet.getRow(rowNumber);

      row.values = [
        invitation.id,
        invitation.label,
        invitation.peopleCount,
        invitation.whatsapp || "-",
        whatsappStatus,
        presenceStatus,
        getAssignedTablesLabel(invitation),
      ];

      applyRowStyle(sheet, rowNumber, 1, columns.length, index % 2 === 0);
      colorStatusCell(row.getCell(5), whatsappStatus);
      colorStatusCell(row.getCell(6), presenceStatus);
    });
  }

  const lastRow = Math.max(sheet.lastRow?.number ?? 3, 3);
  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: lastRow, column: columns.length },
  };
}

function addMetadataRow(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  values: Array<[string, string]>,
) {
  const cells = [
    ["A", "B", values[0]],
    ["D", "E", values[1]],
    ["G", "H", values[2]],
  ] as const;

  cells.forEach(([labelColumn, valueColumn, [label, value]]) => {
    const labelCell = sheet.getCell(`${labelColumn}${rowNumber}`);
    const valueCell = sheet.getCell(`${valueColumn}${rowNumber}`);

    labelCell.value = label;
    labelCell.font = { bold: true, color: { argb: COLORS.white } };
    labelCell.fill = navyFill();
    labelCell.alignment = { vertical: "middle" };
    labelCell.border = BORDER;

    valueCell.value = value;
    valueCell.font = { color: { argb: COLORS.darkText } };
    valueCell.fill = solidFill(COLORS.lightBlue);
    valueCell.alignment = { vertical: "middle", wrapText: true };
    valueCell.border = BORDER;
  });

  sheet.getRow(rowNumber).height = 28;
}

function addKpiCard(
  sheet: ExcelJS.Worksheet,
  topRow: number,
  leftColumn: number,
  label: string,
  value: ExcelJS.CellValue,
  numFmt?: string,
) {
  const rightColumn = leftColumn + 1;
  sheet.mergeCells(topRow, leftColumn, topRow, rightColumn);
  sheet.mergeCells(topRow + 1, leftColumn, topRow + 2, rightColumn);

  const labelCell = sheet.getCell(topRow, leftColumn);
  labelCell.value = label;
  labelCell.fill = navyFill();
  labelCell.font = { bold: true, color: { argb: COLORS.white }, size: 10 };
  labelCell.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };

  const valueCell = sheet.getCell(topRow + 1, leftColumn);
  valueCell.value = value;
  valueCell.fill = solidFill(COLORS.zebra);
  valueCell.font = { bold: true, size: 18, color: { argb: COLORS.darkText } };
  valueCell.alignment = { horizontal: "center", vertical: "middle" };
  if (numFmt) valueCell.numFmt = numFmt;

  applyRangeBorder(sheet, topRow, leftColumn, topRow + 2, rightColumn);
  sheet.getRow(topRow).height = 24;
  sheet.getRow(topRow + 1).height = 30;
  sheet.getRow(topRow + 2).height = 22;
}

function styleHeaderRow(row: ExcelJS.Row, columnCount: number) {
  row.height = 24;
  row.font = { bold: true, color: { argb: COLORS.white } };
  row.alignment = { horizontal: "center", vertical: "middle" };

  for (let column = 1; column <= columnCount; column += 1) {
    const cell = row.getCell(column);
    cell.fill = navyFill();
    cell.border = BORDER;
  }
}

function applyRowStyle(
  sheet: ExcelJS.Worksheet,
  rowNumber: number,
  startColumn: number,
  endColumn: number,
  useZebra: boolean,
) {
  for (let column = startColumn; column <= endColumn; column += 1) {
    const cell = sheet.getCell(rowNumber, column);
    cell.fill = useZebra ? solidFill(COLORS.zebra) : solidFill(COLORS.white);
    cell.border = BORDER;
    cell.alignment = {
      vertical: "middle",
      wrapText: column === 2 || column === 7,
      horizontal: column === 2 || column === 7 ? "left" : "center",
    };
    cell.font = { color: { argb: COLORS.darkText } };
  }
}

function applyRangeBorder(
  sheet: ExcelJS.Worksheet,
  topRow: number,
  leftColumn: number,
  bottomRow: number,
  rightColumn: number,
) {
  for (let row = topRow; row <= bottomRow; row += 1) {
    for (let column = leftColumn; column <= rightColumn; column += 1) {
      sheet.getCell(row, column).border = BORDER;
    }
  }
}

function colorStatusCell(cell: ExcelJS.Cell, value: string) {
  if (value === STRINGS.delivered || value === STRINGS.present) {
    cell.font = { bold: true, color: { argb: COLORS.green } };
    return;
  }

  if (value === STRINGS.failed || value === STRINGS.absent) {
    cell.font = { bold: true, color: { argb: COLORS.red } };
    return;
  }

  cell.font = { bold: true, color: { argb: COLORS.orange } };
}

function getWhatsappStatus(invitation: EventExportData["event"]["invitations"][number]) {
  if (invitation.isSentWhatsapp) return STRINGS.delivered;
  if (invitation.whatsapp?.trim()) return STRINGS.failed;
  return STRINGS.notSent;
}

function getAssignedTablesLabel(
  invitation: EventExportData["event"]["invitations"][number],
) {
  if (invitation.allocations.length === 0) return STRINGS.unassigned;

  return invitation.allocations
    .map((allocation) =>
      allocation.seatsAssigned > 1
        ? `${allocation.table.name} (${allocation.seatsAssigned})`
        : allocation.table.name,
    )
    .join(", ");
}

function buildArrivalBuckets(
  successScanLogs: EventExportData["scanLogs"],
): ArrivalBucket[] {
  const buckets = new Map<string, ArrivalBucket>();

  successScanLogs.forEach((log) => {
    const parts = getZonedDateParts(log.scannedAt);
    const hour = Number(parts.hour);
    const nextHour = (hour + 1) % 24;
    const sortKey = `${parts.year}-${parts.month}-${parts.day}-${parts.hour}`;
    const dateLabel = `${parts.day}/${parts.month}`;
    const rangeLabel = `${formatHour(hour)}-${formatHour(nextHour)}`;
    const bucket = buckets.get(sortKey);

    if (bucket) {
      bucket.count += 1;
      return;
    }

    buckets.set(sortKey, {
      sortKey,
      dateLabel,
      rangeLabel,
      count: 1,
    });
  });

  return [...buckets.values()].sort((a, b) =>
    a.sortKey.localeCompare(b.sortKey),
  );
}

function hasMultipleArrivalDates(buckets: ArrivalBucket[]) {
  return new Set(buckets.map((bucket) => bucket.dateLabel)).size > 1;
}

function getZonedDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  });

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<"year" | "month" | "day" | "hour", string>;
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}h`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: EVENT_TIME_ZONE,
  }).format(date);
}

function navyFill(): ExcelJS.Fill {
  return solidFill(COLORS.navy);
}

function solidFill(color: string): ExcelJS.Fill {
  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: color },
  };
}
