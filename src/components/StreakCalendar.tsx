import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EXERCISE_TYPE } from "@prisma/client";

interface StreakCalendarProps {
  userId?: string;
  className?: string;
}

interface Exercise {
  type: EXERCISE_TYPE;
  amount: number;
  unit: string;
}

interface ActivityData {
  date: Date;
  exercises: Exercise[];
}

/**
 * Displays a calendar showing days with activities and streaks
 */
export const StreakCalendar = ({ userId, className }: StreakCalendarProps) => {
  const session = useSession();
  const resolvedUserId = userId ?? session.data?.user.id;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<ActivityData | null>(null);

  // Format month for API call
  const monthNumber = currentMonth.getMonth() + 1; // API expects 1-12 format
  const yearNumber = currentMonth.getFullYear();

  // Get activity data for the current month
  const { data, isLoading } = api.user.getActivityCalendar.useQuery(
    {
      userId: resolvedUserId!,
      month: monthNumber,
      year: yearNumber,
    },
    {
      enabled: !!resolvedUserId,
      refetchOnWindowFocus: false,
    },
  );

  // Generate days for the calendar
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Days from adjacent months to fill the calendar grid
  const daysInMonth = days.length;
  const firstDayOfMonth = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Previous month days to display
  const prevMonthDays = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = new Date(startDate);
    day.setDate(day.getDate() - (i + 1));
    prevMonthDays.push(day);
  }

  // Next month days to display (to fill a 6-row grid)
  const totalCells = 42; // 6 rows of 7 days
  const nextMonthDaysCount = totalCells - daysInMonth - prevMonthDays.length;
  const nextMonthDays = [];
  for (let i = 1; i <= nextMonthDaysCount; i++) {
    const day = new Date(endDate);
    day.setDate(day.getDate() + i);
    nextMonthDays.push(day);
  }

  // All days to display in the grid
  const allDays = [...prevMonthDays, ...days, ...nextMonthDays];

  // Move to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Move to next month
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Check if a day has activity
  const getActivityData = (day: Date): ActivityData | null => {
    if (!data?.activeDates) return null;
    return (
      data.activeDates.find((activity) =>
        isSameDay(new Date(activity.date), day),
      ) ?? null
    );
  };

  // Check if a day is part of a streak
  const isPartOfStreak = (day: Date): boolean => {
    if (!data?.activeDates) return false;
    const activityData = getActivityData(day);
    if (!activityData) return false;

    // Check previous day
    const prevDay = new Date(day);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevActivity = getActivityData(prevDay);

    // Check next day
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextActivity = getActivityData(nextDay);

    return !!prevActivity || !!nextActivity;
  };

  // Format exercise type for display
  const formatExerciseType = (type: EXERCISE_TYPE): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className={cn("w-full rounded-md border", className)}>
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <Calendar className="h-5 w-5" />
          Activity Calendar
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-28 text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-3">
        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {allDays.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const activityData = getActivityData(day);
            const hasActivity = !!activityData;
            const isStreak = isPartOfStreak(day);

            return (
              <div
                key={i}
                className={cn(
                  "relative flex h-9 items-center justify-center rounded-md text-sm",
                  isCurrentMonth
                    ? "font-medium"
                    : "text-muted-foreground opacity-50",
                  hasActivity &&
                    isCurrentMonth &&
                    "bg-green-100 dark:bg-green-900/20",
                  isStreak &&
                    isCurrentMonth &&
                    "bg-green-200 dark:bg-green-900/40",
                )}
              >
                <button
                  onClick={() => hasActivity && setSelectedDate(activityData)}
                  className={cn(
                    "relative flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                    hasActivity &&
                      isCurrentMonth &&
                      "bg-green text-white hover:bg-green",
                    !hasActivity && "hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  {format(day, "d")}
                </button>
                {hasActivity && (
                  <div className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center p-3 text-sm text-muted-foreground">
          Loading activity data...
        </div>
      )}

      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Activities for{" "}
              {selectedDate &&
                format(new Date(selectedDate.date), "MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          {selectedDate?.exercises.map((exercise, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="font-medium">
                {formatExerciseType(exercise.type)}
              </span>
              <span className="text-muted-foreground">
                {exercise.amount} {exercise.unit}
              </span>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
};
