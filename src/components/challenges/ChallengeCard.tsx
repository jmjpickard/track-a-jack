import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EXERCISE_TYPE } from "@prisma/client";
import { useRouter } from "next/router";
import { Trophy, Users } from "lucide-react";
import { api } from "~/utils/api";
import { useState } from "react";

type ChallengeCardProps = {
  id: string;
  name: string;
  description?: string | null;
  type: EXERCISE_TYPE;
  goalAmount: number;
  startDate: Date;
  endDate: Date;
  creatorName: string;
  participantCount: number;
  userProgress?: number;
  isParticipating?: boolean;
  isEnded?: boolean;
  refetch?: () => void;
};

/**
 * Displays a summary card of a challenge for listings
 */
export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  id,
  name,
  description,
  type,
  goalAmount,
  startDate,
  endDate,
  creatorName,
  participantCount,
  userProgress = 0,
  isParticipating = false,
  isEnded = false,
  refetch,
}) => {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const joinChallenge = api.challenge.joinChallenge.useMutation({
    onSuccess: () => {
      if (refetch) refetch();
    },
    onSettled: () => {
      setIsJoining(false);
    },
  });

  const leaveChallenge = api.challenge.leaveChallenge.useMutation({
    onSuccess: () => {
      if (refetch) refetch();
    },
    onSettled: () => {
      setIsLeaving(false);
    },
  });

  const handleJoin = () => {
    setIsJoining(true);
    joinChallenge.mutate({ challengeId: id });
  };

  const handleLeave = () => {
    setIsLeaving(true);
    leaveChallenge.mutate({ challengeId: id });
  };

  const handleViewDetails = () => {
    void router.push(`/compete/${id}`);
  };

  const progressPercentage = Math.min(
    100,
    Math.round((userProgress / goalAmount) * 100),
  );
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  const isActive = new Date() >= startDate && new Date() <= endDate;

  const getExerciseTypeLabel = (type: EXERCISE_TYPE) => {
    switch (type) {
      case EXERCISE_TYPE.PUSH_UPS:
        return "Push-ups";
      case EXERCISE_TYPE.SIT_UPS:
        return "Sit-ups";
      case EXERCISE_TYPE.RUNNING:
        return "Km run";
      default:
        return "Exercise";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          {isEnded && <Trophy className="h-5 w-5 text-yellow-500" />}
        </CardTitle>
        <CardDescription>
          {description ?? `Challenge by ${creatorName}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pb-2">
        <div className="flex justify-between text-sm">
          <span>
            Goal: {goalAmount} {getExerciseTypeLabel(type)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {participantCount}
          </span>
        </div>

        {isParticipating && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Your progress</span>
              <span>
                {userProgress}/{goalAmount} ({progressPercentage}%)
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {isEnded ? (
            <span>Challenge ended</span>
          ) : isActive ? (
            <span>{daysLeft} days left</span>
          ) : (
            <span>Starts {startDate.toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {!isParticipating ? (
          <Button
            onClick={handleJoin}
            disabled={isJoining ?? isEnded ?? !isActive}
            className="w-full"
          >
            {isJoining ? "Joining..." : "Join Challenge"}
          </Button>
        ) : (
          <div className="flex w-full gap-2">
            <Button
              onClick={handleViewDetails}
              variant="outline"
              className="flex-1"
            >
              Details
            </Button>
            {!isEnded && (
              <Button
                onClick={handleLeave}
                variant="destructive"
                disabled={isLeaving}
                className="flex-1"
              >
                {isLeaving ? "Leaving..." : "Leave"}
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
