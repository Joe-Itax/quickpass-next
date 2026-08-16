import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { terminalCode, sessionToken } = await req.json();

    if (terminalCode) {
      const terminal = await prisma.terminal.findFirst({
        where: { code: terminalCode },
      });

      if (terminal) {
        // Reset the active session
        await prisma.terminal.update({
          where: { id: terminal.id },
          data: {
            isSessionActive: false,
            sessionToken: null,
          },
        });
      }
    } else if (sessionToken) {
      await prisma.terminal.updateMany({
        where: { sessionToken },
        data: {
          isSessionActive: false,
          sessionToken: null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur logout terminal:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
