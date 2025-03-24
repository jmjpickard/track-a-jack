import { api } from "~/utils/api";
import { useSession } from "next-auth/react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MiniStreakIndicatorProps {
  className?: string;
}

/**
 * Compact streak indicator for use in navigation bars and headers
 */
export const MiniStreakIndicator = ({
  className,
}: MiniStreakIndicatorProps) => {
  const session = useSession();
  const userId = session.data?.user.id;

  const { data: streakData, isLoading } = api.user.getUserStreak.useQuery(
    {
      userId: userId as string,
    },
    {
      enabled: !!userId,
      refetchOnWindowFocus: false,
    },
  );

  if (isLoading || !streakData) {
    return null;
  }

  const currentStreak = streakData.currentStreak;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 dark:bg-orange-900/20",
              className,
            )}
          >
            <Flame
              className={cn(
                "h-4 w-4",
                currentStreak > 0 ? "text-orange-500" : "text-gray-400",
              )}
            />
            <span className="text-xs font-semibold">{currentStreak}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">
            {currentStreak === 0
              ? "Start your streak by logging an activity today!"
              : currentStreak === 1
                ? "1 day streak! Keep it going!"
                : `${currentStreak} day streak! 🔥`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
