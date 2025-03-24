import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Trophy, ArrowLeft, UserPlus, UsersRound } from "lucide-react";
import Link from "next/link";
import { ChallengeLeaderboard } from "~/components/challenges/ChallengeLeaderboard";
import { ChallengeProgressChart } from "~/components/challenges/ChallengeProgressChart";
import { ChallengeActivityFeed } from "~/components/challenges/ChallengeActivityFeed";
import { useState } from "react";
import { EXERCISE_TYPE } from "@prisma/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@radix-ui/react-dropdown-menu";

/**
 * Displays details for a specific challenge including leaderboard, progress stats, and activity feed
 */
export default function ChallengeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";

  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const {
    data: challengeDetails,
    isLoading,
    refetch,
  } = api.challenge.getChallengeDetails.useQuery(
    { challengeId: id as string },
    { enabled: !!id && !!userId },
  );

  const joinChallenge = api.challenge.joinChallenge.useMutation({
    onSuccess: () => {
      void refetch();
      setIsJoining(false);
    },
    onError: () => setIsJoining(false),
  });

  const leaveChallenge = api.challenge.leaveChallenge.useMutation({
    onSuccess: () => {
      void refetch();
      setIsLeaving(false);
    },
    onError: () => setIsLeaving(false),
  });

  const handleJoin = () => {
    if (!id) return;
    setIsJoining(true);
    joinChallenge.mutate({ challengeId: id as string });
  };

  const handleLeave = () => {
    if (!id) return;
    setIsLeaving(true);
    leaveChallenge.mutate({ challengeId: id as string });
  };

  if (isLoading || !challengeDetails) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl">Loading challenge...</h2>
        </div>
      </div>
    );
  }

  // Calculate time and progress metrics
  const now = new Date();
  const isActive =
    now >= challengeDetails.startDate && now <= challengeDetails.endDate;
  const isEnded = now > challengeDetails.endDate;
  const isStarted = now >= challengeDetails.startDate;

  const userParticipant = challengeDetails.participants.find(
    (p) => p.user.id === userId,
  );
  const isParticipating = !!userParticipant;

  const totalDays = Math.ceil(
    (challengeDetails.endDate.getTime() -
      challengeDetails.startDate.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const daysRemaining = isEnded
    ? 0
    : Math.ceil(
        (challengeDetails.endDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

  const getExerciseTypeLabel = (type: EXERCISE_TYPE) => {
    switch (type) {
      case EXERCISE_TYPE.PUSH_UPS:
        return "Push-ups";
      case EXERCISE_TYPE.SIT_UPS:
        return "Sit-ups";
      case EXERCISE_TYPE.RUNNING:
        return "Running";
      default:
        return "Exercise";
    }
  };

  return (
    <>
      <Head>
        <title>{challengeDetails.name} | Track A Jack</title>
      </Head>
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2">
            <Button variant="link" asChild className="p-0">
              <Link
                href="/compete"
                className="flex items-center text-muted-foreground"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Challenges
              </Link>
            </Button>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold">{challengeDetails.name}</h1>
              <p className="text-muted-foreground">
                {challengeDetails.description ??
                  `${getExerciseTypeLabel(challengeDetails.type)} challenge`}
              </p>
            </div>

            {isParticipating ? (
              <Button
                variant="destructive"
                onClick={handleLeave}
                disabled={isLeaving || isEnded}
              >
                {isLeaving ? "Leaving..." : "Leave Challenge"}
              </Button>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={isJoining || isEnded || !isActive}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isJoining ? "Joining..." : "Join Challenge"}
              </Button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Trophy className="mr-1 h-4 w-4" />
              <span>
                Goal: {challengeDetails.goalAmount}{" "}
                {getExerciseTypeLabel(challengeDetails.type)}
              </span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <UsersRound className="mr-1 h-4 w-4" />
              <span>{challengeDetails.participants.length} participants</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(challengeDetails.startDate, "MMM d")} -{" "}
              {format(challengeDetails.endDate, "MMM d, yyyy")}
            </div>
          </div>

          <Separator className="mt-4" />
        </div>

        {/* Main content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left column: Progress & Activity Feed */}
          <div className="space-y-6 md:col-span-2">
            {isParticipating && (
              <ChallengeProgressChart
                type={challengeDetails.type}
                goalAmount={challengeDetails.goalAmount}
                currentProgress={userParticipant?.currentProgress || 0}
                daysRemaining={daysRemaining}
                totalDays={totalDays}
              />
            )}

            <ChallengeActivityFeed
              challengeId={challengeDetails.id}
              challengeType={challengeDetails.type}
            />
          </div>

          {/* Right column: Leaderboard */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>
                  {isEnded ? "Final rankings" : "Current standings"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChallengeLeaderboard
                  participants={challengeDetails.participants}
                  goalAmount={challengeDetails.goalAmount}
                  currentUserId={userId}
                  showFinalResults={isEnded}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
