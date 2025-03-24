import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { setupScheduledJobs } from "./server/scheduled-jobs.js";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Setup scheduled jobs for streaks
  void setupScheduledJobs();

  const port = process.env.PORT ?? 3000;

  createServer(async (req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    await handle(req, res, parsedUrl);
  })
    .listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    })
    .on("error", (err) => {
      console.error("Server error:", err);
    });
});
