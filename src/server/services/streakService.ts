import { type Streak, type EXERCISE_TYPE } from "@prisma/client";
import { db } from "~/server/db";
import { isSameDay, isYesterday, startOfDay } from "date-fns";

/**
 * Retrieves streak data for a specific user
 */
export const getStreakData = async (userId: string): Promise<Streak | null> => {
  return await db.streak.findUnique({
    where: {
      userId,
    },
  });
};

/**
 * Updates a user's streak based on new activity
 */
export const updateStreak = async (
  userId: string,
  activityDate: Date = new Date(),
): Promise<Streak> => {
  const streak = await getStreakData(userId);

  if (!streak) {
    return await createNewStreak(userId, activityDate);
  }

  // If the user already logged activity today, keep streak the same
  if (isSameDay(streak.lastActivityDate, activityDate)) {
    return streak;
  }

  // If yesterday, increment streak
  if (isYesterday(streak.lastActivityDate)) {
    return await incrementStreak(streak, activityDate);
  }

  // If more than one day gap, check if streak freeze is available
  if (streak.isFrozen || streak.freezesAvailable > 0) {
    return await applyStreakFreeze(streak, activityDate);
  }

  // Otherwise reset streak
  return await resetStreak(streak, activityDate);
};

/**
 * Creates a new streak for a user
 */
export const createNewStreak = async (
  userId: string,
  activityDate: Date,
): Promise<Streak> => {
  return await db.streak.create({
    data: {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: activityDate,
      streakStartDate: activityDate,
      isFrozen: false,
      freezesAvailable: 0,
    },
  });
};

/**
 * Increments a user's streak
 */
export const incrementStreak = async (
  streak: Streak,
  activityDate: Date,
): Promise<Streak> => {
  const newCurrentStreak = streak.currentStreak + 1;
  const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);

  return await db.streak.update({
    where: { id: streak.id },
    data: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: activityDate,
      isFrozen: false,
    },
  });
};

/**
 * Resets a user's streak
 */
export const resetStreak = async (
  streak: Streak,
  activityDate: Date,
): Promise<Streak> => {
  return await db.streak.update({
    where: { id: streak.id },
    data: {
      currentStreak: 1,
      lastActivityDate: activityDate,
      streakStartDate: activityDate,
      isFrozen: false,
    },
  });
};

/**
 * Applies a streak freeze to maintain the current streak
 */
export const applyStreakFreeze = async (
  streak: Streak,
  activityDate: Date,
): Promise<Streak> => {
  if (streak.isFrozen) {
    // Already frozen, just update the activity date
    return await db.streak.update({
      where: { id: streak.id },
      data: {
        lastActivityDate: activityDate,
        isFrozen: false,
      },
    });
  } else if (streak.freezesAvailable > 0) {
    // Use a freeze
    return await db.streak.update({
      where: { id: streak.id },
      data: {
        freezesAvailable: streak.freezesAvailable - 1,
        lastActivityDate: activityDate,
        isFrozen: false,
      },
    });
  }

  // Fallback to reset if condition logic fails
  return await resetStreak(streak, activityDate);
};

/**
 * Awards streak freezes to a user
 */
export const awardStreakFreeze = async (
  userId: string,
  count: number,
): Promise<Streak> => {
  const streak = await getStreakData(userId);

  if (!streak) {
    return await createNewStreak(userId, new Date());
  }

  return await db.streak.update({
    where: { id: streak.id },
    data: {
      freezesAvailable: streak.freezesAvailable + count,
    },
  });
};

/**
 * Gets the activity calendar data for a given month
 */
export const getActivityCalendarData = async (
  userId: string,
  month: number,
  year: number,
): Promise<
  Array<{
    date: Date;
    exercises: Array<{ type: EXERCISE_TYPE; amount: number; unit: string }>;
  }>
> => {
  // Get all activity posts for the specified month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month

  const activityPosts = await db.activityPost.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      exercises: {
        select: {
          type: true,
          amount: true,
          unit: true,
        },
      },
    },
  });

  // Convert to array of dates with exercise details for calendar display
  return activityPosts.map((post) => ({
    date: startOfDay(post.createdAt),
    exercises: post.exercises.map((exercise) => ({
      type: exercise.type,
      amount: exercise.amount,
      unit: exercise.unit ?? "reps", // Default to "reps" if unit is null
    })),
  }));
};

/**
 * Processes all users' streaks for daily updates
 */
export const processDailyStreaks = async (): Promise<void> => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  // Find all streaks where the last activity was before yesterday
  const streaksToUpdate = await db.streak.findMany({
    where: {
      lastActivityDate: {
        lt: yesterday,
      },
      isFrozen: false,
    },
  });

  // Process each streak
  for (const streak of streaksToUpdate) {
    // If the user has freezes available, use one
    if (streak.freezesAvailable > 0) {
      await db.streak.update({
        where: { id: streak.id },
        data: {
          freezesAvailable: streak.freezesAvailable - 1,
          isFrozen: true,
        },
      });
    } else {
      // Reset the streak
      await db.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: 0,
          isFrozen: false,
        },
      });
    }
  }
};

/**
 * Sends streak reminders to users who haven't logged an activity today but have an active streak
 */
export const sendStreakReminders = async (): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find users with active streaks who haven't logged activity today
  const usersAtRisk = await db.streak.findMany({
    where: {
      currentStreak: { gt: 0 },
      lastActivityDate: {
        lt: today,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Create notifications for each user
  for (const userStreak of usersAtRisk) {
    await db.notification.create({
      data: {
        userId: userStreak.userId,
        type: "STREAK_REMINDER",
        title: "Maintain Your Streak!",
        content: `Don't forget to log an activity today to maintain your ${userStreak.currentStreak} day streak!`,
        isRead: false,
      },
    });

    // If streak is a milestone (7, 30, 100 days, etc.), add extra urgency
    if (
      userStreak.currentStreak === 7 ||
      userStreak.currentStreak === 14 ||
      userStreak.currentStreak === 21 ||
      userStreak.currentStreak === 30 ||
      userStreak.currentStreak === 100 ||
      userStreak.currentStreak === 365
    ) {
      await db.notification.create({
        data: {
          userId: userStreak.userId,
          type: "STREAK_MILESTONE_AT_RISK",
          title: "Milestone Streak at Risk!",
          content: `Your ${userStreak.currentStreak} day streak milestone is at risk! Log an activity today to maintain it!`,
          isRead: false,
        },
      });
    }
  }
};
