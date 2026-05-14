import { CronJob } from "cron";
import { prisma } from "@/lib/prisma";

// Couleurs pour la console
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const red = "\x1b[31m";
const reset = "\x1b[0m";

export const runEventSystemChecks = async () => {
  const now = new Date();

  // Délais de purge
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  console.log(
    `${cyan}[CRON SYSTEM] Checking system health at ${now.toLocaleTimeString()}${reset}`,
  );

  try {
    // --- 1. GESTION DES STATUTS (UPCOMING -> ONGOING) ---
    const upcomingToStart = await prisma.event.findMany({
      where: { status: "UPCOMING", date: { lte: now }, deletedAt: null },
      select: { name: true, id: true },
    });

    if (upcomingToStart.length > 0) {
      await prisma.event.updateMany({
        where: { id: { in: upcomingToStart.map((e) => e.id) } },
        data: { status: "ONGOING" },
      });
      upcomingToStart.forEach((e) =>
        console.log(
          `${green}[START] 🚀 Event "${e.name}" is now ONGOING${reset}`,
        ),
      );
    }

    // --- 2. GESTION DES STATUTS (ONGOING -> FINISHED) ---
    const ongoingEvents = await prisma.event.findMany({
      where: { status: "ONGOING", deletedAt: null },
    });

    let finishedCount = 0;
    for (const event of ongoingEvents) {
      const endDateTime = new Date(
        event.date.getTime() + event.durationHours * 60 * 60 * 1000,
      );
      if (now >= endDateTime) {
        await prisma.event.update({
          where: { id: event.id },
          data: { status: "FINISHED" },
        });
        console.log(
          `${yellow}[FINISH] 🏁 Event "${event.name}" is now FINISHED${reset}`,
        );
        finishedCount++;
      }
    }

    // --- 3. PURGE DES ÉVÉNEMENTS (Supprimés OU Annulés > 30 jours) ---
    const eventsToPurge = await prisma.event.findMany({
      where: {
        OR: [
          { deletedAt: { lte: thirtyDaysAgo } },
          { status: "CANCELLED", updatedAt: { lte: thirtyDaysAgo } },
        ],
      },
      select: { name: true, id: true, status: true },
    });

    if (eventsToPurge.length > 0) {
      await prisma.event.deleteMany({
        where: { id: { in: eventsToPurge.map((e) => e.id) } },
      });
      eventsToPurge.forEach((e) =>
        console.log(
          `${red}[PURGE EVENT] 🗑️ "${e.name}" (${e.status}) deleted permanently${reset}`,
        ),
      );
    }

    // --- 4. PURGE DES TERMINAUX ARCHIVÉS (> 5 jours) ---
    const terminalsToPurge = await prisma.terminal.findMany({
      where: { deletedAt: { lte: fiveDaysAgo } },
      select: { name: true, id: true },
    });

    if (terminalsToPurge.length > 0) {
      await prisma.terminal.deleteMany({
        where: { id: { in: terminalsToPurge.map((t) => t.id) } },
      });
      terminalsToPurge.forEach((t) =>
        console.log(
          `${red}[PURGE TERMINAL] 📱 Terminal "${t.name}" deleted permanently${reset}`,
        ),
      );
    }

    // --- RÉSUMÉ ---
    if (
      !upcomingToStart.length &&
      !finishedCount &&
      !eventsToPurge.length &&
      !terminalsToPurge.length
    ) {
      console.log("[CRON] No maintenance required.");
    }

    return {
      started: upcomingToStart.length,
      finished: finishedCount,
      purgedEvents: eventsToPurge.length,
      purgedTerminals: terminalsToPurge.length,
    };
  } catch (error) {
    console.error(`${red}[CRON_LOGIC_ERROR]${reset}`, error);
    return { error: true };
  }
};

const globalForCron = global as unknown as { eventJob: CronJob | undefined };

export const initCron = () => {
  if (globalForCron.eventJob) return;

  try {
    globalForCron.eventJob = CronJob.from({
      cronTime: "*/5 * * * *",
      onTick: async () => {
        await runEventSystemChecks();
      },
      start: true,
      timeZone: "Africa/Kinshasa",
    });
    console.log(`${green}[CRON] 🚀 Scheduler running (5min interval)${reset}`);
  } catch (e) {
    console.error("[CRON_INIT_ERROR]", e);
  }
};
