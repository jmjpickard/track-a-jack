import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import bcrypt from "bcrypt";

import { env } from "~/env";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      username?: string;
      // ...other properties
      // role: UserRole;
    };
  }

  interface User {
    username?: string;
    // ...other properties
    // role: UserRole;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
        username: token.username as string | undefined,
      },
    }),
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    // Handle redirection after sign in
    async redirect({ url, baseUrl }) {
      // Always redirect to /feed after sign in
      return `${baseUrl}/feed`;
    },
  },
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/signin",
    verifyRequest: "/verify-request",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: env.RESEND_API_KEY,
        },
        secure: true,
      },
      from: env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { Resend } = await import("resend");
        const resend = new Resend(env.RESEND_API_KEY);

        await resend.emails.send({
          from: provider.from as string,
          to: identifier,
          subject: "Sign in to Track-A-Jack",
          text: `Sign in to Track-A-Jack\n\nClick the link below to sign in to your account:\n\n${url}\n\nIf you did not request this email, you can safely ignore it.\n\nThe link will expire in 24 hours.\n\nThanks,\nThe Track-A-Jack Team`,
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
      <h2 style="color: #333; margin-top: 0;">Sign in to Your Account</h2>
      <p>Click the button below to sign in to your Track-A-Jack account:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${url}" class="button" style="color: white;">Sign in to Track-A-Jack</a>
      </p>
      <p>If you did not request this email, you can safely ignore it.</p>
      <p>This link will expire in 24 hours.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Track-A-Jack. All rights reserved.</p>
      <p>If you're having trouble clicking the sign in button, copy and paste the URL below into your web browser:</p>
      <p style="word-break: break-all;">${url}</p>
    </div>
  </div>
</body>
</html>`,
        });
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Check if user exists
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: credentials.username },
              { username: credentials.username },
            ],
          },
        });

        if (!user || !user.password) {
          return null;
        }

        // Verify password
        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username || undefined,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
