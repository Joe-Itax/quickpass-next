export async function register() {
  // On s'assure que le code ne s'exécute que côté serveur Node.js
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initCron } = await import("@/lib/cron-scheduler");
    initCron();
  }
}
