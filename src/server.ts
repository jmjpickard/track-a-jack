import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { setupScheduledJobs } from "./server/scheduled-jobs.js";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Setup scheduled jobs for streaks
  setupScheduledJobs();

  createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000, (() => {
    console.log(`> Ready on http://localhost:${process.env.PORT || 3000}`);
  }) as any);
});
