import React from "react";
import { useRouter } from "next/router";
import { NavBar } from "~/components/NavBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AuthError: React.FC = () => {
  const router = useRouter();
  const { error } = router.query;

  const getErrorMessage = (): string => {
    switch (error) {
      case "Signin":
        return "Try signing in with a different account.";
      case "OAuthSignin":
        return "Try signing in with a different account.";
      case "OAuthCallback":
        return "Try signing in with a different account.";
      case "OAuthCreateAccount":
        return "Try signing in with a different account.";
      case "EmailCreateAccount":
        return "Try signing in with a different account.";
      case "Callback":
        return "Try signing in with a different account.";
      case "OAuthAccountNotLinked":
        return "To confirm your identity, sign in with the same account you used originally.";
      case "EmailSignin":
        return "Check your email address.";
      case "CredentialsSignin":
        return "Sign in failed. Check the details you provided are correct.";
      case "SessionRequired":
        return "Please sign in to access this page.";
      case "Default":
      default:
        return "An error occurred. Please try again.";
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
      <NavBar />
      <div className="container flex flex-col items-center justify-center max-w-sm mt-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>
              There was a problem with your sign in
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {getErrorMessage()}
            </p>
            <Link href="/signin" passHref>
              <Button className="w-full">
                Try Again
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AuthError;