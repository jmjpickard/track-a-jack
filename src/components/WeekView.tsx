import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import React from "react";
import {
  FilePlusIcon,
  ThickArrowLeftIcon,
  ThickArrowRightIcon,
} from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { ExerciseItem, ExerciseItemProps } from "./ExerciseItem";
import { EXERCISE_TYPE } from "@prisma/client";
import { api } from "~/utils/api";

dayjs.extend(weekOfYear);

export const getStartAndEndDate = (year: number, weekNumber: number) => {
  const startOfYear = dayjs(`01-01-${year}`);
  const getRightWeek = startOfYear.add(weekNumber - 1, "week");
  const startDate = getRightWeek.startOf("week").toDate();
  const endDate = getRightWeek.endOf("week").toDate();

  return { startDate, endDate };
};

export const WeekView: React.FC = () => {
  const [weekOfYear, setWeekOfYear] = React.useState(dayjs().week());
  const [year, setYear] = React.useState(dayjs().year());

  const [showSave, setShowSave] = React.useState(false);
  const { startDate, endDate } = getStartAndEndDate(year, weekOfYear);
  const addOneWeek = () => {
    if (weekOfYear === 52) {
      setWeekOfYear(1);
      setYear(year + 1);
    } else {
      setWeekOfYear(weekOfYear + 1);
    }
    refetch();
  };

  const subtractOneWeek = () => {
    if (weekOfYear === 1) {
      setWeekOfYear(52);
      setYear(year - 1);
    } else {
      setWeekOfYear(weekOfYear - 1);
    }
    refetch();
  };

  const addExercise = api.post.addExercise.useMutation({
    onSuccess: () => refetch(),
  });

  const [running, setRunning] = React.useState<number>();
  const [pushups, setPushups] = React.useState<number>();
  const [situps, setSitups] = React.useState<number>();

  const { data, refetch } = api.post.getExerciseByWeek.useQuery(
    {
      year,
      week: weekOfYear,
    },
    {
      onSuccess: (response) => {
        setRunning(
          response?.find((d) => d.type === EXERCISE_TYPE.RUNNING)?._sum
            .amount || 0,
        );
        setPushups(
          response?.find((d) => d.type === EXERCISE_TYPE.PUSH_UPS)?._sum
            .amount || 0,
        );
        setSitups(
          response?.find((d) => d.type === EXERCISE_TYPE.SIT_UPS)?._sum
            .amount || 0,
        );
      },
    },
  );

  const saveExercises = () => {
    const runningStateDiff = findDiff(EXERCISE_TYPE.RUNNING, running);

    const pushupsStateDiff = findDiff(EXERCISE_TYPE.PUSH_UPS, pushups);

    const situpsStateDiff = findDiff(EXERCISE_TYPE.SIT_UPS, situps);
    [
      { type: EXERCISE_TYPE.RUNNING, amount: runningStateDiff, unit: "km" },
      { type: EXERCISE_TYPE.PUSH_UPS, amount: pushupsStateDiff, unit: "reps" },
      { type: EXERCISE_TYPE.SIT_UPS, amount: situpsStateDiff, unit: "reps" },
    ].forEach(({ type, amount, unit }) => {
      if (amount) {
        addExercise.mutateAsync({
          type,
          amount,
          unit,
          week: weekOfYear,
          year,
        });
      }
    });
  };

  const findDiff = (type: EXERCISE_TYPE, state?: number) => {
    const dbValue = data?.find((d) => d.type === type)?._sum.amount;
    return (state || 0) - (dbValue || 0);
  };

  React.useEffect(() => {
    const runningStateDiff = findDiff(EXERCISE_TYPE.RUNNING, running);

    const pushupsStateDiff = findDiff(EXERCISE_TYPE.PUSH_UPS, pushups);

    const situpsStateDiff = findDiff(EXERCISE_TYPE.SIT_UPS, situps);

    console.log({ runningStateDiff, pushupsStateDiff, situpsStateDiff });
    if (
      runningStateDiff !== 0 ||
      pushupsStateDiff !== 0 ||
      situpsStateDiff !== 0
    ) {
      setShowSave(true);
    } else {
      setShowSave(false);
    }
  }, [running, pushups, situps]);

  const exerciseItems: ExerciseItemProps[] = [
    {
      title: "Running",
      subTitle: "Target 12km",
      type: EXERCISE_TYPE.RUNNING,
      currentValue: running,
      setValue: setRunning,
    },
    {
      title: "Pushups",
      subTitle: "Target 200",
      type: EXERCISE_TYPE.PUSH_UPS,
      currentValue: pushups,
      setValue: setPushups,
    },
    {
      title: "Situps",
      subTitle: "Target 200",
      type: EXERCISE_TYPE.SIT_UPS,
      currentValue: situps,
      setValue: setSitups,
    },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-row content-center items-center gap-10">
        <Button onClick={subtractOneWeek}>
          <ThickArrowLeftIcon />
        </Button>
        <div>
          <div>Week {weekOfYear}</div>
        </div>
        <Button onClick={addOneWeek}>
          <ThickArrowRightIcon />
        </Button>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex flex-row gap-3">
          <div>{dayjs(startDate).format("MMM D")}</div>
          <div>-</div>
          <div>{dayjs(endDate).format("MMM D")}</div>
        </div>
        <div>{year}</div>
      </div>
      <div className="flex flex-col gap-5 sm:flex-row">
        {exerciseItems.map((item) => (
          <ExerciseItem {...item} key={item.title} />
        ))}
      </div>
      {showSave && (
        <div
          onClick={saveExercises}
          className="bg-green fixed bottom-0 left-0 right-0 flex cursor-pointer flex-col content-center items-center p-4 text-white transition-all duration-300"
        >
          <div className="flex flex-row gap-3 text-xl">
            <div>{addExercise.isLoading ? "Loading..." : "Save"}</div>
            <FilePlusIcon className="h-6 w-6" />
          </div>
        </div>
      )}
    </div>
  );
};
