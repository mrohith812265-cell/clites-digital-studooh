#!/usr/bin/env node
/**
 * Build the browser-safe Supabase config from an env file.
 *
 * By default this reads ROOT/.env. For the static preview server, set
 * ENV_FILE to a path outside the web root. Only the project URL and
 * publishable/anon key are written. The service-role key is never written to
 * the browser config and must stay server-side.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = process.env.ENV_FILE
  ? path.resolve(process.cwd(), process.env.ENV_FILE)
  : path.join(ROOT, '.env');
const CONFIG_PATH = path.join(ROOT, 'supabase-config.json');
const ENV_IS_IN_WEB_ROOT = ENV_PATH === ROOT || ENV_PATH.startsWith(`${ROOT}${path.sep}`);

function parseEnv(source) {
  const values = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

if (!fs.existsSync(ENV_PATH)) {
  console.error('Missing env file. Set ENV_FILE to a file outside the web root.');
  console.error('Example: ENV_FILE=../clites.env node scripts/generate-supabase-config.mjs');
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(ENV_PATH, 'utf8'));
const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const publishableKey = (
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

if (!url || !publishableKey) {
  console.error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the env file.');
  process.exit(1);
}

if (!url.startsWith('https://')) {
  console.error('SUPABASE_URL must be the https://<project-ref>.supabase.co URL, not an API key.');
  process.exit(1);
}

try {
  new URL(url);
} catch {
  console.error('SUPABASE_URL is not a valid URL.');
  process.exit(1);
}

if (publishableKey.startsWith('https://')) {
  console.error('SUPABASE_PUBLISHABLE_KEY contains a URL. Check that the URL and key were not swapped.');
  process.exit(1);
}

function jwtRole(key) {
  const parts = key.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role || null;
  } catch {
    return null;
  }
}

const keyRole = jwtRole(publishableKey);
if (
  publishableKey.startsWith('sb_secret_') ||
  publishableKey.startsWith('service_role') ||
  keyRole === 'service_role' ||
  keyRole === 'supabase_admin'
) {
  console.error('Refusing to write a service-role/secret key into the browser config.');
  process.exit(1);
}

const serverSecret = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY;
if (serverSecret) {
  if (ENV_IS_IN_WEB_ROOT) {
    console.error('Refusing: the env file is inside the web root and contains a server secret.');
    console.error('Move it outside the web root and rerun with ENV_FILE=/path/outside/web/root/clites.env.');
    process.exit(1);
  }
  console.warn('A server-only Supabase secret is present in the env file but will not be written to the browser config.');
}

const config = { url, publishableKey };
fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
fs.chmodSync(CONFIG_PATH, 0o600);
console.log('Wrote supabase-config.json (public URL + publishable key only).');
