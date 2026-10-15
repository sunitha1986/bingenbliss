import "../config/loadEnv.js";
import {
  closeLuckyDrawDatabase,
  importLuckyDrawSpins,
} from "../config/luckyDrawDatabase.js";
import { readStore } from "../config/db.js";

async function migrateLuckyDrawHistory() {
  try {
    const store = await readStore();
    const settings = store.luckyDrawSettings || {};
    const legacySpins = [
      ...(Array.isArray(settings.winnerHistory) ? settings.winnerHistory : []),
      ...(settings.lastSpin ? [settings.lastSpin] : []),
    ];
    const validSpins = legacySpins.filter(
      (spin) =>
        typeof spin?.id === "string" &&
        spin.winner &&
        Number.isFinite(Date.parse(spin.spunAt)),
    );
    const spinsById = new Map(validSpins.map((spin) => [spin.id, spin]));

    const importedCount = await importLuckyDrawSpins([...spinsById.values()]);
    console.log(
      `Lucky draw history migration complete: ${importedCount} of ${spinsById.size} unique records imported; ${spinsById.size - importedCount} already existed; ${legacySpins.length - validSpins.length} invalid records skipped.`,
    );
  } finally {
    await closeLuckyDrawDatabase();
  }
}

migrateLuckyDrawHistory().catch((error) => {
  console.error(`Unable to migrate lucky draw history: ${error.message}`);
  process.exitCode = 1;
});
