import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Interface for notification data
 */
interface NotificationData {
  userId: string;
  type: string;
  title: string;
  content: string;
}

/**
 * Sends a notification to a user
 * @param notification The notification data to send
 * @returns Promise resolving to the created notification
 */
export const sendNotification = async (notification: NotificationData) => {
  try {
    return await prisma.notification.create({
      data: {
        type: notification.type,
        title: notification.title,
        content: notification.content,
        user: {
          connect: {
            id: notification.userId,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};
