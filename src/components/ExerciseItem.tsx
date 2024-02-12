import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EXERCISE_TYPE } from "@prisma/client";
import { ReloadIcon } from "@radix-ui/react-icons";
import { ActivityDrawer } from "./ActivityDrawer";
import { cn } from "@/lib/utils";

export interface ExerciseItemProps {
  title: string;
  subTitle: string;
  type: EXERCISE_TYPE;
  currentValue?: number;
  setValue: (value: number) => void;
  loading?: boolean;
  target: number;
  itemOptions: number[];
  unit: string;
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
  currentValue,
  setValue,
  loading,
  target,
  itemOptions,
  unit,
  saveExercise,
}) => {
  const pctCompleteNoDecimalPlaces = Math.floor(
    ((currentValue ?? 0) / target) * 100,
  );

  const numStyle =
    pctCompleteNoDecimalPlaces >= 100
      ? "bg-emerald-400 transition-all"
      : "bg-gray-500";

  const animation =
    pctCompleteNoDecimalPlaces >= 100 ? "animate-celebration" : "";

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between ">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subTitle}</CardDescription>
        </div>
        <div className="flex flex-row items-center justify-center gap-5">
          <Progress className="w-20" value={pctCompleteNoDecimalPlaces} />
          <div>{pctCompleteNoDecimalPlaces}%</div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-row items-center gap-10">
        {loading ? (
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full text-white",
              numStyle,
              animation,
            )}
          >
            {currentValue}
          </div>
        )}

        <ActivityDrawer
          type={type}
          title={title}
          options={itemOptions}
          unit={unit}
          onConfirm={saveExercise}
        />
      </CardContent>
    </Card>
  );
};
