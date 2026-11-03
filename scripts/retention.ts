import "./_env";
const { runRetention } = await import("@/lib/retention");
const result = await runRetention();
console.log("✓ Retenção executada:", result);
process.exit(0);
