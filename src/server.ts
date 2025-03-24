import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { setupScheduledJobs } from "./server/scheduled-jobs.js";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  // Setup scheduled jobs for streaks
  // Use a proper promise chain to handle setupScheduledJobs
  setupScheduledJobs().catch((err) => {
    console.error("Failed to setup scheduled jobs:", err);
  });

  const port = process.env.PORT ?? 3000;

  createServer((req, res) => {
    // Use a separate function to handle the async logic
    const handleRequest = async () => {
      const parsedUrl = parse(req.url ?? "/", true);
      await handle(req, res, parsedUrl);
    };

    // Call the async function and handle any errors
    handleRequest().catch((err) => {
      console.error("Request handling error:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    });
  })
    .listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    })
    .on("error", (err) => {
      console.error("Server error:", err);
    });
});
