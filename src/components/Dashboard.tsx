import React, { useState } from "react";
import { ExerciseItem } from "./ExerciseItem";
import type { ExerciseItemProps } from "./ExerciseItem";
import { EXERCISE_TYPE } from "@prisma/client";
import { api } from "~/utils/api";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { camelCase, upperFirst } from "lodash";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreakDisplay } from "./StreakDisplay";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Trophy, Activity } from "lucide-react";
import { getWeekNumber } from "./WeekView";

interface ExerciseData {
  type: EXERCISE_TYPE;
  _sum: {
    amount: number;
  };
}

interface ActivityPost {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  groupTime: Date;
  userId: string;
  exercises: {
    id: number;
    type: EXERCISE_TYPE;
    amount: number;
    unit: string | null;
  }[];
}

interface Challenge {
  id: string;
  name: string;
  type: EXERCISE_TYPE;
  goalAmount: number;
  startDate: Date;
  endDate: Date;
  currentProgress: number;
  lastUpdated: Date;
}

/**
 * Main dashboard component that displays exercise tracking, active challenges, and recent activity
 */
export const Dashboard: React.FC = () => {
  const [isRemove, setIsRemove] = useState(false);
  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();

  // Fetch active challenges for the user
  const { data: activeChallenges, isLoading: challengesLoading } =
    api.challenge.getActiveChallengesForUser.useQuery<Challenge[]>();

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } =
    api.post.getRecentActivityPosts.useQuery<ActivityPost[]>({ limit: 5 });

  // States for daily exercise tracking
  const [runningState, setRunningState] = useState<number | undefined>();
  const [pushupsState, setPushupsState] = useState<number | undefined>();
  const [situpsState, setSitupsState] = useState<number | undefined>();

  // States for weekly exercise tracking
  const [weeklyRunning, setWeeklyRunning] = useState<number>(0);
  const [weeklyPushups, setWeeklyPushups] = useState<number>(0);
  const [weeklySitups, setWeeklySitups] = useState<number>(0);

  // States for yearly exercise tracking
  const [yearlyRunning, setYearlyRunning] = useState<number>(0);
  const [yearlyPushups, setYearlyPushups] = useState<number>(0);
  const [yearlySitups, setYearlySitups] = useState<number>(0);

  // Fetch today's exercise data
  const { data, refetch, isLoading } = api.post.getExerciseByDay.useQuery(
    undefined,
    {
      onSuccess: (response: ExerciseData[]) => {
        setRunningState(
          response?.find((d) => d.type === EXERCISE_TYPE.RUNNING)?._sum
            .amount ?? 0,
        );
        setPushupsState(
          response?.find((d) => d.type === EXERCISE_TYPE.PUSH_UPS)?._sum
            .amount ?? 0,
        );
        setSitupsState(
          response?.find((d) => d.type === EXERCISE_TYPE.SIT_UPS)?._sum
            .amount ?? 0,
        );
      },
    },
  );

  // Fetch weekly exercise data
  const { data: weeklyData, isLoading: weeklyLoading } =
    api.post.getExerciseByWeek.useQuery(
      {
        year: currentYear,
        week: currentWeek,
      },
      {
        onSuccess: (response: ExerciseData[]) => {
          setWeeklyRunning(
            response?.find((d) => d.type === EXERCISE_TYPE.RUNNING)?._sum
              .amount ?? 0,
          );
          setWeeklyPushups(
            response?.find((d) => d.type === EXERCISE_TYPE.PUSH_UPS)?._sum
              .amount ?? 0,
          );
          setWeeklySitups(
            response?.find((d) => d.type === EXERCISE_TYPE.SIT_UPS)?._sum
              .amount ?? 0,
          );
        },
      },
    );

  // Fetch yearly exercise data using allExerciseByWeek and aggregating
  const { data: yearlyData, isLoading: yearlyLoading } =
    api.post.allExerciseByWeek.useQuery(undefined, {
      onSuccess: (response) => {
        if (response) {
          // Sum up all running data for the year
          const runningData = response[EXERCISE_TYPE.RUNNING] ?? [];
          setYearlyRunning(
            runningData.reduce((sum, item) => sum + (item._sum.amount ?? 0), 0),
          );

          // Sum up all pushups data for the year
          const pushupsData = response[EXERCISE_TYPE.PUSH_UPS] ?? [];
          setYearlyPushups(
            pushupsData.reduce((sum, item) => sum + (item._sum.amount ?? 0), 0),
          );

          // Sum up all situps data for the year
          const situpsData = response[EXERCISE_TYPE.SIT_UPS] ?? [];
          setYearlySitups(
            situpsData.reduce((sum, item) => sum + (item._sum.amount ?? 0), 0),
          );
        }
      },
    });

  // Add exercise mutation
  const addExercise = api.post.addExercise.useMutation({
    onMutate: () => toast.loading("Saving activity..."),
    onSuccess: async (data) => {
      await refetch();
      const { type, amount, unit } = data;
      const typeFormat = upperFirst(camelCase(type));
      if (isRemove) {
        toast.info(`${-amount} ${unit} of ${typeFormat} removed`);
      } else {
        toast.success(`${amount} ${unit} of ${typeFormat} added!`);
      }
    },
  });

  const saveExercise = async (
    type: EXERCISE_TYPE,
    amount: number,
    unit: string,
    remove: boolean,
  ) => {
    setIsRemove(remove);
    await addExercise.mutateAsync({
      type,
      amount: remove ? -amount : amount,
      unit,
      // Week and year are still required in the API but will be calculated server-side
      // We're sending dummy values here that will be overridden
      week: 0,
      year: 0,
    });
  };

  /**
   * Gets challenge progress for a specific exercise type
   */
  const getChallengeProgress = (type: EXERCISE_TYPE) => {
    if (!activeChallenges || challengesLoading) return null;

    // Filter challenges by exercise type
    const typeSpecificChallenges = activeChallenges.filter(
      (challenge) => challenge.type === type,
    );

    if (typeSpecificChallenges.length === 0) return null;

    // Return the first challenge for this exercise type
    return typeSpecificChallenges[0];
  };

  const exerciseItems: ExerciseItemProps[] = [
    {
      title: "Running",
      subTitle: "Distance",
      type: EXERCISE_TYPE.RUNNING,
      currentValue: runningState,
      loading: isLoading ?? weeklyLoading ?? yearlyLoading,
      target: 5,
      itemOptions: [1, 2, 3, 4, 5],
      unit: "km",
      saveExercise,
      weeklyTotal: weeklyRunning,
      yearlyTotal: yearlyRunning,
      challenge: getChallengeProgress(EXERCISE_TYPE.RUNNING),
    },
    {
      title: "Push-ups",
      subTitle: "Count",
      type: EXERCISE_TYPE.PUSH_UPS,
      currentValue: pushupsState,
      loading: isLoading ?? weeklyLoading ?? yearlyLoading,
      target: 100,
      itemOptions: [20, 40, 60, 80, 100],
      unit: "reps",
      saveExercise,
      weeklyTotal: weeklyPushups,
      yearlyTotal: yearlyPushups,
      challenge: getChallengeProgress(EXERCISE_TYPE.PUSH_UPS),
    },
    {
      title: "Sit-ups",
      subTitle: "Count",
      type: EXERCISE_TYPE.SIT_UPS,
      currentValue: situpsState,
      loading: isLoading ?? weeklyLoading ?? yearlyLoading,
      target: 100,
      itemOptions: [20, 40, 60, 80, 100],
      unit: "reps",
      saveExercise,
      weeklyTotal: weeklySitups,
      yearlyTotal: yearlySitups,
      challenge: getChallengeProgress(EXERCISE_TYPE.SIT_UPS),
    },
  ];

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Activity</h1>
          <StreakDisplay userId="" />
        </div>

        <Tabs defaultValue="track">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="track">
              <Activity className="mr-2 h-4 w-4" /> Track
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <Trophy className="mr-2 h-4 w-4" /> Challenges
            </TabsTrigger>
            <TabsTrigger value="history">
              <Dumbbell className="mr-2 h-4 w-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="track" className="mt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {exerciseItems.map((item) => (
                <ExerciseItem {...item} key={item.title} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="mt-4">
            {challengesLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading challenges...
              </div>
            ) : !activeChallenges?.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Challenges</CardTitle>
                  <CardDescription>
                    Join or create a challenge to start competing
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeChallenges.map((challenge) => (
                  <Card key={challenge.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{challenge.name}</CardTitle>
                        <Badge>{challenge.type}</Badge>
                      </div>
                      <CardDescription>
                        Goal: {challenge.goalAmount}{" "}
                        {challenge.type === EXERCISE_TYPE.RUNNING
                          ? "km"
                          : "reps"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>Your progress: {challenge.currentProgress}</div>
                        <div>
                          {Math.round(
                            (challenge.currentProgress / challenge.goalAmount) *
                              100,
                          )}
                          %
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent exercise logs</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading ? (
                  <div className="py-4 text-center text-muted-foreground">
                    Loading activity...
                  </div>
                ) : !recentActivity?.length ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No recent activity found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((post) => (
                      <div key={post.id} className="rounded-lg border p-4">
                        <div className="mb-2 text-sm text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                        <div className="space-y-2">
                          {post.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="flex items-center justify-between"
                            >
                              <div>
                                {exercise.type === EXERCISE_TYPE.PUSH_UPS &&
                                  "Push-ups"}
                                {exercise.type === EXERCISE_TYPE.SIT_UPS &&
                                  "Sit-ups"}
                                {exercise.type === EXERCISE_TYPE.RUNNING &&
                                  "Running"}
                              </div>
                              <Badge variant="outline">
                                {exercise.amount} {exercise.unit ?? "reps"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
};
