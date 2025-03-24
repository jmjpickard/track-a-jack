import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/utils/api";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, Search, Filter, Loader2 } from "lucide-react";
import { ChallengeCard } from "~/components/challenges/ChallengeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EXERCISE_TYPE } from "@prisma/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

/**
 * Interface representing a Challenge from the API
 */
interface Challenge {
  id: string;
  name: string;
  description: string | null;
  type: EXERCISE_TYPE;
  goalAmount: number;
  startDate: Date;
  endDate: Date;
  creator: {
    name: string | null;
    username: string | null;
  };
  _count: {
    participants: number;
  };
}

/**
 * Interface representing challenge responses from the API
 */
interface ChallengeResponse {
  challenges: Challenge[];
}

/**
 * Page for exploring and joining challenges created by others
 */
export default function JoinChallengePage() {
  const { status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<EXERCISE_TYPE | "ALL">(
    "ALL",
  );
  const [activeTab, setActiveTab] = useState("active");

  const isAuthenticated = status === "authenticated";

  // Get all public challenges
  const {
    data: activePublicChallenges,
    isLoading: isLoadingActive,
    refetch: refetchActive,
  } = api.challenge.getAllChallenges.useQuery(
    { activeOnly: true, limit: 100 },
    { enabled: isAuthenticated },
  );

  const {
    data: upcomingPublicChallenges,
    isLoading: isLoadingUpcoming,
    refetch: refetchUpcoming,
  } = api.challenge.getUpcomingChallenges.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated },
  );

  const { data: participatingChallenges, refetch: refetchParticipating } =
    api.challenge.getUserChallenges.useQuery(
      { activeOnly: false },
      { enabled: isAuthenticated },
    );

  const refetchAll = () => {
    void refetchActive();
    void refetchUpcoming();
    void refetchParticipating();
  };

  /**
   * Filters challenges based on search query and selected type
   */
  const filterChallenges = (
    challenges: Challenge[] | undefined,
  ): Challenge[] => {
    if (!challenges) return [];

    return challenges.filter((challenge) => {
      // Filter by search query
      const matchesSearch =
        searchQuery === "" ||
        challenge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (challenge.description !== null &&
          challenge.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      // Filter by type
      const matchesType =
        selectedType === "ALL" || challenge.type === selectedType;

      return matchesSearch && matchesType;
    });
  };

  /**
   * Gets challenges for the active tab
   */
  const getChallengesForTab = (): Challenge[] => {
    if (activeTab === "active") {
      return filterChallenges(activePublicChallenges?.challenges);
    }
    return filterChallenges(upcomingPublicChallenges?.challenges);
  };

  /**
   * Checks if a user is participating in a challenge
   */
  const isParticipatingIn = (challengeId: string): boolean => {
    return participatingChallenges?.some((c) => c.id === challengeId) ?? false;
  };

  /**
   * Renders challenges with loading states
   */
  const renderChallenges = (
    challenges: Challenge[] | undefined,
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
        <div className="flex h-40 flex-col items-center justify-center text-center">
          <p className="text-muted-foreground">No challenges found</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {challenges.map((challenge) => (
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
              challenge.creator.name ?? challenge.creator.username ?? "Unknown"
            }
            participantCount={challenge._count.participants}
            isParticipating={isParticipatingIn(challenge.id)}
            isEnded={new Date() > challenge.endDate}
            refetch={refetchAll}
          />
        ))}
      </div>
    );
  };

  if (status === "unauthenticated") {
    void router.push("/signin");
    return null;
  }

  return (
    <>
      <Head>
        <title>Join Challenges | Track A Jack</title>
      </Head>
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <Button variant="link" asChild className="p-0">
            <Link
              href="/compete"
              className="flex items-center text-muted-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Challenges
            </Link>
          </Button>
          <h1 className="mt-2 text-3xl font-bold">Join Challenges</h1>
          <p className="text-muted-foreground">
            Discover and join public challenges created by others
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Find Challenges</CardTitle>
            <CardDescription>
              Search for challenges by name or description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search challenges..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="rounded-md border p-4">
                <h3 className="mb-2 font-medium">Exercise Type</h3>
                <RadioGroup
                  value={selectedType}
                  onValueChange={(value) =>
                    setSelectedType(value as EXERCISE_TYPE | "ALL")
                  }
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ALL" id="all-types" />
                    <Label htmlFor="all-types">All Types</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={EXERCISE_TYPE.PUSH_UPS}
                      id="push-ups-filter"
                    />
                    <Label htmlFor="push-ups-filter">Push-ups</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={EXERCISE_TYPE.SIT_UPS}
                      id="sit-ups-filter"
                    />
                    <Label htmlFor="sit-ups-filter">Sit-ups</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={EXERCISE_TYPE.RUNNING}
                      id="running-filter"
                    />
                    <Label htmlFor="running-filter">Running</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active Challenges</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Challenges</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-0">
              {renderChallenges(getChallengesForTab(), isLoadingActive)}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0">
              {renderChallenges(getChallengesForTab(), isLoadingUpcoming)}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
