import { PrismaClient, EXERCISE_TYPE } from "@prisma/client";
import { sendNotification } from "./notificationService";

const prisma = new PrismaClient();

/**
 * Updates leaderboards for all active challenges
 * @returns Promise resolving when all challenge leaderboards have been updated
 */
export const updateChallengeLeaderboards = async (): Promise<void> => {
  const now = new Date();

  // Find all active challenges
  const activeChallenge = await prisma.challenge.findMany({
    where: {
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  console.log(
    `Updating leaderboards for ${activeChallenge.length} active challenges`,
  );

  // Process each challenge
  for (const challenge of activeChallenge) {
    try {
      // Sort participants by progress
      const sortedParticipants = [...challenge.participants].sort(
        (a, b) => b.currentProgress - a.currentProgress,
      );

      console.log(
        `Challenge ${challenge.name}: Updated leaderboard with ${sortedParticipants.length} participants`,
      );
    } catch (error) {
      console.error(
        `Error updating leaderboard for challenge ${challenge.id}:`,
        error,
      );
    }
  }
};

/**
 * Sends notifications for challenges that are about to end
 * @returns Promise resolving when all notifications have been sent
 */
export const sendChallengeEndingNotifications = async (): Promise<void> => {
  const now = new Date();
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find challenges ending in the next 24 hours
  const endingSoonChallenges = await prisma.challenge.findMany({
    where: {
      endDate: {
        gte: now,
        lte: oneDayFromNow,
      },
    },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  console.log(
    `Found ${endingSoonChallenges.length} challenges ending within 24 hours`,
  );

  // Send notifications to participants
  for (const challenge of endingSoonChallenges) {
    for (const participant of challenge.participants) {
      try {
        await sendNotification({
          userId: participant.userId,
          type: "CHALLENGE_ENDING_SOON",
          title: "Challenge Ending Soon",
          content: `The "${challenge.name}" challenge is ending in less than 24 hours. Make your final push!`,
        });
      } catch (error) {
        console.error(
          `Error sending notification to user ${participant.userId}:`,
          error,
        );
      }
    }
  }
};

/**
 * Closes expired challenges and announces winners
 * @returns Promise resolving when all expired challenges have been processed
 */
export const processCompletedChallenges = async (): Promise<void> => {
  const now = new Date();

  // Find challenges that just ended
  const completedChallenges = await prisma.challenge.findMany({
    where: {
      endDate: {
        lt: now,
      },
      // Add a field to track if winners have been announced
      winnersAnnounced: false,
    },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
      creator: true,
    },
  });

  console.log(`Processing ${completedChallenges.length} completed challenges`);

  for (const challenge of completedChallenges) {
    try {
      // Sort participants by progress
      const sortedParticipants = [...challenge.participants].sort(
        (a, b) => b.currentProgress - a.currentProgress,
      );

      // Determine winners (top performer)
      const winner = sortedParticipants[0];

      if (winner) {
        // Notify all participants about the winner
        for (const participant of challenge.participants) {
          const isWinner = participant.userId === winner.userId;

          await sendNotification({
            userId: participant.userId,
            type: isWinner ? "CHALLENGE_WON" : "CHALLENGE_COMPLETED",
            title: isWinner ? "You Won a Challenge!" : "Challenge Completed",
            content: isWinner
              ? `Congratulations! You won the "${challenge.name}" challenge!`
              : `The "${challenge.name}" challenge has ended. ${
                  winner.user.name ?? winner.user.username ?? "A user"
                } won with ${
                  winner.currentProgress
                } ${challenge.type.toLowerCase()}!`,
          });
        }

        // Notify the creator if they're not a participant
        const creatorIsParticipant = challenge.participants.some(
          (p) => p.userId === challenge.creatorId,
        );

        if (!creatorIsParticipant) {
          await sendNotification({
            userId: challenge.creatorId,
            type: "CHALLENGE_COMPLETED",
            title: "Your Challenge Completed",
            content: `Your challenge "${challenge.name}" has ended. ${
              winner.user.name ?? winner.user.username ?? "A user"
            } won with ${
              winner.currentProgress
            } ${challenge.type.toLowerCase()}!`,
          });
        }

        // Mark challenge as having announced winners
        await prisma.challenge.update({
          where: { id: challenge.id },
          data: { winnersAnnounced: true },
        });
      }

      console.log(`Processed completion of challenge: ${challenge.name}`);
    } catch (error) {
      console.error(
        `Error processing completion for challenge ${challenge.id}:`,
        error,
      );
    }
  }
};

/**
 * Updates a participant's progress in a challenge based on a logged exercise
 * @param userId The ID of the user who logged the exercise
 * @param exerciseType The type of exercise logged
 * @param amount The amount of exercise logged
 * @returns Promise resolving when progress has been updated
 */
export const updateChallengeProgress = async (
  userId: string,
  exerciseType: EXERCISE_TYPE,
  amount: number,
): Promise<void> => {
  const now = new Date();

  // Find active challenges the user is participating in that match the exercise type
  const relevantChallenges = await prisma.challengeParticipant.findMany({
    where: {
      userId,
      challenge: {
        type: exerciseType,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    },
    include: {
      challenge: true,
    },
  });

  if (relevantChallenges.length === 0) return;

  console.log(
    `Updating progress for user ${userId} in ${relevantChallenges.length} challenges`,
  );

  // Update progress for each relevant challenge
  for (const participation of relevantChallenges) {
    try {
      const newProgress = participation.currentProgress + amount;

      // Update progress
      await prisma.challengeParticipant.update({
        where: {
          id: participation.id,
        },
        data: {
          currentProgress: newProgress,
          lastUpdated: now,
        },
      });

      // Check if goal reached
      if (
        participation.currentProgress < participation.challenge.goalAmount &&
        newProgress >= participation.challenge.goalAmount
      ) {
        // User just reached the goal
        await sendNotification({
          userId,
          type: "CHALLENGE_GOAL_REACHED",
          title: "Challenge Goal Reached!",
          content: `You've reached your goal in the "${participation.challenge.name}" challenge! Keep going to secure your position!`,
        });
      }

      console.log(
        `Updated progress for user ${userId} in challenge ${participation.challenge.name} to ${newProgress}`,
      );
    } catch (error) {
      console.error(
        `Error updating progress for user ${userId} in challenge ${participation.challenge.id}:`,
        error,
      );
    }
  }
};
