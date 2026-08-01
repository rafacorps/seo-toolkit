// Dipanggil Next.js sekali saat server start (butuh experimental.instrumentationHook).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler")
    startScheduler()
  }
}
