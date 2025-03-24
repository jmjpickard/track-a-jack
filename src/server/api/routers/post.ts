import { EXERCISE_TYPE } from "@prisma/client";
import { groupBy } from "lodash";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { updateStreak } from "~/server/services/streakService";
import { updateChallengeProgress } from "~/server/services/challengeService";
import { getWeekNumber } from "~/components/WeekView";

export const postRouter = createTRPCRouter({
  addExercise: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "PUSH_UPS",
          "RUNNING",
          "SIT_UPS",
          "SWIMMING",
          "CYCLING",
          "PULL_UPS",
        ]),
        amount: z.number(),
        unit: z.string(),
        week: z.number(), // Keep for backward compatibility, but will be overridden
        year: z.number(), // Keep for backward compatibility, but will be overridden
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        // Calculate current week and year
        const now = new Date();
        const currentWeek = getWeekNumber(now);
        const currentYear = now.getFullYear();

        // Create exercise - override week/year with current values
        const result = await ctx.db.exercise.create({
          data: {
            type: input.type,
            amount: input.amount,
            unit: input.unit,
            week: currentWeek,
            year: currentYear,
            createdById: userId,
          },
        });

        // Get or create activity post group for today
        const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

        // Find recent activity post
        const recentPost = await ctx.db.activityPost.findFirst({
          where: {
            userId,
            createdAt: {
              gte: threeHoursAgo,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (recentPost) {
          // Add exercise to existing post
          await ctx.db.exercise.update({
            where: { id: result.id },
            data: {
              activityPostId: recentPost.id,
            },
          });
        } else {
          // Create new activity post
          const post = await ctx.db.activityPost.create({
            data: {
              userId,
              groupTime: now,
            },
          });

          // Associate exercise with post
          await ctx.db.exercise.update({
            where: { id: result.id },
            data: {
              activityPostId: post.id,
            },
          });
        }

        // Update user's streak
        await updateStreak(userId);

        // Update challenge progress
        await updateChallengeProgress(userId, input.type, input.amount).catch(
          (error) => {
            console.error("Error updating challenge progress:", error);
            // We don't want to fail the whole request if challenge update fails
          },
        );

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add exercise",
          cause: error,
        });
      }
    }),

  // Get exercises for the current day
  getExerciseByDay: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return ctx.db.exercise.groupBy({
      by: ["type"],
      _sum: {
        amount: true,
      },
      where: {
        createdById: userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }),

  // Get recent activity posts
  getRecentActivityPosts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        return await ctx.db.activityPost.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: input.limit,
          include: {
            exercises: {
              select: {
                id: true,
                type: true,
                amount: true,
                unit: true,
              },
            },
          },
        });
      } catch (error) {
        console.error("Error in getRecentActivityPosts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch recent activity posts",
        });
      }
    }),

  // Keep existing endpoints below
  getExerciseByWeek: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        week: z.number(),
      }),
    )
    .query(({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const calculation = ctx.db.exercise.groupBy({
        by: ["type"],
        _sum: {
          amount: true,
        },
        where: {
          createdById: userId,
          week: input.week,
          year: input.year,
        },
      });
      return calculation;
    }),
  allExerciseByWeek: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const calculation = await ctx.db.exercise.groupBy({
      by: ["type", "week"],
      _sum: {
        amount: true,
      },
      where: {
        createdById: userId,
      },
    });
    const group = groupBy(calculation, "type");

    return group;
  }),
  exerciseByUser: protectedProcedure
    .input(
      z.object({
        exerciseType: z.enum([
          "PUSH_UPS",
          "RUNNING",
          "SIT_UPS",
          "SWIMMING",
          "CYCLING",
          "PULL_UPS",
        ]),
        maxWeek: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const groupedData = await ctx.db.exercise.groupBy({
        by: ["createdById"],
        _sum: {
          amount: true,
        },
        where: {
          type: input.exerciseType,
          week: { lte: input.maxWeek },
        },
        orderBy: { _sum: { amount: "desc" } },
      });
      const groupedDataWithName = groupedData.map(async (data) => {
        const user = await ctx.db.user.findFirst({
          where: { id: data.createdById },
        });
        const firstName = user?.name?.split(" ")[0];
        return {
          ...data,
          userName: firstName,
          photo: user?.image,
        };
      });
      return Promise.all(groupedDataWithName);
    }),

  // Feed related procedures
  getFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.number().nullish(), // For pagination
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        // For debugging - check if tables exist
        console.log("Available Prisma models:", Object.keys(ctx.db));

        // Get user's friends
        const friendships = await ctx.db.friendship.findMany({
          where: {
            OR: [{ userId }, { friendId: userId }],
          },
          select: {
            userId: true,
            friendId: true,
          },
        });

        // Extract friend IDs
        const friendIds = friendships.map((friendship) =>
          friendship.userId === userId
            ? friendship.friendId
            : friendship.userId,
        );

        // Include the user's own posts in the feed
        friendIds.push(userId);

        // Get activity posts from friends and own posts
        const posts = await ctx.db.activityPost.findMany({
          where: {
            userId: { in: friendIds },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: input.limit + 1, // Take an extra item to determine if there's more
          cursor: input.cursor ? { id: input.cursor } : undefined,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
            exercises: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        });

        let nextCursor: typeof input.cursor = undefined;
        if (posts.length > input.limit) {
          const nextItem = posts.pop();
          nextCursor = nextItem?.id;
        }

        return {
          posts,
          nextCursor,
        };
      } catch (error) {
        console.error("Error in getFeed:", error);
        return {
          posts: [],
          nextCursor: undefined,
        };
      }
    }),

  // Get a single activity post by ID
  getActivityPost: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const post = await ctx.db.activityPost.findUnique({
          where: { id: input.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
            exercises: true,
          },
        });

        if (!post) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Activity post not found",
          });
        }

        return post;
      } catch (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity post not found",
        });
      }
    }),

  // Get a user's activity posts
  getUserActivity: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.number().nullish(), // For pagination
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const posts = await ctx.db.activityPost.findMany({
          where: {
            userId: input.userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: input.limit + 1, // Take an extra item to determine if there's more
          cursor: input.cursor ? { id: input.cursor } : undefined,
          include: {
            exercises: true,
          },
        });

        let nextCursor: typeof input.cursor = undefined;
        if (posts.length > input.limit) {
          const nextItem = posts.pop();
          nextCursor = nextItem?.id;
        }

        return {
          posts,
          nextCursor,
        };
      } catch (error) {
        console.error("Error in getUserActivity:", error);
        return {
          posts: [],
          nextCursor: undefined,
        };
      }
    }),

  // Get recent activity posts for a specific challenge
  getRecentActivityPostsForChallenge: protectedProcedure
    .input(
      z.object({
        challengeId: z.string(),
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // First, get the challenge to check its type
        const challenge = await ctx.db.challenge.findUnique({
          where: { id: input.challengeId },
          select: {
            type: true,
            participants: {
              select: {
                userId: true,
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

        // Get participant user IDs
        const participantIds = challenge.participants.map((p) => p.userId);

        // Find activity posts from participants that include the challenge exercise type
        const posts = await ctx.db.activityPost.findMany({
          where: {
            userId: { in: participantIds },
            exercises: {
              some: {
                type: challenge.type,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: input.limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
            exercises: {
              where: {
                type: challenge.type,
              },
            },
          },
        });

        return posts;
      } catch (error) {
        console.error("Error in getRecentActivityPostsForChallenge:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch challenge activity posts",
        });
      }
    }),
});
