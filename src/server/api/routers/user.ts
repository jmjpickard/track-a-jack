import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getStreakData,
  updateStreak,
  awardStreakFreeze,
  getActivityCalendarData,
} from "~/server/services/streakService";

export const userRouter = createTRPCRouter({
  checkUserConsent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await ctx.db.user.findFirst({
      where: { id: userId },
    });
    return user?.leaderBoardConsent;
  }),
  setUserConsent: protectedProcedure
    .input(z.object({ consent: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          leaderBoardConsent: input.consent,
        },
      });
    }),

  // Get user profile information
  getUserProfile: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        // Get user basic info
        const user = await ctx.db.user.findUnique({
          where: { id: input.userId },
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            emailVerified: true, // Using as a proxy for "joined date"
          },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Count total activities
        const activityCount = await ctx.db.activityPost.count({
          where: { userId: input.userId },
        });

        // Count friends
        const friendCount = await ctx.db.friendship.count({
          where: { userId: input.userId },
        });

        // Get exercise statistics
        const exercises = await ctx.db.exercise.findMany({
          where: { createdById: input.userId },
          select: {
            type: true,
            amount: true,
          },
        });

        // Calculate totals by exercise type
        const stats = {
          pushUps: 0,
          sitUps: 0,
          running: 0,
        };

        exercises.forEach((exercise) => {
          if (exercise.type === "PUSH_UPS") {
            stats.pushUps += exercise.amount;
          } else if (exercise.type === "SIT_UPS") {
            stats.sitUps += exercise.amount;
          } else if (exercise.type === "RUNNING") {
            stats.running += exercise.amount;
          }
        });

        return {
          ...user,
          joinedAt: user.emailVerified ?? new Date(),
          activityCount,
          friendCount,
          stats,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user profile",
        });
      }
    }),

  // Friend-related procedures
  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        // For debugging
        console.log("Available Prisma models:", Object.keys(ctx.db));

        // Search for users by name, username or email
        const users = await ctx.db.user.findMany({
          where: {
            AND: [
              {
                OR: [
                  { name: { contains: input.query, mode: "insensitive" } },
                  { username: { contains: input.query, mode: "insensitive" } },
                  { email: { contains: input.query, mode: "insensitive" } },
                ],
              },
              { id: { not: userId } }, // Exclude the current user
            ],
          },
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
          take: 10,
        });

        // Temporarily return users without friend status until database is fixed
        return users.map((user) => ({
          ...user,
          friendStatus: "none",
        }));

        /* Original code - commented out until we fix the database issue
        // Get friend request status for each user
        const userIds = users.map(user => user.id);
        
        const sentRequests = await ctx.db.friendRequest.findMany({
          where: {
            senderId: userId,
            receiverId: { in: userIds }
          }
        });
        
        const receivedRequests = await ctx.db.friendRequest.findMany({
          where: {
            senderId: { in: userIds },
            receiverId: userId
          }
        });
        
        const friendships = await ctx.db.friendship.findMany({
          where: {
            OR: [
              { userId, friendId: { in: userIds } },
              { userId: { in: userIds }, friendId: userId }
            ]
          }
        });
        
        // Map friend status to each user
        return users.map(user => {
          const sentRequest = sentRequests.find(req => req.receiverId === user.id);
          const receivedRequest = receivedRequests.find(req => req.senderId === user.id);
          const friendship = friendships.find(fs => 
            (fs.userId === userId && fs.friendId === user.id) || 
            (fs.userId === user.id && fs.friendId === userId)
          );
          
          return {
            ...user,
            friendStatus: friendship ? 'friends' : 
                        sentRequest ? sentRequest.status : 
                        receivedRequest ? `received-${receivedRequest.status}` : 
                        'none'
          };
        });
        */
      } catch (error) {
        console.error("Error in searchUsers:", error);
        return [];
      }
    }),

  sendFriendRequest: protectedProcedure
    .input(
      z.object({
        receiverId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // For debugging
        console.log("sendFriendRequest called with:", input);

        const senderId = ctx.session.user.id;

        // Check if a request already exists
        const existingRequest = await ctx.db.friendRequest.findUnique({
          where: {
            senderId_receiverId: {
              senderId,
              receiverId: input.receiverId,
            },
          },
        });

        if (existingRequest) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Friend request already sent",
          });
        }

        // Check if users are already friends
        const existingFriendship = await ctx.db.friendship.findFirst({
          where: {
            OR: [
              { userId: senderId, friendId: input.receiverId },
              { userId: input.receiverId, friendId: senderId },
            ],
          },
        });

        if (existingFriendship) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Users are already friends",
          });
        }

        // Create the friend request
        return ctx.db.friendRequest.create({
          data: {
            senderId,
            receiverId: input.receiverId,
          },
        });
      } catch (error) {
        console.error("Error in sendFriendRequest:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send friend request",
        });
      }
    }),

  respondToFriendRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string(),
        accept: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // For debugging
        console.log("respondToFriendRequest called with:", input);

        const userId = ctx.session.user.id;

        // Find the request
        const request = await ctx.db.friendRequest.findFirst({
          where: {
            id: input.requestId,
            receiverId: userId,
          },
        });

        if (!request) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Friend request not found",
          });
        }

        if (input.accept) {
          // Create friendship connections (both ways)
          await ctx.db.friendship.create({
            data: {
              userId: request.senderId,
              friendId: userId,
            },
          });

          await ctx.db.friendship.create({
            data: {
              userId,
              friendId: request.senderId,
            },
          });

          // Update request status
          await ctx.db.friendRequest.update({
            where: { id: request.id },
            data: { status: "accepted" },
          });
        } else {
          // Reject the request
          await ctx.db.friendRequest.update({
            where: { id: request.id },
            data: { status: "rejected" },
          });
        }

        return { success: true };
      } catch (error) {
        console.error("Error in respondToFriendRequest:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to respond to friend request",
        });
      }
    }),

  getFriends: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Temporary empty list until database is fixed
      return [];

      /* Original code - commented out until we fix the database issue
      const userId = ctx.session.user.id;
      
      const friendships = await ctx.db.friendship.findMany({
        where: { userId },
        include: {
          friend: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          }
        }
      });
      
      return friendships.map(friendship => friendship.friend);
      */
    } catch (error) {
      console.error("Error in getFriends:", error);
      return [];
    }
  }),

  getFriendRequests: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;

      // Get pending friend requests sent to this user
      const receivedRequests = await ctx.db.friendRequest.findMany({
        where: {
          receiverId: userId,
          status: "pending",
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      // Get pending friend requests sent by this user
      const sentRequests = await ctx.db.friendRequest.findMany({
        where: {
          senderId: userId,
          status: "pending",
        },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      return {
        received: receivedRequests,
        sent: sentRequests,
      };
    } catch (error) {
      console.error("Error in getFriendRequests:", error);
      return {
        received: [],
        sent: [],
      };
    }
  }),

  // Get user's streak information
  getUserStreak: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const streak = await getStreakData(input.userId);
      return streak;
    }),

  // Update user's streak based on new activity
  updateUserStreak: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        activityDate: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const streak = await updateStreak(input.userId, input.activityDate);
      return streak;
    }),

  // Award streak freezes to a user
  awardStreakFreeze: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        count: z.number().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const streak = await awardStreakFreeze(input.userId, input.count);
      return streak;
    }),

  // Get activity calendar data for a specific month
  getActivityCalendar: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        month: z.number().min(1).max(12),
        year: z.number().min(2020).max(2100),
      }),
    )
    .query(async ({ input }) => {
      const calendarData = await getActivityCalendarData(
        input.userId,
        input.month,
        input.year,
      );
      return { activeDates: calendarData };
    }),

  // Get user's notifications
  getUserNotifications: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;
    const userId = session.user.id;

    const notifications = await ctx.db.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return notifications;
  }),

  // Mark a notification as read
  markNotificationAsRead: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const userId = session.user.id;

      const notification = await ctx.db.notification.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      await ctx.db.notification.update({
        where: {
          id: input.id,
        },
        data: {
          isRead: true,
        },
      });

      return { success: true };
    }),
});
