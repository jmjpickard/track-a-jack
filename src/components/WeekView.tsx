import dayjs from "dayjs";
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

const getMonday = (date: Date) => {
  const day = date.getDay() || 7;
  if (day !== 1) {
    date.setHours(-24 * (day - 1));
  }
  return date;
};

const getSunday = (date: Date) => {
  const day = date.getDay() || 7;
  if (day !== 7) {
    date.setHours(24 * (7 - day));
  }
  return date;
};

const getWeekNumber = (date: Date) => {
  // Copy the date so we don't modify the original
  const newDate = new Date(date);
  // Set to the nearest Thursday: current date + 4 - current day number
  newDate.setDate(newDate.getDate() + 4 - (newDate.getDay() || 7));
  // Get the first day of the year
  const yearStart = new Date(newDate.getFullYear(), 0, 1);
  // Calculate full weeks to the nearest Thursday
  const weekNumber = Math.ceil(
    ((newDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return weekNumber;
};

export const getStartAndEndDate = (year: number, weekNumber: number) => {
  const weeks = weekNumber - 1;
  const januaryFirst = new Date(`${year}-01-01`);
  const addWeeks = januaryFirst.setDate(januaryFirst.getDate() + weeks * 7);
  const startDate = getMonday(new Date(addWeeks));
  const endDate = getSunday(new Date(addWeeks));

  return { startDate, endDate };
};

export const WeekView: React.FC = () => {
  const [weekOfYear, setWeekOfYear] = React.useState(getWeekNumber(new Date()));
  const [year, setYear] = React.useState(dayjs().year());

  const [showSave, setShowSave] = React.useState(false);
  const { startDate, endDate } = getStartAndEndDate(year, weekOfYear);
  const addOneWeek = async () => {
    if (weekOfYear === 52) {
      setWeekOfYear(1);
      setYear(year + 1);
    } else {
      setWeekOfYear(weekOfYear + 1);
    }
    await refetch();
  };

  const subtractOneWeek = async () => {
    if (weekOfYear === 1) {
      setWeekOfYear(52);
      setYear(year - 1);
    } else {
      setWeekOfYear(weekOfYear - 1);
    }
    await refetch();
  };

  const addExercise = api.post.addExercise.useMutation({
    onSuccess: async () => await refetch(),
  });

  const [running, setRunning] = React.useState<number>();
  const [pushups, setPushups] = React.useState<number>();
  const [situps, setSitups] = React.useState<number>();

  const { data, refetch, isLoading } = api.post.getExerciseByWeek.useQuery(
    {
      year,
      week: weekOfYear,
    },
    {
      onSuccess: (response) => {
        setRunning(
          response?.find((d) => d.type === EXERCISE_TYPE.RUNNING)?._sum
            .amount ?? 0,
        );
        setPushups(
          response?.find((d) => d.type === EXERCISE_TYPE.PUSH_UPS)?._sum
            .amount ?? 0,
        );
        setSitups(
          response?.find((d) => d.type === EXERCISE_TYPE.SIT_UPS)?._sum
            .amount ?? 0,
        );
      },
    },
  );

  const saveExercises = async () => {
    const runningStateDiff = findDiff(EXERCISE_TYPE.RUNNING, running);

    const pushupsStateDiff = findDiff(EXERCISE_TYPE.PUSH_UPS, pushups);

    const situpsStateDiff = findDiff(EXERCISE_TYPE.SIT_UPS, situps);
    const promises = [
      { type: EXERCISE_TYPE.RUNNING, amount: runningStateDiff, unit: "km" },
      { type: EXERCISE_TYPE.PUSH_UPS, amount: pushupsStateDiff, unit: "reps" },
      { type: EXERCISE_TYPE.SIT_UPS, amount: situpsStateDiff, unit: "reps" },
    ].map(async ({ type, amount, unit }) => {
      if (amount) {
        await addExercise.mutateAsync({
          type,
          amount,
          unit,
          week: weekOfYear,
          year,
        });
      }
    });
    await Promise.all(promises);
  };

  const findDiff = (type: EXERCISE_TYPE, state?: number) => {
    const dbValue = data?.find((d) => d.type === type)?._sum.amount;
    return (state ?? 0) - (dbValue ?? 0);
  };

  React.useEffect(() => {
    const runningStateDiff = findDiff(EXERCISE_TYPE.RUNNING, running);

    const pushupsStateDiff = findDiff(EXERCISE_TYPE.PUSH_UPS, pushups);

    const situpsStateDiff = findDiff(EXERCISE_TYPE.SIT_UPS, situps);

    if (
      runningStateDiff !== 0 ??
      pushupsStateDiff !== 0 ??
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
      loading: isLoading,
    },
    {
      title: "Pushups",
      subTitle: "Target 200",
      type: EXERCISE_TYPE.PUSH_UPS,
      currentValue: pushups,
      setValue: setPushups,
      loading: isLoading,
    },
    {
      title: "Situps",
      subTitle: "Target 200",
      type: EXERCISE_TYPE.SIT_UPS,
      currentValue: situps,
      setValue: setSitups,
      loading: isLoading,
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
