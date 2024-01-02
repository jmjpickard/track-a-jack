import React from "react";
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
import { BuiltInProviderType } from "next-auth/providers/index";

interface SignInProps {
  providers?: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null;
  csrfToken?: string;
  session?: Session;
}

const SignIn: NextPage = ({ providers }: SignInProps) => {
  const handleSignIn = (providerId: string) => {
    signIn(providerId).catch((error) => {
      console.error("Sign-in error:", error);
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
      <NavBar />
      <div>
        {providers &&
          Object.values(providers).map((provider) => (
            <div key={provider.name}>
              <Button
                variant="outline"
                onClick={() => handleSignIn(provider.id)}
              >
                Sign in with {provider.name}
              </Button>
            </div>
          ))}
      </div>
    </main>
  );
};

SignIn.getInitialProps = async (context): Promise<SignInProps> => {
  const { req, res } = context;
  const session = await getSession({ req });

  if (session && res) {
    res.writeHead(302, { Location: "/" });
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
