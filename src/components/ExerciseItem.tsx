import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EXERCISE_TYPE } from "@prisma/client";
import {
  MinusCircledIcon,
  PlusCircledIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";

export interface ExerciseItemProps {
  title: string;
  subTitle: string;
  type: EXERCISE_TYPE;
  currentValue?: number;
  setValue: (value: number) => void;
  loading?: boolean;
  target: number;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  title,
  subTitle,
  type,
  currentValue,
  setValue,
  loading,
  target,
}) => {
  const handleIncrement = (direction: "up" | "down") => {
    return direction === "up"
      ? setValue((currentValue ?? 0) + 1)
      : setValue((currentValue ?? 0) - 1);
  };
  const pctCompleteNoDecimalPlaces = Math.floor(
    ((currentValue ?? 0) / target) * 100,
  );
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between ">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subTitle}</CardDescription>
        </div>
        <div>{pctCompleteNoDecimalPlaces}%</div>
      </CardHeader>
      <CardContent className="flex flex-row items-center gap-10">
        <Button variant="secondary" onClick={() => handleIncrement("down")}>
          <MinusCircledIcon className="fill-red" />
        </Button>
        {loading ? (
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => setValue(parseInt(e.target.value))}
            className="w-16 text-center"
          />
        )}
        <Button variant="secondary" onClick={() => handleIncrement("up")}>
          <PlusCircledIcon />
        </Button>
      </CardContent>
    </Card>
  );
};
