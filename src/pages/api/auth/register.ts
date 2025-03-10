import type { NextApiRequest, NextApiResponse } from "next";
import { createUser } from "~/utils/auth";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, username, password, name } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res
        .status(400)
        .json({ error: "Email, username, and password are required" });
    }

    // Check if email or username already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email or username already in use" });
    }

    // Create user
    const user = await createUser({ email, username, password, name });

    // Remove the password from the response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Error registering user" });
  }
}