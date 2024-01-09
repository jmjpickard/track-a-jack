import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { NavBar } from "~/components/NavBar";
import { WeekView } from "~/components/WeekView";

import { api } from "~/utils/api";

export default function Home() {
  const session = useSession();
  const isAuth = session.status === "authenticated";
  const isAuthLoading = session.status === "loading";

  const router = useRouter();
  React.useEffect(() => {
    if (!isAuth && !isAuthLoading) {
      void router.push("/signin");
    }
  }, [session, isAuthLoading, isAuth, router]);

  return (
    <>
      <Head>
        <title>Track a Jack</title>
        <meta name="description" content="Track your exercise" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-accent font-mono text-primary">
        <NavBar />
        {isAuth ? (
          <WeekView />
        ) : (
          <div className="flex flex-col content-center items-center gap-5 p-16 text-center">
            <div>12km</div>
            <div>200 pushups</div>
            <div>200 situps</div>
            <div>Do this every week and feel better</div>
          </div>
        )}
      </main>
    </>
  );
}
