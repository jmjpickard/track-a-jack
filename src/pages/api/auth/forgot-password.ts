import type { NextApiRequest, NextApiResponse } from "next";
import { requestPasswordReset } from "~/utils/auth";
import { Resend } from 'resend';
import { env } from "~/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Request password reset
    const { user, token } = await requestPasswordReset(email);

    // Initialize Resend
    const resend = new Resend(env.RESEND_API_KEY);

    const resetUrl = `${env.NEXTAUTH_URL}/reset-password?token=${token.token}`;

    // Send email with reset link using Resend
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Reset your password",
      text: `Hello ${user.name || user.username || "there"},

You requested a password reset for your account. Please click the link below to reset your password:

${resetUrl}

If you did not request this, please ignore this email.

This link will expire in 24 hours.

Thanks,
The Track-A-Jack Team`,
      html: `<p>Hello ${user.name || user.username || "there"},</p>
<p>You requested a password reset for your account. Please click the link below to reset your password:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you did not request this, please ignore this email.</p>
<p>This link will expire in 24 hours.</p>
<p>Thanks,<br>The Track-A-Jack Team</p>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    
    // Don't reveal if email exists or not for security
    return res.status(200).json({ success: true });
  }
}