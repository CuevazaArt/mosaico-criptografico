/**
 * Syncs secrets from local .env into Vercel's encrypted Environment Variables vault.
 * Secrets never touch git — they live only in .env (local, gitignored) and Vercel (encrypted).
 *
 * Usage: npm run vault:sync
 * Requires: vercel CLI logged in (`npx vercel login`)
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

const VAULT_VARS = [
  { key: 'DEPLOYMENT_MODE', environments: ['production', 'preview'] },
  { key: 'DEFAULT_XRPL_NETWORK', environments: ['production', 'preview'] },
  { key: 'APP_URL', environments: ['production', 'preview'] },
  { key: 'XUMM_API_KEY', environments: ['production', 'preview'] },
  { key: 'XUMM_API_SECRET', environments: ['production'], sensitive: true },
  { key: 'ENABLE_LOCAL_DEMO', environments: ['production', 'preview'] },
  { key: 'XRPL_WALLET_ADDRESS', environments: ['production', 'preview'] },
  { key: 'PROJECT_CONTACT_EMAIL', environments: ['production', 'preview'] },
  { key: 'PROJECT_TWITTER', environments: ['production', 'preview'] }
];

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('.env not found. Copy .env.example to .env and fill credentials.');
  }
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function upsertVercelEnv(key, value, environment) {
  // Remove existing var silently (ignore errors if not present)
  spawnSync('npx', ['vercel', 'env', 'rm', key, environment, '--yes'], {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true
  });

  const result = spawnSync('npx', ['vercel', 'env', 'add', key, environment], {
    cwd: rootDir,
    input: value,
    encoding: 'utf8',
    shell: true
  });

  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').trim();
    throw new Error(`Failed to set ${key} (${environment}): ${err}`);
  }
}

const env = parseEnv(envPath);

console.log('[vault] Syncing environment variables to Vercel encrypted vault...');
console.log('[vault] Secrets are stored encrypted at rest on Vercel — never in the repository.\n');

for (const { key, environments, sensitive } of VAULT_VARS) {
  const value = env[key];
  if (!value || /your-|here$/i.test(value)) {
    console.warn(`[vault] SKIP: ${key} is empty or placeholder`);
    continue;
  }

  for (const environment of environments) {
    upsertVercelEnv(key, value, environment);
    const label = sensitive ? '🔐 encrypted' : '✓';
    console.log(`[vault] ${label} ${key} → ${environment}`);
  }
}

console.log('\n[vault] Sync complete. Run `npm run deploy` to deploy with vault credentials.');
