import cron from "node-cron";
import {
  processDailyStreaks,
  sendStreakReminders,
} from "./services/streakService";

/**
 * Sets up scheduled jobs for the application
 * @returns A Promise that resolves when all jobs are set up
 */
export const setupScheduledJobs = (): Promise<void> => {
  return Promise.resolve().then(() => {
    // Process streaks daily at midnight
    cron.schedule("0 0 * * *", () => {
      console.log("Running daily streak processing...");
      processDailyStreaks()
        .then(() =>
          console.log("Daily streak processing completed successfully"),
        )
        .catch((error) =>
          console.error("Error in daily streak processing:", error),
        );
    });

    // Send streak reminders at 8 PM for users who haven't logged activity
    cron.schedule("0 20 * * *", () => {
      console.log("Sending streak reminders...");
      sendStreakReminders()
        .then(() => console.log("Streak reminders sent successfully"))
        .catch((error) =>
          console.error("Error sending streak reminders:", error),
        );
    });
  });
};
