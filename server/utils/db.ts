import { db } from '../db';
import { env as _env } from './env';

export function useDb() {
  return db;
}

// `_env` is intentionally re-bound so this module has a real import from
// `./env`. The validator runs at import time; downstream code uses
// `useDb()` and gets the `db` instance that the validator already
// confirmed it can connect to.
void _env;
