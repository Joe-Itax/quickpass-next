import { prisma } from "@/lib/prisma";
import { qrDecode } from "@/lib/qr";

export type ScanSuccess = {
  status: "ok";
  invitation: {
    label: string;
    peopleCount: number;
    scannedCount: number;
    assignedTable: string;
  };
};

export type ScanError = {
  status: "error";
  httpStatus: number;
  error: string;
  invitation?: {
    label: string;
    scannedCount: number;
    peopleCount: number;
    assignedTable: string;
  };
};

export type ScanResult = ScanSuccess | ScanError;

type ProcessEventScanOptions = {
  scannedAt?: number;
};

export async function processEventScan(
  eventCode: string,
  qr: string,
  terminalCode: string,
  options: ProcessEventScanOptions = {},
): Promise<ScanResult> {
  const scannedAt = options.scannedAt ? new Date(options.scannedAt) : undefined;

  const terminal = await prisma.terminal.findUnique({
    where: { code: terminalCode },
  });

  if (!terminal || !terminal.isActive || terminal.deletedAt) {
    return {
      status: "error",
      httpStatus: 403,
      error: "Ce terminal est désactivé ou n'existe plus.",
    };
  }

  const eventToScan = await prisma.event.findUnique({
    where: { eventCode },
  });

  if (!eventToScan) {
    return {
      status: "error",
      httpStatus: 404,
      error: "L'event n'existe pas",
    };
  }

  if (terminal.eventId !== eventToScan.id) {
    await prisma.scanLog.create({
      data: {
        eventCode,
        status: "ERROR",
        errorMessage: "Terminal hors evenement",
        terminalCode,
        terminalId: terminal.id,
        scannedAt,
      },
    });
    return {
      status: "error",
      httpStatus: 403,
      error: "Terminal non autorise pour cet evenement",
    };
  }

  let payload: unknown;
  try {
    payload = await qrDecode(qr);
  } catch {
    await prisma.scanLog.create({
      data: {
        eventCode,
        status: "ERROR",
        errorMessage: "QR Decode Failed",
        terminalCode,
        terminalId: terminal.id,
        scannedAt,
      },
    });
    return {
      status: "error",
      httpStatus: 400,
      error: "Invalid QR payload",
    };
  }

  const { invitationId, eventId: payloadEventId } = payload as {
    invitationId?: number | string;
    eventId?: number | string;
  };

  if (Number(payloadEventId) !== eventToScan.id) {
    await prisma.scanLog.create({
      data: {
        eventCode,
        status: "ERROR",
        errorMessage: "QR n'appartenant pas à cet événement.",
        terminalCode,
        terminalId: terminal.id,
        scannedAt,
      },
    });
    return {
      status: "error",
      httpStatus: 400,
      error: "QR n'appartenant pas à cet événement.",
    };
  }

  const res = await prisma.$transaction(async (tx) => {
    const inv = await tx.invitation.findUnique({
      where: { id: Number(invitationId) },
      include: { allocations: { include: { table: true } } },
    });

    if (!inv) return { status: "not_found" as const };

    if (inv.scannedCount >= inv.peopleCount) {
      await tx.scanLog.create({
        data: {
          eventCode,
          invitationId: inv.id,
          guestName: inv.label,
          status: "ERROR",
          errorMessage: "Capacité atteinte",
          terminalCode,
          terminalId: terminal.id,
          scannedAt,
        },
      });

      const uniqueTables = Array.from(
        new Set(inv.allocations.map((a) => a.table.name)),
      ).join(", ");

      return {
        status: "full" as const,
        invitation: {
          label: inv.label,
          scannedCount: inv.scannedCount,
          peopleCount: inv.peopleCount,
          assignedTable: uniqueTables,
        },
      };
    }

    let assignedTableLabel = "Espace libre";
    const currentScanIndex = inv.scannedCount;
    let tracker = 0;

    for (const alloc of inv.allocations) {
      tracker += alloc.seatsAssigned;
      if (currentScanIndex < tracker) {
        assignedTableLabel = alloc.table.name;
        break;
      }
    }

    const updated = await tx.invitation.update({
      where: { id: inv.id },
      data: { scannedCount: { increment: 1 } },
    });

    await tx.scanLog.create({
      data: {
        eventCode,
        invitationId: inv.id,
        guestName: inv.label,
        status: "SUCCESS",
        terminalCode,
        terminalId: terminal.id,
        assignedTable: assignedTableLabel,
        scannedAt,
      },
    });

    await tx.eventStats.update({
      where: { eventId: eventToScan.id },
      data: { totalScanned: { increment: 1 } },
    });

    return {
      status: "ok" as const,
      invitation: {
        label: updated.label,
        peopleCount: updated.peopleCount,
        scannedCount: updated.scannedCount,
        assignedTable: assignedTableLabel,
      },
    };
  });

  if (res.status === "not_found") {
    await prisma.scanLog.create({
      data: {
        eventCode,
        status: "ERROR",
        errorMessage: "Invitation not found",
        terminalCode,
        terminalId: terminal.id,
        scannedAt,
      },
    });
    return {
      status: "error",
      httpStatus: 404,
      error: "Invitation not found",
    };
  }

  if (res.status === "full") {
    return {
      status: "error",
      httpStatus: 400,
      error: "Capacité atteinte",
      invitation: res.invitation,
    };
  }

  return { status: "ok", invitation: res.invitation };
}

/** Crée un ScanLog côté serveur (sync des tentatives offline — succès ou erreur) */
export async function createScanLogFromClient(input: {
  eventCode: string;
  terminalCode: string;
  status: "SUCCESS" | "ERROR";
  guestName?: string;
  errorMessage?: string;
  invitationId?: number;
  assignedTable?: string;
  scannedAt?: number;
}) {
  const terminal = await prisma.terminal.findUnique({
    where: { code: input.terminalCode },
    include: { event: { select: { eventCode: true } } },
  });

  if (!terminal || !terminal.isActive || terminal.deletedAt) {
    return { ok: false as const, error: "Terminal invalide" };
  }

  if (terminal.event.eventCode !== input.eventCode) {
    return { ok: false as const, error: "Terminal hors evenement" };
  }

  await prisma.scanLog.create({
    data: {
      eventCode: input.eventCode,
      terminalCode: input.terminalCode,
      terminalId: terminal.id,
      invitationId: input.invitationId,
      guestName: input.guestName,
      status: input.status,
      errorMessage: input.errorMessage,
      assignedTable: input.assignedTable,
      scannedAt: input.scannedAt ? new Date(input.scannedAt) : undefined,
    },
  });

  return { ok: true as const };
}
