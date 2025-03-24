import { setupScheduledJobs } from "./scheduled-jobs";

console.log("Starting scheduled jobs service...");
void setupScheduledJobs();
console.log("Scheduled jobs service running. Press Ctrl+C to exit.");
