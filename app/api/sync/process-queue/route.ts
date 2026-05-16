/**
 * API: Process Offline Queue
 * POST /api/sync/process-queue
 *
 * Traite les opérations en attente depuis le client
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrNull } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Vérifier la session
    const session = await getSessionOrNull(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const user = session.user;

    // Récupérer les opérations depuis le body
    const { operations } = await req.json();

    if (!Array.isArray(operations)) {
      return NextResponse.json(
        { error: "Operations must be an array" },
        { status: 400 },
      );
    }

    const results = [];
    const errors = [];

    for (const operation of operations) {
      try {
        const { type, resource, resourceId, data } = operation;

        let result;

        // Traiter selon le type de ressource
        switch (resource) {
          case "invitations":
            if (type === "UPDATE") {
              result = await prisma.invitation.update({
                where: { id: Number(resourceId) },
                data: data,
              });
            } else if (type === "DELETE") {
              result = await prisma.invitation.delete({
                where: { id: Number(resourceId) },
              });
            }
            break;

          case "events":
            if (type === "UPDATE") {
              result = await prisma.event.update({
                where: { id: Number(resourceId) },
                data: data,
              });
            }
            break;

          case "tables":
            if (type === "UPDATE") {
              result = await prisma.table.update({
                where: { id: Number(resourceId) },
                data: data,
              });
            } else if (type === "DELETE") {
              result = await prisma.table.delete({
                where: { id: Number(resourceId) },
              });
            }
            break;

          default:
            throw new Error(`Unknown resource: ${resource}`);
        }

        results.push({
          operationId: operation.id,
          success: true,
          result,
        });
      } catch (err) {
        errors.push({
          operationId: operation.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: results.length > 0 && errors.length === 0,
      synced: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (err) {
    console.error("[SYNC_QUEUE_ERROR]", err);
    return NextResponse.json(
      {
        error: "Failed to process queue",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
