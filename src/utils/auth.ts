import bcrypt from "bcrypt";
import { db } from "~/server/db";

// Password hash function
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Function to create a new user
export async function createUser({
  email,
  username,
  password,
  name,
}: {
  email: string;
  username: string;
  password: string;
  name?: string;
}) {
  // Hash the password
  const hashedPassword = await hashPassword(password);

  // Create user in database
  return db.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      name: name || username,
    },
  });
}

// Function to request password reset
export async function requestPasswordReset(email: string) {
  // Check if user exists
  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create verification token
  const token = await db.verificationToken.create({
    data: {
      identifier: email,
      token: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  return { user, token };
}

// Function to reset password
export async function resetPassword(token: string, newPassword: string) {
  // Find the token
  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    throw new Error("Invalid token");
  }

  if (verificationToken.expires < new Date()) {
    throw new Error("Token expired");
  }

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword);

  // Update user password
  await db.user.update({
    where: { email: verificationToken.identifier },
    data: { password: hashedPassword },
  });

  // Delete the token
  await db.verificationToken.delete({
    where: { token },
  });

  return true;
}