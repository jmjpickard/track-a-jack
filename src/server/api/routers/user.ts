import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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

        // Temporary response until database is fixed
        return { success: true };

        /* Original code - commented out until we fix the database issue
        const senderId = ctx.session.user.id;
        
        // Check if a request already exists
        const existingRequest = await ctx.db.friendRequest.findUnique({
          where: {
            senderId_receiverId: {
              senderId,
              receiverId: input.receiverId
            }
          }
        });
        
        if (existingRequest) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Friend request already sent'
          });
        }
        
        // Check if users are already friends
        const existingFriendship = await ctx.db.friendship.findFirst({
          where: {
            OR: [
              { userId: senderId, friendId: input.receiverId },
              { userId: input.receiverId, friendId: senderId }
            ]
          }
        });
        
        if (existingFriendship) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Users are already friends'
          });
        }
        
        // Create the friend request
        return ctx.db.friendRequest.create({
          data: {
            senderId,
            receiverId: input.receiverId
          }
        });
        */
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

        // Temporary response until database is fixed
        return { success: true };

        /* Original code - commented out until we fix the database issue
        const userId = ctx.session.user.id;
        
        // Find the request
        const request = await ctx.db.friendRequest.findFirst({
          where: {
            id: input.requestId,
            receiverId: userId
          }
        });
        
        if (!request) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Friend request not found'
          });
        }
        
        if (input.accept) {
          // Create friendship connections (both ways)
          await ctx.db.friendship.create({
            data: {
              userId: request.senderId,
              friendId: userId
            }
          });
          
          await ctx.db.friendship.create({
            data: {
              userId,
              friendId: request.senderId
            }
          });
          
          // Update request status
          await ctx.db.friendRequest.update({
            where: { id: request.id },
            data: { status: 'accepted' }
          });
        } else {
          // Reject the request
          await ctx.db.friendRequest.update({
            where: { id: request.id },
            data: { status: 'rejected' }
          });
        }
        
        return { success: true };
        */
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
});
