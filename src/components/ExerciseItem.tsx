import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  loading: boolean;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  title,
  subTitle,
  type,
  currentValue,
  setValue,
  loading,
}) => {
  const handleIncrement = (direction: "up" | "down") => {
    return direction === "up"
      ? setValue((currentValue ?? 0) + 1)
      : setValue((currentValue ?? 0) - 1);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subTitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-row items-center gap-10">
        <Button variant="secondary" onClick={() => handleIncrement("down")}>
          <MinusCircledIcon className="fill-red" />
        </Button>
        {loading ? (
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <div>{currentValue ?? 0}</div>
        )}
        <Button variant="secondary" onClick={() => handleIncrement("up")}>
          <PlusCircledIcon />
        </Button>
      </CardContent>
    </Card>
  );
};
