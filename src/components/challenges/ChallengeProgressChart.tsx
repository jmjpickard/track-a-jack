import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EXERCISE_TYPE } from "@prisma/client";

type ChallengeProgressChartProps = {
  type: EXERCISE_TYPE;
  goalAmount: number;
  currentProgress: number;
  daysRemaining: number;
  totalDays: number;
};

/**
 * Visualizes progress tracking for a challenge with goal completion and time remaining
 */
export const ChallengeProgressChart: React.FC<ChallengeProgressChartProps> = ({
  type,
  goalAmount,
  currentProgress,
  daysRemaining,
  totalDays,
}) => {
  const progressPercentage = Math.min(
    100,
    Math.round((currentProgress / goalAmount) * 100),
  );
  const timePercentage = Math.max(
    0,
    Math.round(((totalDays - daysRemaining) / totalDays) * 100),
  );

  // Calculate daily target to stay on track
  const daysElapsed = totalDays - daysRemaining;
  const expectedProgress =
    daysElapsed > 0 ? Math.round((daysElapsed / totalDays) * goalAmount) : 0;

  // Calculate if ahead or behind target
  const progressDifference = currentProgress - expectedProgress;
  const isAhead = progressDifference >= 0;

  // Calculate daily average needed to complete
  const dailyNeeded =
    daysRemaining > 0
      ? Math.ceil((goalAmount - currentProgress) / daysRemaining)
      : 0;

  const getExerciseTypeLabel = (type: EXERCISE_TYPE) => {
    switch (type) {
      case EXERCISE_TYPE.PUSH_UPS:
        return "push-ups";
      case EXERCISE_TYPE.SIT_UPS:
        return "sit-ups";
      case EXERCISE_TYPE.RUNNING:
        return "km";
      default:
        return "units";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Challenge Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Goal Completion</span>
            <span>
              {currentProgress} / {goalAmount} {getExerciseTypeLabel(type)} (
              {progressPercentage}%)
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Time Elapsed</span>
            <span>
              {totalDays - daysRemaining} / {totalDays} days ({timePercentage}%)
            </span>
          </div>
          <Progress value={timePercentage} className="h-2" />
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-muted p-2 text-center">
              <p className="text-xs text-muted-foreground">Daily Average</p>
              <p className="text-lg font-medium">
                {currentProgress > 0 && daysElapsed > 0
                  ? Math.round((currentProgress / daysElapsed) * 10) / 10
                  : 0}{" "}
                {getExerciseTypeLabel(type)}
              </p>
            </div>
            <div className="rounded-md bg-muted p-2 text-center">
              <p className="text-xs text-muted-foreground">Needed Daily</p>
              <p className="text-lg font-medium">
                {dailyNeeded} {getExerciseTypeLabel(type)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            {isAhead
              ? progressDifference > 0
                ? `You're ahead of target by ${progressDifference} ${getExerciseTypeLabel(
                    type,
                  )}! Keep it up!`
                : "You're right on target!"
              : `You're behind target by ${Math.abs(
                  progressDifference,
                )} ${getExerciseTypeLabel(type)}. Step it up!`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
