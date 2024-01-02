import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import React from "react";
import { ThickArrowLeftIcon, ThickArrowRightIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { ExerciseItem, ExerciseItemProps } from "./ExerciseItem";
import { EXERCISE_TYPE } from "@prisma/client";

dayjs.extend(weekOfYear);

const getStartAndEndDate = (year: number, weekNumber: number) => {
  const startOfYear = dayjs(`01-01-${year}`);
  const getRightWeek = startOfYear.add(weekNumber - 1, "week");
  const startDate = getRightWeek.startOf("week").toDate();
  const endDate = getRightWeek.endOf("week").toDate();

  return { startDate, endDate };
};

export const WeekView: React.FC = () => {
  const [weekOfYear, setWeekOfYear] = React.useState(dayjs().week());
  const [year, setYear] = React.useState(dayjs().year());
  const { startDate, endDate } = getStartAndEndDate(year, weekOfYear);
  const addOneWeek = () => {
    if (weekOfYear === 52) {
      setWeekOfYear(1);
      setYear(year + 1);
    } else {
      setWeekOfYear(weekOfYear + 1);
    }
  };

  const subtractOneWeek = () => {
    if (weekOfYear === 1) {
      setWeekOfYear(52);
      setYear(year - 1);
    } else {
      setWeekOfYear(weekOfYear - 1);
    }
  };

  const exerciseItems: ExerciseItemProps[] = [
    {
      title: "Running",
      subTitle: "Target 12km",
      type: EXERCISE_TYPE.RUNNING,
      currentValue: 0,
    },
    {
      title: "Pushups",
      subTitle: "Target 200",
      type: EXERCISE_TYPE.PUSH_UPS,
      currentValue: 0,
    },
    {
      title: "Situps",
      subTitle: "Target 200",
      type: EXERCISE_TYPE.SIT_UPS,
      currentValue: 0,
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
    </div>
  );
};
