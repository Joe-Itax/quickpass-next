import { NextRequest, NextResponse } from "next/server";
import {
  createScanLogFromClient,
  processEventScan,
} from "@/lib/scan-service";

export const dynamic = "force-dynamic";

interface ScanPayload {
  clientId: string;
  kind: "entry" | "log";
  scanStatus: "SUCCESS" | "ERROR";
  qr?: string;
  terminalCode: string;
  eventCode: string;
  guestName?: string;
  errorMessage?: string;
  invitationId?: number;
  assignedTable?: string;
  scannedAt: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scans = body.scans as ScanPayload[];

    if (!Array.isArray(scans) || scans.length === 0) {
      return NextResponse.json(
        { error: "scans must be a non-empty array" },
        { status: 400 },
      );
    }

    const results: Array<{
      clientId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const scan of scans) {
      try {
        if (scan.kind === "log" || scan.scanStatus === "ERROR") {
          const result = await createScanLogFromClient({
            eventCode: scan.eventCode,
            terminalCode: scan.terminalCode,
            status: scan.scanStatus,
            guestName: scan.guestName,
            errorMessage: scan.errorMessage,
            invitationId: scan.invitationId,
            assignedTable: scan.assignedTable,
            scannedAt: scan.scannedAt,
          });

          results.push({
            clientId: scan.clientId,
            success: result.ok,
            error: result.ok ? undefined : result.error,
          });
          continue;
        }

        if (!scan.qr) {
          results.push({
            clientId: scan.clientId,
            success: false,
            error: "QR manquant pour la synchronisation",
          });
          continue;
        }

        const result = await processEventScan(
          scan.eventCode,
          scan.qr,
          scan.terminalCode,
          { scannedAt: scan.scannedAt },
        );

        if (result.status === "ok") {
          results.push({ clientId: scan.clientId, success: true });
        } else {
          // Capacité atteinte ou autre : le scan offline a peut-être déjà été compté côté serveur
          results.push({
            clientId: scan.clientId,
            success: result.httpStatus === 400,
            error: result.error,
          });
        }
      } catch (err) {
        results.push({
          clientId: scan.clientId,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: results.every((r) => r.success),
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (err) {
    console.error("[SYNC_SCANS]", err);
    return NextResponse.json(
      { error: "Failed to sync scans" },
      { status: 500 },
    );
  }
}
