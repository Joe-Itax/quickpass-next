import { NextResponse } from "next/server";
import { runEventSystemChecks } from "@/lib/cron-scheduler";

export const dynamic = "force-dynamic"; // Important pour Vercel

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  // Sécurité Vercel
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const stats = await runEventSystemChecks();
    return NextResponse.json({ success: true, ...stats });
  } catch (error) {
    console.error("Error running event system checks:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
