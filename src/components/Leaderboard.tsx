import { api } from "~/utils/api";
import { LeaderboardConsent } from "./LeaderboardConsent";
import { ReloadIcon } from "@radix-ui/react-icons";
import { EXERCISE_TYPE } from "@prisma/client";
import { LeaderboardSection } from "./LeaderboardTabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Leaderboard: React.FC = () => {
  const {
    data: isConsented,
    refetch,
    isLoading,
  } = api.user.checkUserConsent.useQuery();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold">Leaderboard</h1>
      {isLoading ? (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <div>
          {isConsented ? (
            <Tabs defaultValue="running">
              <TabsList className="">
                <TabsTrigger value="running">Running</TabsTrigger>
                <TabsTrigger value="situps">Situps</TabsTrigger>
                <TabsTrigger value="pressups">Pressups</TabsTrigger>
              </TabsList>
              <TabsContent value="running">
                <LeaderboardSection exerciseType={EXERCISE_TYPE.RUNNING} />
              </TabsContent>
              <TabsContent value="situps">
                <LeaderboardSection exerciseType={EXERCISE_TYPE.SIT_UPS} />
              </TabsContent>
              <TabsContent value="pressups">
                <LeaderboardSection exerciseType={EXERCISE_TYPE.PUSH_UPS} />
              </TabsContent>
            </Tabs>
          ) : (
            <LeaderboardConsent refetch={refetch} />
          )}
        </div>
      )}
    </div>
  );
};
