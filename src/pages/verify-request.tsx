import React from "react";
import { NavBar } from "~/components/NavBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const VerifyRequest: React.FC = () => {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
      <NavBar />
      <div className="container mt-8 flex max-w-sm flex-col items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              A sign in link has been sent to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent you an email with a link to sign in. Please check
              your inbox and spam folder.
            </p>
            <p className="text-sm text-muted-foreground">
              The link will expire in 24 hours.
            </p>
            <Link href="/signin" passHref>
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default VerifyRequest;
