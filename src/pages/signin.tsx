import React, { useState, useRef } from "react";
import {
  getSession,
  getProviders,
  signIn,
  getCsrfToken,
} from "next-auth/react";
import type {
  LiteralUnion,
  ClientSafeProvider,
  SignInResponse,
} from "next-auth/react";
import type { NextPage } from "next";
import type { Session } from "next-auth";
import { useRouter } from "next/router";
import { NavBar } from "~/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BuiltInProviderType } from "next-auth/providers/index";
import Link from "next/link";

/**
 * Interface for SignIn page props
 */
interface SignInProps {
  providers?: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null;
  csrfToken?: string;
  session?: Session;
}

const SignIn: NextPage<SignInProps> = ({
  providers,
  csrfToken: _csrfToken,
}: SignInProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);
  const router = useRouter();
  const forgotPasswordModalRef = useRef<HTMLDialogElement>(null);

  const openForgotPasswordModal = () => {
    if (forgotPasswordModalRef.current) {
      forgotPasswordModalRef.current.showModal();
    }
  };

  const closeForgotPasswordModal = () => {
    if (forgotPasswordModalRef.current) {
      forgotPasswordModalRef.current.close();
    }
  };

  /**
   * Handles sign in with an OAuth provider
   */
  const handleSignIn = (providerId: string) => {
    void signIn(providerId, { callbackUrl: "/feed" });
  };

  /**
   * Handles sign in with credentials (username/password)
   */
  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (!result) {
        throw new Error("No response from sign in");
      }

      if (result.error) {
        setError("Invalid username or password");
      } else if (result.ok) {
        // Redirect to feed on successful login
        void router.push("/feed");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles sign in with email (magic link)
   */
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/feed", // Redirect to feed after email verification
      });

      if (!result) {
        throw new Error("No response from sign in");
      }

      if (result.error) {
        setError(result.error);
      } else {
        setError("Check your email for a sign in link!");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles password reset request
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (response.ok) {
        setForgotPasswordSubmitted(true);
      } else {
        // Define a type for the expected error response
        interface ErrorResponse {
          error?: string;
          message?: string;
        }

        const data = (await response.json()) as ErrorResponse;
        const errorMessage = data.error ?? data.message;
        throw new Error(errorMessage ?? "Failed to request password reset");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
      <NavBar />
      <div className="container flex flex-col items-center justify-center gap-4 px-4 py-8">
        <Card className="mx-auto max-w-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="credentials">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="credentials">Password</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="oauth">Social</TabsTrigger>
              </TabsList>
              <TabsContent value="credentials">
                <form onSubmit={handleCredentialsSignIn}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username or Email</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="yourusername"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 text-xs"
                          onClick={openForgotPasswordModal}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="email">
                <form onSubmit={handleEmailSignIn}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    {error && (
                      <p
                        className={`text-sm ${
                          error.includes("Check your email")
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {error}
                      </p>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Sending link..." : "Email Sign In Link"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              <TabsContent value="oauth">
                <div className="grid gap-4">
                  {providers &&
                    Object.values(providers)
                      .filter(
                        (provider) =>
                          provider.id !== "credentials" &&
                          provider.id !== "email",
                      )
                      .map((provider) => (
                        <Button
                          key={provider.id}
                          onClick={() => handleSignIn(provider.id)}
                          variant={
                            provider.id === "google" ? "default" : "outline"
                          }
                          className="w-full"
                        >
                          Sign in with {provider.name}
                        </Button>
                      ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm">
              <p>Don&apos;t have an account?</p>
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
            <div className="text-center text-sm">
              Don&apos;t worry, we all forget sometimes.
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <dialog
        id="forgot-password-modal"
        className="modal"
        ref={forgotPasswordModalRef}
      >
        <div className="modal-box w-96 rounded-lg bg-card p-6 text-card-foreground shadow-lg">
          <h3 className="mb-4 text-xl font-bold">
            {forgotPasswordSubmitted ? "Email Sent" : "Reset Password"}
          </h3>

          {forgotPasswordSubmitted ? (
            <div className="py-4">
              <p>
                If an account exists with that email, you&apos;ll receive a
                reset link shortly.
              </p>
              <div className="mt-6 flex justify-end">
                <Button type="button" onClick={closeForgotPasswordModal}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword}>
              <div className="py-4">
                <p className="py-2">
                  Enter your email address to receive a password reset link.
                </p>
                <div className="mt-2 grid gap-2">
                  <Label htmlFor="forgot-password-email">Email</Label>
                  <Input
                    id="forgot-password-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForgotPasswordModal}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </main>
  );
};

export async function getServerSideProps(context: {
  req: object;
  res: object;
}) {
  const session = await getSession(context);
  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);

  // If user is already authenticated, redirect to feed
  if (session) {
    return {
      redirect: {
        destination: "/feed",
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
      providers,
      csrfToken,
    },
  };
}

export default SignIn;
