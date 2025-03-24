import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import React from "react";
import { NavBar } from "~/components/NavBar";
import { api } from "~/utils/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EXERCISE_TYPE } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  CalendarDays,
  Dumbbell,
  Timer,
  Users,
  Clock,
  Activity,
  Flame,
  Bike,
  Waves,
  MoveUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreakDisplay } from "~/components/StreakDisplay";
import { StreakCalendar } from "~/components/StreakCalendar";
import { formatDate } from "~/utils/date";
import { Separator } from "~/components/ui/separator";

/**
 * Returns a formatted string and icon for the exercise type
 */
const getExerciseInfo = (type: EXERCISE_TYPE) => {
  switch (type) {
    case EXERCISE_TYPE.PUSH_UPS:
      return { label: "Push-ups", icon: <Dumbbell className="h-4 w-4" /> };
    case EXERCISE_TYPE.SIT_UPS:
      return { label: "Sit-ups", icon: <MoveUp className="h-4 w-4" /> };
    case EXERCISE_TYPE.RUNNING:
      return { label: "Running", icon: <Timer className="h-4 w-4" /> };
    case EXERCISE_TYPE.SWIMMING:
      return { label: "Swimming", icon: <Waves className="h-4 w-4" /> };
    case EXERCISE_TYPE.CYCLING:
      return { label: "Cycling", icon: <Bike className="h-4 w-4" /> };
    case EXERCISE_TYPE.PULL_UPS:
      return {
        label: "Pull-ups",
        icon: <Dumbbell className="h-4 w-4" rotate={90} />,
      };
    default:
      return { label: type, icon: <Dumbbell className="h-4 w-4" /> };
  }
};

interface ActivityPostType {
  id: number;
  exercises: {
    id: number;
    type: EXERCISE_TYPE;
    amount: number;
    unit?: string | null;
  }[];
  createdAt: string | Date;
}

/**
 * Card component to display a user's exercise activity post
 */
const ActivityPost = ({ post }: { post: ActivityPostType }) => {
  const exercises = post.exercises;
  const createdAt = new Date(post.createdAt);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="flex items-center gap-1 text-xs">
            <CalendarDays className="h-3 w-3" /> {formatDate(createdAt)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {exercises.map((exercise) => {
            const { label, icon } = getExerciseInfo(exercise.type);
            return (
              <div
                key={exercise.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-2">
                  {icon}
                  <span>{label}</span>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  {exercise.amount} {exercise.unit ?? ""}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Profile page component that displays user details, activity, and friend count
 */
export default function ProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const session = useSession();
  const isAuth = session.status === "authenticated";
  const isAuthLoading = session.status === "loading";

  React.useEffect(() => {
    if (!isAuth && !isAuthLoading) {
      void router.push("/signin");
    }
  }, [session, isAuthLoading, isAuth, router]);

  // Get user profile data
  const profileQuery = api.user.getUserProfile.useQuery(
    {
      userId: typeof id === "string" ? id : "",
    },
    {
      enabled: isAuth && typeof id === "string",
    },
  );

  // Get user's activity posts
  const userActivityQuery = api.post.getUserActivity.useQuery(
    {
      userId: typeof id === "string" ? id : "",
      limit: 5,
    },
    {
      enabled: isAuth && typeof id === "string",
    },
  );

  const isLoading = profileQuery.isLoading || userActivityQuery.isLoading;
  const userData = profileQuery.data;
  const userPosts = userActivityQuery.data?.posts ?? [];

  return (
    <>
      <Head>
        <title>
          {userData?.name ? `${userData.name}'s Profile` : "User Profile"} |
          Track a Jack
        </title>
        <meta name="description" content="User profile" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
        <NavBar />
        <div className="container max-w-2xl pt-4">
          {isLoading ? (
            <div className="py-10 text-center">Loading profile...</div>
          ) : userData ? (
            <>
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={userData.image ?? ""}
                        alt={userData.name ?? ""}
                      />
                      <AvatarFallback>
                        {(
                          userData.name?.charAt(0) ??
                          userData.username?.charAt(0) ??
                          "U"
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 text-center">
                      <h2 className="text-2xl font-bold">
                        {userData.name ?? userData.username ?? "User"}
                      </h2>
                      {userData.username && userData.name && (
                        <p className="text-sm text-muted-foreground">
                          @{userData.username}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center">
                      <StreakDisplay
                        userId={userData.id}
                        size="lg"
                        className="mx-auto"
                      />
                    </div>
                    <div className="flex w-full justify-around">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span className="font-bold">
                            {userData.activityCount}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Activities
                        </span>
                      </div>
                      <Separator orientation="vertical" className="h-10" />
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="font-bold">
                            {userData.friendCount}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Friends
                        </span>
                      </div>
                      <Separator orientation="vertical" className="h-10" />
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="font-bold">
                            {formatDate(new Date(userData.joinedAt))}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Joined
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="activities" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger
                    value="activities"
                    className="flex items-center gap-2"
                  >
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Recent Activities</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="flex items-center gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    <span className="hidden sm:inline">Activity Calendar</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="stats"
                    className="flex items-center gap-2"
                  >
                    <Flame className="h-4 w-4" />
                    <span className="hidden sm:inline">Stats</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="activities">
                  <div className="space-y-4 py-4">
                    {userPosts.length > 0 ? (
                      userPosts.map((post) => (
                        <ActivityPost key={post.id} post={post} />
                      ))
                    ) : (
                      <Card className="py-6 text-center">
                        <CardContent>
                          <p className="text-muted-foreground">
                            No activities yet
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="calendar">
                  <div className="my-4">
                    <StreakCalendar userId={userData.id} className="w-full" />
                  </div>
                </TabsContent>
                <TabsContent value="stats">
                  <Card className="py-6">
                    <CardContent>
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Exercise Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="h-5 w-5 text-muted-foreground" />
                              <span>Push-ups</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold">
                              {userData.stats?.pushUps || 0}
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              <Dumbbell className="h-5 w-5 text-muted-foreground" />
                              <span>Sit-ups</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold">
                              {userData.stats?.sitUps || 0}
                            </p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              <Timer className="h-5 w-5 text-muted-foreground" />
                              <span>Running</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold">
                              {userData.stats?.running || 0} min
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="py-10 text-center">User not found</div>
          )}
        </div>
      </main>
    </>
  );
}
