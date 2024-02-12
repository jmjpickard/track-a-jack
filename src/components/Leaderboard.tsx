import { api } from "~/utils/api";
import { LeaderboardConsent } from "./LeaderboardConsent";
import { ReloadIcon } from "@radix-ui/react-icons";

export const Leaderboard: React.FC = () => {
  const {
    data: isConsented,
    refetch,
    isLoading,
  } = api.user.checkUserConsent.useQuery();

  return (
    <div>
      <h1 className="font-bold">Leaderboard</h1>
      {isLoading ? (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <div>
          {isConsented ? (
            <div>Building in progress</div>
          ) : (
            <LeaderboardConsent refetch={refetch} />
          )}
        </div>
      )}
    </div>
  );
};
