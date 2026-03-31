import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { tasks } from "./schema";

const sqlite = new Database("./tasks.db");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    due_date TEXT,
    created_at TEXT NOT NULL
  )
`);

export const db = drizzle(sqlite, { schema: { tasks } });
