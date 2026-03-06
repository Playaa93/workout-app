import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const expo = SQLite.openDatabaseSync('workout.db');

// Enable WAL mode for better performance
expo.execSync('PRAGMA journal_mode = WAL;');
expo.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expo, { schema });
export { expo as sqliteDb };
