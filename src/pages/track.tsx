import { EXERCISE_TYPE } from "@prisma/client";
import { camelCase, upperFirst } from "lodash";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { Leaderboard } from "~/components/Leaderboard";
import { NavBar } from "~/components/NavBar";
import ProgressDisplay from "~/components/ProgressDisplay";
import { getWeekNumber } from "~/components/WeekView";

import { api } from "~/utils/api";

const TARGETS = {
  RUNNING: 624,
  SIT_UPS: 10400,
  PUSH_UPS: 10400,
};

const WEEKLY_TARGETS = {
  RUNNING: 12,
  SIT_UPS: 200,
  PUSH_UPS: 200,
};

export default function Track() {
  const session = useSession();
  const isAuth = session.status === "authenticated";
  const isAuthLoading = session.status === "loading";

  const { data, refetch, isLoading } = api.post.allExerciseByWeek.useQuery();

  const router = useRouter();
  React.useEffect(() => {
    if (!isAuth && !isAuthLoading) {
      void router.push("/signin");
    }
  }, [session, isAuthLoading, isAuth, router]);

  const currentWeek = getWeekNumber(new Date());

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
          {!isLoading && data !== undefined && (
            <div className="flex flex-col gap-5">
              <Leaderboard />
              <div className="text-lg font-bold">Year</div>
              {Object.keys(data).map((type) => {
                const typeData = data[type as EXERCISE_TYPE];
                if (!typeData) return;
                const currentVal = typeData.reduce(
                  (acc, curr) => acc + (curr._sum.amount ?? 0),
                  0,
                );

                const total = TARGETS[type as EXERCISE_TYPE];
                const weekly = WEEKLY_TARGETS[type as EXERCISE_TYPE];

                const current = Math.floor((currentVal / total) * 100);
                const target = Math.floor(
                  ((weekly * currentWeek) / total) * 100,
                );

                const typeFormat = upperFirst(camelCase(type));

                return (
                  <div key={type}>
                    <div>{typeFormat}</div>
                    <ProgressDisplay
                      current={current}
                      target={target}
                      total={100}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
