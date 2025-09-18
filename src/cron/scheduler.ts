import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables BEFORE importing other modules
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import * as cron from "node-cron";
import { fetchAndStoreFundingRates } from "./fetchFundingRates";

console.log("Starting funding rate cron scheduler...");

// Run immediately on startup
console.log("Running initial fetch...");
fetchAndStoreFundingRates().catch(console.error);

// Schedule to run every 15 minutes
// Cron expression: */15 * * * * means every 15 minutes
const task = cron.schedule(
  "*/15 * * * *",
  async () => {
    console.log(
      `[${new Date().toISOString()}] Running scheduled funding rate fetch...`
    );
    await fetchAndStoreFundingRates();
  },
  {
    scheduled: true,
    timezone: "UTC",
  }
);

// Start the cron job
task.start();

console.log("Cron job scheduled to run every 15 minutes");
console.log("Press Ctrl+C to stop");

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down cron scheduler...");
  task.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down cron scheduler...");
  task.stop();
  process.exit(0);
});
