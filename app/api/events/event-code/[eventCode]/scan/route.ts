import { NextRequest, NextResponse } from "next/server";
import { processEventScan } from "@/lib/scan-service";

export const dynamic = "force-dynamic";

interface EventContext {
  params: Promise<{
    eventCode: string;
  }>;
}

export async function POST(req: NextRequest, context: EventContext) {
  const { eventCode } = await context.params;

  try {
    const { qr, terminalCode } = await req.json();
    if (!qr || !terminalCode) {
      return NextResponse.json(
        { error: "qr or terminalCode missing" },
        { status: 400 },
      );
    }

    const result = await processEventScan(eventCode, qr, terminalCode);

    if (result.status === "ok") {
      return NextResponse.json(result.invitation);
    }

    return NextResponse.json(
      {
        error: result.error,
        invitation: result.invitation,
      },
      { status: result.httpStatus },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error scanning", details: String(err) },
      { status: 500 },
    );
  }
}
