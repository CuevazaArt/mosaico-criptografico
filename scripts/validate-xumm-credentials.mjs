/**
 * Validates XUMM / Xaman credential format and optionally pings the Xumm API.
 * Usage: node scripts/validate-xumm-credentials.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

const XRPL_ADDRESS = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
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

export function validateXummCredentials(env) {
  const issues = [];
  const key = env.XUMM_API_KEY || '';
  const secret = env.XUMM_API_SECRET || '';

  if (!key || /your-|here$/i.test(key)) {
    issues.push('XUMM_API_KEY is missing or still a placeholder.');
  } else if (XRPL_ADDRESS.test(key)) {
    issues.push('XUMM_API_KEY looks like an XRPL wallet address (r...). Use the API Key from https://apps.xumm.dev/ (UUID format).');
  } else if (!UUID.test(key)) {
    issues.push('XUMM_API_KEY should be a UUID from the Xumm Developer Console.');
  }

  if (!secret || /your-|here$/i.test(secret)) {
    issues.push('XUMM_API_SECRET is missing or still a placeholder.');
  } else if (secret.length < 32) {
    issues.push('XUMM_API_SECRET is too short — it may have been split across multiple lines in .env.');
  } else if (!UUID.test(secret)) {
    issues.push('XUMM_API_SECRET should be a UUID from the Xumm Developer Console.');
  }

  if (XRPL_ADDRESS.test(key) && secret && UUID.test(secret)) {
    issues.push('Your XRPL wallet address belongs in XRPL_WALLET_ADDRESS, not in XUMM_API_KEY.');
  }

  return issues;
}

async function pingXumm(apiKey, apiSecret) {
  const response = await fetch('https://xumm.app/api/v1/platform/ping', {
    headers: {
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret
    }
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCli) {
  const env = parseEnv(envPath);
  const issues = validateXummCredentials(env);

  if (issues.length) {
    console.error('[xumm] Credential validation FAILED:');
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  const { ok, status, data } = await pingXumm(env.XUMM_API_KEY, env.XUMM_API_SECRET);
  if (!ok) {
    console.error(`[xumm] API ping failed (${status}): ${data?.error?.message || data?.message || 'unknown error'}`);
    process.exit(1);
  }

  console.log('[xumm] Credentials format OK and Xumm API ping succeeded.');
}
