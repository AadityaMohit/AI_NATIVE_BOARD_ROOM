/**
 * Central configuration. Loads environment variables and exposes the
 * handful of constants the rest of the app depends on.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, '..'); // boardroom/

// Load this folder's .env first, then fall back to the parent project's .env
// (dotenv never overrides already-set vars, so the first file loaded wins).
dotenv.config({ path: path.join(APP_ROOT, '.env') });
dotenv.config();
dotenv.config({ path: path.join(APP_ROOT, '..', '.env') });

export const PORT = process.env.BOARDROOM_PORT || 3100;
export const MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';
export const API_KEY = process.env.OPENROUTER_API_KEY;
export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** How many full rounds the panel speaks before the Chair's verdict. */
export const ROUNDS = 2;

/** Absolute path to the static frontend. */
export const PUBLIC_DIR = path.join(APP_ROOT, 'public');

/** Fail fast with a friendly message if the API key is missing. */
export function assertConfig() {
  if (!API_KEY) {
    console.error('\n  Missing OPENROUTER_API_KEY.');
    console.error('  Add it to a .env file in the boardroom/ folder, then restart.\n');
    process.exit(1);
  }
}
