import { EXERCISE_TYPE } from "@prisma/client";
import { groupBy } from "lodash";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { updateStreak } from "~/server/services/streakService";

export const postRouter = createTRPCRouter({
  addExercise: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          EXERCISE_TYPE.PUSH_UPS,
          EXERCISE_TYPE.RUNNING,
          EXERCISE_TYPE.SIT_UPS,
        ]),
        amount: z.number(),
        unit: z.string(),
        week: z.number(),
        year: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        // Create exercise
        const result = await ctx.db.exercise.create({
          data: {
            type: input.type,
            amount: input.amount,
            unit: input.unit,
            week: input.week,
            year: input.year,
            createdById: userId,
          },
        });

        // Get or create activity post group for today
        const now = new Date();
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

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add exercise",
          cause: error,
        });
      }
    }),
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
          EXERCISE_TYPE.PUSH_UPS,
          EXERCISE_TYPE.RUNNING,
          EXERCISE_TYPE.SIT_UPS,
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
});
