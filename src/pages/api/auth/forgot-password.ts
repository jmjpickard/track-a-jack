import type { NextApiRequest, NextApiResponse } from "next";
import { requestPasswordReset } from "~/utils/auth";
import { Resend } from "resend";
import { env } from "~/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body as { email: string };

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
      text: `Hello ${user.name ?? user.username ?? "there"},

You requested a password reset for your account. Please click the link below to reset your password:

${resetUrl}

If you did not request this, please ignore this email.

This link will expire in 24 hours.

Thanks,
The Track-A-Jack Team`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
    table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; text-align: center; }
    .content { padding: 30px 0; }
    .button { background-color: #0070f3; border-radius: 4px; color: white; display: inline-block; font-size: 16px; font-weight: 500; line-height: 1; padding: 12px 24px; text-decoration: none; }
    .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #333; margin: 0;">Track-A-Jack</h1>
    </div>
    <div class="content">
      <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
      <p>Hello ${user.name ?? user.username ?? "there"},</p>
      <p>You recently requested to reset your password for your Track-A-Jack account. Click the button below to reset it:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="button" style="color: white;">Reset Your Password</a>
      </p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
      <p>This password reset link is only valid for the next 24 hours.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Track-A-Jack. All rights reserved.</p>
      <p>If you're having trouble clicking the password reset button, copy and paste the URL below into your web browser:</p>
      <p style="word-break: break-all;">${resetUrl}</p>
    </div>
  </div>
</body>
</html>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error requesting password reset:", error);

    // Don't reveal if email exists or not for security
    return res.status(200).json({ success: true });
  }
}
