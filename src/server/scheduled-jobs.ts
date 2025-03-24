import cron from "node-cron";
import {
  processDailyStreaks,
  sendStreakReminders,
} from "./services/streakService";

/**
 * Sets up scheduled jobs for the application
 */
export const setupScheduledJobs = (): void => {
  // Process streaks daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily streak processing...");
    try {
      await processDailyStreaks();
      console.log("Daily streak processing completed successfully");
    } catch (error) {
      console.error("Error in daily streak processing:", error);
    }
  });

  // Send streak reminders at 8 PM for users who haven't logged activity
  cron.schedule("0 20 * * *", async () => {
    console.log("Sending streak reminders...");
    try {
      await sendStreakReminders();
      console.log("Streak reminders sent successfully");
    } catch (error) {
      console.error("Error sending streak reminders:", error);
    }
  });
};
