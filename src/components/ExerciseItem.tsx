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
  currentValue: number;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  title,
  subTitle,
  type,
  currentValue,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subTitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-row items-center gap-10">
        <Button variant="secondary">
          <MinusCircledIcon className="fill-red" />
        </Button>
        <div>{currentValue}</div>
        <Button variant="secondary">
          <PlusCircledIcon />
        </Button>
      </CardContent>
    </Card>
  );
};
