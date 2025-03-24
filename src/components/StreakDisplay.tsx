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

interface StreakDisplayProps {
  userId?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Displays the user's current activity streak with a flame icon
 */
export const StreakDisplay = ({
  userId,
  showValue = true,
  size = "md",
  className,
}: StreakDisplayProps) => {
  const session = useSession();
  const resolvedUserId = userId ?? session.data?.user.id;

  const { data: streakData, isLoading } = api.user.getUserStreak.useQuery(
    {
      userId: resolvedUserId!,
    },
    {
      enabled: !!resolvedUserId,
      refetchOnWindowFocus: false,
    },
  );

  if (isLoading || !streakData) {
    return null;
  }

  const currentStreak = streakData.currentStreak;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1", className)}>
            <Flame
              className={cn(
                sizeClasses[size],
                currentStreak > 0 ? "text-orange-500" : "text-gray-400",
              )}
            />
            {showValue && (
              <span className={cn("font-medium", textSizeClasses[size])}>
                {currentStreak}
              </span>
            )}
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
