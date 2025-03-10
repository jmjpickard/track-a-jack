import React, { useState } from "react";
import {
  getSession,
  getProviders,
  signIn,
  getCsrfToken,
  LiteralUnion,
  ClientSafeProvider,
} from "next-auth/react";
import { NextPage } from "next";
import { Session } from "next-auth";
import { NavBar } from "~/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuiltInProviderType } from "next-auth/providers/index";
import Link from "next/link";

interface SignInProps {
  providers?: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null;
  csrfToken?: string;
  session?: Session;
}

const SignIn: NextPage<SignInProps> = ({ providers, csrfToken }: SignInProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);

  const handleSignIn = (providerId: string) => {
    signIn(providerId, { callbackUrl: "/feed" }).catch((error) => {
      console.error("Sign-in error:", error);
    });
  };

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

      if (result?.error) {
        setError("Invalid username or password");
      } else if (result?.ok) {
        // Redirect to feed on successful login
        router.push("/feed");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const result = await signIn("email", { 
        email, 
        redirect: false,
        callbackUrl: "/feed"  // Redirect to feed after email verification
      });
      
      if (result?.error) {
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
        const data = await response.json();
        setError(data.error || "An error occurred. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
      <NavBar />
      <div className="container flex flex-col items-center justify-center max-w-sm mt-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Choose your preferred sign in method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="credentials" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="credentials">Password</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="providers">Other</TabsTrigger>
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
                          variant="link"
                          className="px-0 text-xs"
                          onClick={() => document.getElementById("forgot-password-modal")?.showModal()}
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
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Sending link..." : "Send Magic Link"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="providers">
                <div className="grid gap-2">
                  {providers &&
                    Object.values(providers)
                      .filter(provider => provider.id !== "credentials" && provider.id !== "email")
                      .map((provider) => (
                        <Button
                          key={provider.name}
                          variant="outline"
                          onClick={() => handleSignIn(provider.id)}
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
            <div className="text-sm text-center">
              Don't have an account?{" "}
              <Link href="/register" className="underline">
                Register here
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <dialog id="forgot-password-modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          {forgotPasswordSubmitted ? (
            <div className="p-4">
              <h3 className="font-bold text-lg mb-4">Password Reset Link Sent</h3>
              <p>If an account exists with this email, we've sent a password reset link. Please check your inbox.</p>
              <div className="modal-action">
                <form method="dialog">
                  <Button>Close</Button>
                </form>
              </div>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="p-4">
              <h3 className="font-bold text-lg mb-4">Reset your password</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="forgot-password-email">Email</Label>
                  <Input
                    id="forgot-password-email"
                    type="email"
                    placeholder="name@example.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="modal-action">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => document.getElementById("forgot-password-modal")?.close()}>
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </main>
  );
};

SignIn.getInitialProps = async (context): Promise<SignInProps> => {
  const { req, res } = context;
  const session = await getSession({ req });

  if (session && res) {
    res.writeHead(302, { Location: "/feed" });
    res.end();
    return {
      session,
      providers: undefined,
      csrfToken: undefined,
    };
  }

  return {
    session: undefined,
    providers: await getProviders(),
    csrfToken: await getCsrfToken({ req }),
  };
};

export default SignIn;
