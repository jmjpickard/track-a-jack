import { EXERCISE_TYPE } from "@prisma/client";
import { z } from "zod";
import { getStartAndEndDate } from "~/components/WeekView";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  addExercise: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          EXERCISE_TYPE.PUSH_UPS,
          EXERCISE_TYPE.RUNNING,
          EXERCISE_TYPE.SIT_UPS,
        ]),
        amount: z.number(),
        unit: z.string(),
        week: z.number(),
        year: z.number(),
      }),
    )
    .mutation(({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const row = ctx.db.exercise.create({
        data: {
          type: input.type,
          amount: input.amount,
          unit: input.unit,
          week: input.week,
          year: input.year,
          createdById: userId,
        },
      });
      return row;
    }),
  getExerciseByWeek: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        week: z.number(),
      }),
    )
    .query(({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const calculation = ctx.db.exercise.groupBy({
        by: ["type"],
        _sum: {
          amount: true,
        },
        where: {
          createdById: userId,
          week: input.week,
          year: input.year,
        },
      });
      return calculation;
    }),
});
