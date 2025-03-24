import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EXERCISE_TYPE } from "@prisma/client";
import { ActivityDrawer } from "./ActivityDrawer";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/router";

interface Challenge {
  id: string;
  name: string;
  type: EXERCISE_TYPE;
  goalAmount: number;
  startDate: Date;
  endDate: Date;
  currentProgress: number;
  lastUpdated: Date;
}

export interface ExerciseItemProps {
  title: string;
  subTitle: string;
  type: EXERCISE_TYPE;
  currentValue?: number;
  loading?: boolean;
  target: number;
  itemOptions: number[];
  unit: string;
  weeklyTotal?: number;
  yearlyTotal?: number;
  challenge?: Challenge | null;
  saveExercise: (
    type: EXERCISE_TYPE,
    amount: number,
    unit: string,
    remove: boolean,
  ) => Promise<void>;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  title,
  subTitle,
  type,
  loading,
  target,
  itemOptions,
  unit,
  weeklyTotal = 0,
  yearlyTotal = 0,
  challenge,
  saveExercise,
}) => {
  const router = useRouter();

  const challengeProgress = challenge
    ? Math.round((challenge.currentProgress / challenge.goalAmount) * 100)
    : null;

  /**
   * Navigates to the challenge detail page when a challenge is clicked
   */
  const handleChallengeClick = () => {
    if (challenge) {
      void router.push(`/compete/${challenge.id}`);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subTitle}</CardDescription>
        </div>
        <ActivityDrawer
          type={type}
          title={title}
          options={itemOptions}
          unit={unit}
          onConfirm={saveExercise}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-muted p-2">
            <div className="text-muted-foreground">This week</div>
            <div className="font-medium">
              {weeklyTotal} {unit}
            </div>
          </div>
          <div className="rounded-md bg-muted p-2">
            <div className="text-muted-foreground">This year</div>
            <div className="font-medium">
              {yearlyTotal} {unit}
            </div>
          </div>
        </div>

        {challenge && (
          <div
            className="cursor-pointer rounded-md border p-2 transition-colors hover:bg-muted/50"
            onClick={handleChallengeClick}
          >
            <div className="flex justify-between">
              <div className="text-sm font-medium">{challenge.name}</div>
              <Badge variant="outline">{challengeProgress}%</Badge>
            </div>
            <Progress className="mt-2 h-2" value={challengeProgress ?? 0} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
