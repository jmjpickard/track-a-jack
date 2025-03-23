import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { EXERCISE_TYPE } from "@prisma/client";
import { ReloadIcon } from "@radix-ui/react-icons";
import { api } from "~/utils/api";

interface Props {
  exerciseType: EXERCISE_TYPE;
  maxWeek: number;
}

export const LeaderboardSection: React.FC<Props> = ({
  exerciseType,
  maxWeek,
}) => {
  const { data: exerciseData, isLoading: exerciseDataLoading } =
    api.post.exerciseByUser.useQuery({
      exerciseType,
      maxWeek,
    });

  const firstTwoLetters = (name: string) => name.slice(0, 2).toUpperCase();
  const firstLetterOfFirstAndLastName = (name: string) => {
    const [first, last] = name.split(" ");
    if (!last || !first) return firstTwoLetters(name);
    const combine = `${first[0]}${last[0]}`;
    return combine;
  };
  return (
    <div>
      {exerciseDataLoading ? (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <div className="flex flex-col gap-1">
          {exerciseData?.map((exercise, index) => (
            <Card className="pb-2 pt-2" key={index}>
              <div className="flex flex-row items-center justify-around gap-3 pl-3 pr-3">
                <div>{index + 1}</div>
                <Avatar className="h-8 w-8 rounded-full">
                  <AvatarImage
                    src={exercise.photo ?? ""}
                    alt={exercise.userName ?? ""}
                  />
                  <AvatarFallback>
                    {firstLetterOfFirstAndLastName(exercise.userName ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div>{exercise.userName}</div>
                <div>{exercise._sum.amount}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
