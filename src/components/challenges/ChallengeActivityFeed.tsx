import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EXERCISE_TYPE } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { Dumbbell, Timer, MoveUp, Bike, Waves } from "lucide-react";

// Define types for activity posts
type ActivityExercise = {
  id: number;
  type: EXERCISE_TYPE;
  amount: number;
};

type ActivityPost = {
  id: number;
  createdAt: Date;
  exercises: ActivityExercise[];
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

type ChallengeActivityFeedProps = {
  challengeId: string;
  challengeType: EXERCISE_TYPE;
};

/**
 * Displays activity feed filtered specifically for challenge-related exercises
 */
export const ChallengeActivityFeed: React.FC<ChallengeActivityFeedProps> = ({
  challengeId,
  challengeType,
}) => {
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: activityData } =
    api.post.getRecentActivityPostsForChallenge.useQuery(
      { challengeId, limit: 10 },
      {
        refetchInterval: 60000, // Refetch every minute
        onSuccess: (data: ActivityPost[]) => {
          setPosts(data);
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        },
      },
    );

  useEffect(() => {
    if (activityData) {
      setPosts(activityData);
    }
  }, [activityData]);

  const getExerciseTypeLabel = (type: EXERCISE_TYPE) => {
    switch (type) {
      case EXERCISE_TYPE.PUSH_UPS:
        return "Push-ups";
      case EXERCISE_TYPE.SIT_UPS:
        return "Sit-ups";
      case EXERCISE_TYPE.RUNNING:
        return "Running";
      case EXERCISE_TYPE.SWIMMING:
        return "Swimming";
      case EXERCISE_TYPE.CYCLING:
        return "Cycling";
      case EXERCISE_TYPE.PULL_UPS:
        return "Pull-ups";
      default:
        return "Exercise";
    }
  };

  const getExerciseTypeIcon = (type: EXERCISE_TYPE) => {
    switch (type) {
      case EXERCISE_TYPE.PUSH_UPS:
        return <Dumbbell className="h-4 w-4" />;
      case EXERCISE_TYPE.SIT_UPS:
        return <MoveUp className="h-4 w-4" />;
      case EXERCISE_TYPE.RUNNING:
        return <Timer className="h-4 w-4" />;
      case EXERCISE_TYPE.SWIMMING:
        return <Waves className="h-4 w-4" />;
      case EXERCISE_TYPE.CYCLING:
        return <Bike className="h-4 w-4" />;
      case EXERCISE_TYPE.PULL_UPS:
        return <Dumbbell className="h-4 w-4" rotate={90} />;
      default:
        return <Dumbbell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Loading challenge activity...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>No activity for this challenge yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest activities from participants</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {posts.map((post) => {
          // Calculate the total amount for the challenge exercise type
          const totalForExerciseType = post.exercises
            .filter((ex) => ex.type === challengeType)
            .reduce((sum, ex) => sum + ex.amount, 0);

          const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
            addSuffix: true,
          });

          return (
            <div key={post.id} className="flex items-start space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={post.user.image ?? undefined}
                  alt={post.user.name ?? "User"}
                />
                <AvatarFallback>
                  {(
                    post.user.name?.[0] ??
                    post.user.username?.[0] ??
                    "U"
                  ).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {post.user.username ?? post.user.name ?? "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">{timeAgo}</p>
                </div>
                <p className="text-sm">
                  Completed{" "}
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 font-normal"
                  >
                    {getExerciseTypeIcon(challengeType)}
                    {totalForExerciseType} {getExerciseTypeLabel(challengeType)}
                  </Badge>
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
