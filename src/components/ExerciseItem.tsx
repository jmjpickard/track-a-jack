import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EXERCISE_TYPE } from "@prisma/client";
import { MinusCircledIcon, PlusCircledIcon } from "@radix-ui/react-icons";

export interface ExerciseItemProps {
  title: string;
  subTitle: string;
  type: EXERCISE_TYPE;
  currentValue?: number;
  setValue: (value: number) => void;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  title,
  subTitle,
  type,
  currentValue,
  setValue,
}) => {
  const handleIncrement = (direction: "up" | "down") => {
    return direction === "up"
      ? setValue((currentValue || 0) + 1)
      : setValue((currentValue || 0) - 1);
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
        <div>{currentValue || 0}</div>
        <Button variant="secondary" onClick={() => handleIncrement("up")}>
          <PlusCircledIcon />
        </Button>
      </CardContent>
    </Card>
  );
};
