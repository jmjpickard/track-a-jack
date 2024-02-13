import { Slider } from "@/components/ui/slider";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { Leaderboard } from "~/components/Leaderboard";
import { NavBar } from "~/components/NavBar";
import { getWeekNumber } from "~/components/WeekView";

export default function Track() {
  const session = useSession();
  const isAuth = session.status === "authenticated";
  const isAuthLoading = session.status === "loading";

  const router = useRouter();
  React.useEffect(() => {
    if (!isAuth && !isAuthLoading) {
      void router.push("/signin");
    }
  }, [session, isAuthLoading, isAuth, router]);

  const currentWeek = getWeekNumber(new Date());
  const [week, setWeek] = React.useState([currentWeek]);

  return (
    <>
      <Head>
        <title>Track a Jack</title>
        <meta name="description" content="Track your exercise" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-accent font-mono text-primary">
        <NavBar />
        <div className="w-4/5">
          {!isAuthLoading && (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-7">
                <h2 className="font-bold">Select week range</h2>
                <div className="flex flex-row items-center gap-3">
                  <div>0</div>
                  <Slider
                    onValueChange={setWeek}
                    value={week}
                    max={7}
                    step={1}
                  />
                  <div>{week[0]}</div>
                </div>
              </div>
              <Leaderboard maxWeek={week[0] ?? currentWeek} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
