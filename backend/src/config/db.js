import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const dataDirectory = path.resolve(path.dirname(currentFile), "../../data");
const dataFile = path.join(dataDirectory, "store.json");

const emptyStore = { users: [], orders: [] };

export async function readStore() {
  try {
    return JSON.parse(await fs.readFile(dataFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await writeStore(emptyStore);
    return { ...emptyStore };
  }
}

export async function writeStore(store) {
  await fs.mkdir(dataDirectory, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2));
}
