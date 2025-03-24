import { EXERCISE_TYPE } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const challengeRouter = createTRPCRouter({
  /**
   * Create a new challenge
   */
  createChallenge: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3, "Name must be at least 3 characters"),
        description: z.string().optional(),
        type: z.enum([
          EXERCISE_TYPE.PUSH_UPS,
          EXERCISE_TYPE.RUNNING,
          EXERCISE_TYPE.SIT_UPS,
        ]),
        goalAmount: z.number().min(1, "Goal must be at least 1"),
        startDate: z.date(),
        endDate: z.date(),
        isPublic: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Validate dates
      if (input.startDate >= input.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "End date must be after start date",
        });
      }

      // Create the challenge
      const challenge = await ctx.db.challenge.create({
        data: {
          name: input.name,
          description: input.description,
          type: input.type,
          goalAmount: input.goalAmount,
          startDate: input.startDate,
          endDate: input.endDate,
          isPublic: input.isPublic,
          creatorId: userId,
        },
      });

      // Automatically add creator as participant
      await ctx.db.challengeParticipant.create({
        data: {
          challengeId: challenge.id,
          userId,
        },
      });

      return challenge;
    }),

  /**
   * Get all public challenges
   */
  getAllChallenges: protectedProcedure
    .input(
      z.object({
        activeOnly: z.boolean().default(true),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();

      const challenges = await ctx.db.challenge.findMany({
        where: {
          isPublic: true,
          ...(input.activeOnly && {
            startDate: { lte: now },
            endDate: { gte: now },
          }),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { startDate: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      });

      let nextCursor: typeof input.cursor = undefined;
      if (challenges.length > input.limit) {
        const nextItem = challenges.pop();
        nextCursor = nextItem?.id;
      }

      return {
        challenges,
        nextCursor,
      };
    }),

  /**
   * Get upcoming public challenges that haven't started yet
   */
  getUpcomingChallenges: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();

      const challenges = await ctx.db.challenge.findMany({
        where: {
          isPublic: true,
          startDate: { gt: now },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { startDate: "asc" },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      });

      let nextCursor: typeof input.cursor = undefined;
      if (challenges.length > input.limit) {
        const nextItem = challenges.pop();
        nextCursor = nextItem?.id;
      }

      return {
        challenges,
        nextCursor,
      };
    }),

  /**
   * Get challenges the user is participating in
   */
  getUserChallenges: protectedProcedure
    .input(
      z.object({
        activeOnly: z.boolean().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const now = new Date();

      return await ctx.db.challenge.findMany({
        where: {
          participants: {
            some: {
              userId,
            },
          },
          ...(input.activeOnly && {
            startDate: { lte: now },
            endDate: { gte: now },
          }),
        },
        include: {
          participants: {
            where: {
              userId,
            },
            select: {
              currentProgress: true,
              lastUpdated: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: { endDate: "asc" },
      });
    }),

  /**
   * Join an existing challenge
   */
  joinChallenge: protectedProcedure
    .input(
      z.object({
        challengeId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const now = new Date();

      // Check if challenge exists and is still open
      const challenge = await ctx.db.challenge.findUnique({
        where: { id: input.challengeId },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      if (challenge.endDate < now) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This challenge has already ended",
        });
      }

      try {
        // Add user as participant
        return await ctx.db.challengeParticipant.create({
          data: {
            challengeId: input.challengeId,
            userId,
          },
        });
      } catch (error) {
        // Handle unique constraint violation (user already joined)
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already joined this challenge",
        });
      }
    }),

  /**
   * Leave a challenge
   */
  leaveChallenge: protectedProcedure
    .input(
      z.object({
        challengeId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if user is in the challenge
      const participation = await ctx.db.challengeParticipant.findUnique({
        where: {
          challengeId_userId: {
            challengeId: input.challengeId,
            userId,
          },
        },
        include: {
          challenge: {
            select: {
              creatorId: true,
            },
          },
        },
      });

      if (!participation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "You are not participating in this challenge",
        });
      }

      // Don't allow the creator to leave if they created the challenge
      if (participation.challenge.creatorId === userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot leave a challenge you created",
        });
      }

      // Remove the participation
      await ctx.db.challengeParticipant.delete({
        where: {
          id: participation.id,
        },
      });

      return { success: true };
    }),

  /**
   * Get detailed info for a challenge including leaderboard
   */
  getChallengeDetails: protectedProcedure
    .input(
      z.object({
        challengeId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const challenge = await ctx.db.challenge.findUnique({
        where: { id: input.challengeId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
            orderBy: {
              currentProgress: "desc",
            },
          },
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Check if user is participating
      const isParticipating = challenge.participants.some(
        (p) => p.userId === userId,
      );

      // If challenge is private and user is not participating or the creator
      if (
        !challenge.isPublic &&
        !isParticipating &&
        challenge.creatorId !== userId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this challenge",
        });
      }

      return {
        ...challenge,
        isParticipating,
      };
    }),

  /**
   * Get active challenges for the current user with their progress
   */
  getActiveChallengesForUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();

    // Get user's active challenges with their progress
    const challenges = await ctx.db.challenge.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        participants: {
          where: {
            userId,
          },
          select: {
            currentProgress: true,
            lastUpdated: true,
          },
        },
      },
      orderBy: { endDate: "asc" },
    });

    // Format the response to include challenge details and user progress
    return challenges.map((challenge) => {
      const userProgress = challenge.participants[0];
      return {
        id: challenge.id,
        name: challenge.name,
        type: challenge.type,
        goalAmount: challenge.goalAmount,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        currentProgress: userProgress?.currentProgress ?? 0,
        lastUpdated: userProgress?.lastUpdated ?? new Date(),
      };
    });
  }),
});
