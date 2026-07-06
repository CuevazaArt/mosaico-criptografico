/**
 * Pre-deploy security audit.
 * Ensures no secrets are exposed in generated client bundles or tracked files.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { validateXummCredentials } from './validate-xumm-credentials.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

const SENSITIVE_KEYS = ['XUMM_API_SECRET', 'VERCEL_TOKEN'];
const CLIENT_FILES = [
  'config.runtime.js',
  'index.html',
  'main.js',
  'src/core/xrpl.js',
  'src/app-config.js'
];

function readIfExists(relPath) {
  const full = path.join(rootDir, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

let failed = false;

// 1. .env must not be tracked by git
try {
  const tracked = execSync('git ls-files --error-unmatch .env', { cwd: rootDir, stdio: 'pipe' }).toString();
  if (tracked.trim()) {
    console.error('[audit] FAIL: .env is tracked by git — remove it immediately.');
    failed = true;
  }
} catch {
  console.log('[audit] OK: .env is not tracked by git');
}

// 2. config.runtime.js must not be tracked
try {
  const tracked = execSync('git ls-files --error-unmatch config.runtime.js', { cwd: rootDir, stdio: 'pipe' }).toString();
  if (tracked.trim()) {
    console.error('[audit] FAIL: config.runtime.js is tracked by git.');
    failed = true;
  }
} catch {
  console.log('[audit] OK: config.runtime.js is not tracked by git');
}

// 3b. XUMM credential format (reject XRPL address as API key)
if (fs.existsSync(envPath)) {
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  for (const issue of validateXummCredentials(env)) {
    console.error(`[audit] FAIL: ${issue}`);
    failed = true;
  }
  if (!failed) {
    console.log('[audit] OK: XUMM credential format looks valid');
  }
}

// 4. Client bundle must not contain secret key names or values from .env
const envSecrets = {};
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (SENSITIVE_KEYS.includes(key) && value.length > 8) {
      envSecrets[key] = value;
    }
  }
}

for (const rel of CLIENT_FILES) {
  const content = readIfExists(rel);
  if (!content) continue;
  for (const key of SENSITIVE_KEYS) {
    if (content.includes(key) && rel !== 'api/xumm/payload.js') {
      console.error(`[audit] FAIL: "${key}" reference found in client file ${rel}`);
      failed = true;
    }
  }
  for (const [key, value] of Object.entries(envSecrets)) {
    if (content.includes(value)) {
      console.error(`[audit] FAIL: ${key} value leaked into ${rel}`);
      failed = true;
    }
  }
}

if (!failed) {
  console.log('[audit] OK: client files contain no secret values');
}

// 5. Required production keys present in .env (names only)
const required = ['DEPLOYMENT_MODE', 'XUMM_API_KEY', 'XUMM_API_SECRET'];
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  for (const key of required) {
    const match = envText.match(new RegExp(`^${key}=(.+)$`, 'm'));
    if (!match || !match[1].trim() || /your-|here$/i.test(match[1].trim())) {
      console.error(`[audit] FAIL: ${key} missing or still a placeholder in .env`);
      failed = true;
    } else {
      console.log(`[audit] OK: ${key} is set`);
    }
  }
}

if (failed) {
  console.error('\n[audit] Security audit FAILED — fix issues before deploying.');
  process.exit(1);
}

// 6. .vercelignore must block local .env from upload
const vercelIgnore = readIfExists('.vercelignore');
if (!vercelIgnore.includes('.env')) {
  console.error('[audit] FAIL: .vercelignore must exclude .env from Vercel uploads');
  process.exit(1);
}
console.log('[audit] OK: .vercelignore blocks .env upload');

console.log('\n[audit] All security checks passed. Safe to deploy.');
