import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { env } from "~/env";

interface TestEmailRequestBody {
  apiKey: string;
  email: string;
}

/**
 * Handles a test email request to verify Resend configuration
 * This endpoint should only be used for testing purposes and should be removed in production
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authentication check - this is a simple API key check
  // In production, you should use a more secure authentication method
  const { apiKey, email } = req.body as TestEmailRequestBody;

  if (!apiKey || apiKey !== env.RESEND_API_KEY.substring(0, 10)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Initialize Resend
    const resend = new Resend(env.RESEND_API_KEY);

    // Send a test email
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: "Email Configuration Test",
      text: `This is a test email to verify your email configuration with Resend. If you're receiving this, your setup is working correctly.`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; text-align: center; }
    .content { padding: 30px 0; }
    .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #333; margin: 0;">Track-A-Jack</h1>
    </div>
    <div class="content">
      <h2 style="color: #333; margin-top: 0;">Email Configuration Test</h2>
      <p>This is a test email to verify your email configuration with Resend.</p>
      <p>If you're receiving this, your email setup is working correctly!</p>
      <p>Your verified domain is configured and ready to use for authentication flows.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Track-A-Jack. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error("Error sending test email:", error);
      return res
        .status(500)
        .json({ error: "Failed to send test email", details: error });
    }

    return res.status(200).json({
      success: true,
      message: "Test email sent successfully",
      data,
    });
  } catch (error) {
    console.error("Error in test email API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
