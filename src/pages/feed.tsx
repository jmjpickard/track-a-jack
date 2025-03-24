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
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarDays,
  Clock,
  Dumbbell,
  Heart,
  MoreHorizontal,
  Ruler,
  Timer,
  Users2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { formatDate } from "~/utils/date";

/**
 * Returns a formatted string and icon for the exercise type
 */
const getExerciseInfo = (type: EXERCISE_TYPE) => {
  switch (type) {
    case EXERCISE_TYPE.PUSH_UPS:
      return { label: "Push-ups", icon: <Dumbbell className="h-4 w-4" /> };
    case EXERCISE_TYPE.SIT_UPS:
      return { label: "Sit-ups", icon: <Dumbbell className="h-4 w-4" /> };
    case EXERCISE_TYPE.RUNNING:
      return { label: "Running", icon: <Timer className="h-4 w-4" /> };
    default:
      return { label: type, icon: <Dumbbell className="h-4 w-4" /> };
  }
};

interface Exercise {
  id: number;
  type: EXERCISE_TYPE;
  amount: number;
  unit?: string | null;
}

interface User {
  id: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
}

interface Post {
  id: number;
  user: User;
  exercises: Exercise[];
  createdAt: string | Date;
}

/**
 * Card component to display a user's exercise activity post
 */
const ActivityPost = ({ post }: { post: Post }) => {
  const userName = post.user.name ?? post.user.username ?? "User";
  const userImage = post.user.image;
  const exercises = post.exercises;
  const createdAt = new Date(post.createdAt);
  const userId = post.user.id;

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-4">
          <Link href={`/profile/${userId}`}>
            <Avatar className="cursor-pointer">
              <AvatarImage src={userImage ?? ""} alt={userName} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link href={`/profile/${userId}`}>
              <CardTitle className="cursor-pointer text-base hover:underline">
                {userName}
              </CardTitle>
            </Link>
            <CardDescription className="flex items-center gap-1 text-xs">
              <CalendarDays className="h-3 w-3" /> {formatDate(createdAt)}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
 * Main feed page showing exercise posts from the user and their friends
 */
export default function Feed() {
  const session = useSession();
  const isAuth = session.status === "authenticated";
  const isAuthLoading = session.status === "loading";

  const router = useRouter();
  React.useEffect(() => {
    if (!isAuth && !isAuthLoading) {
      void router.push("/signin");
    }
  }, [session, isAuthLoading, isAuth, router]);

  // Get feed data
  const feedQuery = api.post.getFeed.useQuery(
    {
      limit: 20,
    },
    {
      enabled: isAuth,
    },
  );

  return (
    <>
      <Head>
        <title>Feed | Track a Jack</title>
        <meta name="description" content="Your exercise feed" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
        <NavBar />
        <div className="container max-w-2xl pt-4">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Activity Feed</h1>
          </div>

          {feedQuery.isLoading ? (
            <div className="py-10 text-center">Loading feed...</div>
          ) : feedQuery.data?.posts.length ? (
            <div className="space-y-4">
              {feedQuery.data.posts.map((post) => (
                <ActivityPost key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card className="py-10 text-center">
              <CardContent className="pt-6">
                <div className="mb-4 flex justify-center">
                  <Users2 className="h-16 w-16 text-muted-foreground" />
                </div>
                <p className="mb-2 text-xl font-medium">Your feed is empty</p>
                <p className="text-sm text-muted-foreground">
                  Connect with friends or log some exercise to see activity
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
