import cron from "node-cron";
import {
  processDailyStreaks,
  sendStreakReminders,
} from "./services/streakService";
import {
  updateChallengeLeaderboards,
  sendChallengeEndingNotifications,
  processCompletedChallenges,
} from "./services/challengeService";

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

    // Update challenge leaderboards daily at 2 AM
    cron.schedule("0 2 * * *", () => {
      console.log("Updating challenge leaderboards...");
      updateChallengeLeaderboards()
        .then(() => console.log("Challenge leaderboards updated successfully"))
        .catch((error) =>
          console.error("Error updating challenge leaderboards:", error),
        );
    });

    // Process completed challenges daily at 1 AM
    cron.schedule("0 1 * * *", () => {
      console.log("Processing completed challenges...");
      processCompletedChallenges()
        .then(() => console.log("Completed challenges processed successfully"))
        .catch((error) =>
          console.error("Error processing completed challenges:", error),
        );
    });

    // Send notifications for challenges ending soon at 10 AM
    cron.schedule("0 10 * * *", () => {
      console.log("Sending challenge ending notifications...");
      sendChallengeEndingNotifications()
        .then(() =>
          console.log("Challenge ending notifications sent successfully"),
        )
        .catch((error) =>
          console.error("Error sending challenge ending notifications:", error),
        );
    });
  });
};
