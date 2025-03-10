import type { NextApiRequest, NextApiResponse } from "next";
import { resetPassword } from "~/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    await resetPassword(token, password);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: "Error resetting password" });
  }
}