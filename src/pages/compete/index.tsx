import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { api } from "~/utils/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, PlusCircle, Loader2 } from "lucide-react";
import { ChallengeCard } from "~/components/challenges/ChallengeCard";
import { EXERCISE_TYPE } from "@prisma/client";
import { NavBar } from "~/components/NavBar";

// Define challenge types for type safety
type BaseChallenge = {
  id: string;
  name: string;
  description: string | null;
  type: EXERCISE_TYPE;
  goalAmount: number;
  startDate: Date;
  endDate: Date;
  _count: { participants: number };
  creator: {
    id: string;
    name: string | null;
    username: string | null;
  };
};

type ParticipatingChallenge = BaseChallenge & {
  participants: {
    currentProgress: number;
    lastUpdated: Date;
  }[];
};

type PublicChallenge = BaseChallenge & {
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

/**
 * Competition landing page displaying active challenges and options to create or join challenges
 */
export default function CompetePage() {
  const { data: sessionData, status } = useSession();
  const [activeTab, setActiveTab] = useState("participating");

  const isLoggedIn = status === "authenticated";

  const {
    data: participatingChallenges,
    isLoading: isLoadingParticipating,
    refetch: refetchParticipating,
  } = api.challenge.getUserChallenges.useQuery(
    { activeOnly: true },
    { enabled: isLoggedIn },
  );

  const {
    data: publicChallenges,
    isLoading: isLoadingPublic,
    refetch: refetchPublic,
  } = api.challenge.getAllChallenges.useQuery(
    { activeOnly: true, limit: 10 },
    { enabled: isLoggedIn },
  );

  const refetchAll = () => {
    void refetchParticipating();
    void refetchPublic();
  };

  const renderChallenges = (
    challenges: ParticipatingChallenge[] | PublicChallenge[] | undefined,
    isParticipating: boolean,
    isLoading: boolean,
  ) => {
    if (isLoading) {
      return (
        <div className="flex h-40 w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!challenges || challenges.length === 0) {
      return (
        <div className="flex h-40 w-full flex-col items-center justify-center space-y-4 text-center">
          <p className="text-muted-foreground">
            {isParticipating
              ? "You're not participating in any active challenges"
              : "No public challenges available right now"}
          </p>
          {isParticipating && (
            <Button asChild>
              <Link href="/compete/join">Find Challenges</Link>
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {challenges.map((challenge) => {
          // Calculate some required props for the challenge card
          const now = new Date();
          const isEnded = challenge.endDate < now;

          if (
            isParticipating &&
            "participants" in challenge &&
            challenge.participants[0]
          ) {
            // For participating challenges
            return (
              <ChallengeCard
                key={challenge.id}
                id={challenge.id}
                name={challenge.name}
                description={challenge.description}
                type={challenge.type}
                goalAmount={challenge.goalAmount}
                startDate={challenge.startDate}
                endDate={challenge.endDate}
                creatorName={
                  challenge.creator.name ??
                  challenge.creator.username ??
                  "Unknown"
                }
                participantCount={challenge._count.participants}
                userProgress={challenge.participants[0].currentProgress}
                isParticipating={true}
                isEnded={isEnded}
                refetch={refetchAll}
              />
            );
          } else if (!isParticipating) {
            // For non-participating (public) challenges
            const isParticipatingInPublic = participatingChallenges?.some(
              (p) => p.id === challenge.id,
            );

            return (
              <ChallengeCard
                key={challenge.id}
                id={challenge.id}
                name={challenge.name}
                description={challenge.description}
                type={challenge.type}
                goalAmount={challenge.goalAmount}
                startDate={challenge.startDate}
                endDate={challenge.endDate}
                creatorName={
                  challenge.creator.name ??
                  challenge.creator.username ??
                  "Unknown"
                }
                participantCount={challenge._count.participants}
                isParticipating={!!isParticipatingInPublic}
                isEnded={isEnded}
                refetch={refetchAll}
              />
            );
          }
        })}
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Compete | Track A Jack</title>
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-background font-mono text-foreground">
        <NavBar />
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold">Challenge Yourself</h1>
              <p className="text-muted-foreground">
                Compete with friends or join public challenges
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/compete/create">
                  <PlusCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create Challenge</span>
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/compete/join">
                  <Trophy className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Join Challenge</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Your Challenges</CardTitle>
                <CardDescription>
                  Active challenges you&apos;re participating in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="participating">
                      Participating
                    </TabsTrigger>
                    <TabsTrigger value="public">Public Challenges</TabsTrigger>
                  </TabsList>

                  <TabsContent value="participating" className="mt-0">
                    {renderChallenges(
                      participatingChallenges as ParticipatingChallenge[],
                      true,
                      isLoadingParticipating,
                    )}
                  </TabsContent>

                  <TabsContent value="public" className="mt-0">
                    {renderChallenges(
                      publicChallenges?.challenges as PublicChallenge[],
                      false,
                      isLoadingPublic,
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
