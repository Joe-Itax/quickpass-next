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

  console.log(
    `${cyan}[CRON SYSTEM] Checking events at ${now.toLocaleTimeString()}${reset}`,
  );

  try {
    // 1. UPCOMING -> ONGOING
    // On récupère les noms avant pour le log
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

    // 2. ONGOING -> FINISHED
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

    // 3. PURGE DÉFINITIVE (30 jours après deletedAt)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // On récupère les noms pour le log avant la suppression
    const toPurge = await prisma.event.findMany({
      where: { deletedAt: { lte: thirtyDaysAgo } },
      select: { name: true, id: true },
    });

    if (toPurge.length > 0) {
      await prisma.event.deleteMany({
        where: { id: { in: toPurge.map((e) => e.id) } },
      });
      toPurge.forEach((e) =>
        console.log(
          `${red}[PURGE] 🗑️ Event "${e.name}" (and all related data) permanently deleted${reset}`,
        ),
      );
    }

    // Log de résumé si rien ne s'est passé
    if (
      upcomingToStart.length === 0 &&
      finishedCount === 0 &&
      toPurge.length === 0
    ) {
      console.log("[CRON] No changes detected.");
    }

    return {
      started: upcomingToStart.length,
      finished: finishedCount,
      purged: toPurge.length,
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
      cronTime: "*/1 * * * *",
      onTick: async () => {
        await runEventSystemChecks();
      },
      start: true,
      timeZone: "Africa/Kinshasa",
    });
    console.log(
      `${green}[CRON] 🚀 Scheduler started successfully (1min interval)${reset}`,
    );
  } catch (e) {
    console.error("[CRON_INIT_ERROR]", e);
  }
};
