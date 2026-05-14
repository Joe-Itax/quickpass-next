import { NextResponse } from "next/server";
import { runEventSystemChecks } from "@/lib/cron-scheduler";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  // Sécurité pour la production (Vercel Cron)
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const stats = await runEventSystemChecks();

    // Si la fonction a retourné une erreur interne
    if ("error" in stats) {
      return NextResponse.json(
        { success: false, message: "Internal logic error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...stats,
    });
  } catch (error) {
    console.error("Critical error in Cron Route:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
