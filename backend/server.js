import "./src/config/loadEnv.js";
import {
  closeLuckyDrawDatabase,
  initializeLuckyDrawDatabase,
} from "./src/config/luckyDrawDatabase.js";
import app from "./src/app.js";

const port = process.env.PORT || 4000;

try {
  await initializeLuckyDrawDatabase();
  app.listen(port, () => {
    console.log(`Binge N Bliss API running at http://localhost:${port}`);
  });
} catch (error) {
  console.error(
    `Unable to connect to the configured MySQL database: ${error.message}`,
  );
  await closeLuckyDrawDatabase();
  process.exitCode = 1;
}
