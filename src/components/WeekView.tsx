import dayjs from "dayjs";
import React, { useState, useEffect } from "react";
import { ThickArrowLeftIcon, ThickArrowRightIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { ExerciseItem } from "./ExerciseItem";
import type { ExerciseItemProps } from "./ExerciseItem";
import { EXERCISE_TYPE } from "@prisma/client";
import { api } from "~/utils/api";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { camelCase, upperFirst } from "lodash";

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

export const getWeekNumber = (date: Date) => {
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

  const [isRemove, setIsRemove] = React.useState(false);
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
    onMutate: () => toast.loading("Saving activity..."),
    onSuccess: async (data) => {
      await refetch();
      const { type, amount, unit } = data;
      const typeFormat = upperFirst(camelCase(type));
      if (isRemove) {
        toast.info(`${-amount} ${unit} of ${typeFormat} removed`);
      } else {
        toast.success(`${amount} ${unit} of ${typeFormat} added!`);
      }
    },
  });

  const [runningState, setRunningState] = useState<number | undefined>();
  const [pushupsState, setPushupsState] = useState<number | undefined>();
  const [situpsState, setSitupsState] = useState<number | undefined>();

  const { data, refetch, isLoading } = api.post.getExerciseByWeek.useQuery(
    {
      year,
      week: weekOfYear,
    },
    {
      onSuccess: (response) => {
        setRunningState(
          response?.find((d) => d.type === EXERCISE_TYPE.RUNNING)?._sum
            .amount ?? 0,
        );
        setPushupsState(
          response?.find((d) => d.type === EXERCISE_TYPE.PUSH_UPS)?._sum
            .amount ?? 0,
        );
        setSitupsState(
          response?.find((d) => d.type === EXERCISE_TYPE.SIT_UPS)?._sum
            .amount ?? 0,
        );
      },
    },
  );

  const saveExercise = async (
    type: EXERCISE_TYPE,
    amount: number,
    unit: string,
    remove: boolean,
  ) => {
    setIsRemove(remove);
    await addExercise.mutateAsync({
      type,
      amount: remove ? -amount : amount,
      unit,
      week: weekOfYear,
      year,
    });
  };

  const findDiff = (type: EXERCISE_TYPE, state?: number) => {
    const dbValue = data?.find((d) => d.type === type)?._sum.amount;
    return (state ?? 0) - (dbValue ?? 0);
  };

  useEffect(() => {
    if (data) {
      findDiff(EXERCISE_TYPE.RUNNING, runningState);
      findDiff(EXERCISE_TYPE.PUSH_UPS, pushupsState);
      findDiff(EXERCISE_TYPE.SIT_UPS, situpsState);
    }
  }, [data, findDiff, runningState, pushupsState, situpsState]);

  const exerciseItems: ExerciseItemProps[] = [
    {
      title: "Running",
      subTitle: "Distance",
      type: EXERCISE_TYPE.RUNNING,
      currentValue: runningState,
      loading: isLoading,
      target: 5,
      itemOptions: [1, 2, 3, 4, 5],
      unit: "km",
      saveExercise,
    },
    {
      title: "Push-ups",
      subTitle: "Count",
      type: EXERCISE_TYPE.PUSH_UPS,
      currentValue: pushupsState,
      loading: isLoading,
      target: 100,
      itemOptions: [20, 40, 60, 80, 100],
      unit: "reps",
      saveExercise,
    },
    {
      title: "Sit-ups",
      subTitle: "Count",
      type: EXERCISE_TYPE.SIT_UPS,
      currentValue: situpsState,
      loading: isLoading,
      target: 100,
      itemOptions: [20, 40, 60, 80, 100],
      unit: "reps",
      saveExercise,
    },
  ];

  return (
    <div className="flex flex-col items-center gap-3 pb-16">
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
      <Toaster richColors position="top-right" />
    </div>
  );
};
