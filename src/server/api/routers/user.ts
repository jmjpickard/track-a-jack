import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  checkUserConsent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const user = await ctx.db.user.findFirst({
      where: { id: userId },
    });
    return user?.leaderBoardConsent;
  }),
  setUserConsent: protectedProcedure
    .input(z.object({ consent: z.boolean() }))
    .mutation(({ ctx, input }) => {
      ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          leaderBoardConsent: input.consent,
        },
      });
    }),
});
