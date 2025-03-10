import { EXERCISE_TYPE } from "@prisma/client";
import { groupBy } from "lodash";
import { z } from "zod";
import { getStartAndEndDate } from "~/components/WeekView";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
type ExerciseData = {
  _sum: { amount: number };
  type: string;
  week: number;
};
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
        // Check for existing activity posts within the last 3 hours to group exercises
        const threeHoursAgo = new Date();
        threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

        // Find or create an activity post group
        let activityPost = await ctx.db.activityPost.findFirst({
          where: {
            userId: userId,
            createdAt: { gte: threeHoursAgo },
          },
          orderBy: { createdAt: "desc" },
        });

        // If no recent activity post exists, create a new one
        if (!activityPost) {
          activityPost = await ctx.db.activityPost.create({
            data: {
              userId: userId,
              groupTime: new Date(),
            },
          });
        }

        // Create the exercise and associate it with the activity post
        const row = await ctx.db.exercise.create({
          data: {
            type: input.type,
            amount: input.amount,
            unit: input.unit,
            week: input.week,
            year: input.year,
            createdById: userId,
            activityPostId: activityPost.id,
          },
        });

        return row;
      } catch (error) {
        console.error("Error in addExercise:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add exercise",
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
});
