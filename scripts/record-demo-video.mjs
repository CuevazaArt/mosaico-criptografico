/**
 * Records a Make Waves demo video, then post-processes with ffmpeg:
 * English burned-in subtitles + gentle ambient music bed.
 * Run: npm run record:demo
 */
import { chromium } from 'playwright';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const assetsDir = path.join(rootDir, 'assets');
const outDir = path.join(assetsDir, 'demo-recording');
const BASE = process.env.DEMO_URL || 'https://mosaico-criptografico.vercel.app';

const DEMO_ADDRESS = 'r3yr1tGjGXJsSukBXUVCHVCvgyP2QpC19a';
const DEMO_TX = '44C5B937381AFFA26DE320D5B642DC66BE5C6B24626EF560365F9625A3DA4CD6';
const SAMPLE_A = 'rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE';
const PHISHING_B = 'rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQf';

const WEBM_OUT = path.join(assetsDir, 'demo-make-waves.webm');
const SRT_OUT = path.join(assetsDir, 'demo-make-waves.srt');
const MUSIC_OUT = path.join(assetsDir, 'demo-music-bed.wav');
const ACOUSTIC_OUT = path.join(assetsDir, 'demo-acoustic-cues.wav');
const AUDIO_EVENTS_OUT = path.join(assetsDir, 'demo-audio-events.json');
const MP4_OUT = path.join(assetsDir, 'demo-make-waves.mp4');

class SceneTimer {
  constructor() {
    this.t0 = Date.now();
    this.cues = [];
    this.audioEvents = [];
  }

  mark(text) {
    this.cues.push({ sec: (Date.now() - this.t0) / 1000, text });
  }

  markAudio(address) {
    this.audioEvents.push({ sec: (Date.now() - this.t0) / 1000, address });
  }

  reset() {
    this.t0 = Date.now();
    this.cues = [];
    this.audioEvents = [];
  }
}

function getMnemonicFrequencies(address) {
  const hash = crypto.createHash('sha256').update(address.trim()).digest();
  const numCells = 9;
  const baseFreq = 160 + (hash[31] % 120);
  const pentatonicIntervals = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  const scale = pentatonicIntervals.map((semitones) => baseFreq * 2 ** (semitones / 12));
  // Semi-anchored (matches src/core/layout.js)
  const centerIdx = 4;
  const peripheral = [];
  for (let i = 0; i < numCells; i++) {
    if (i !== 4) peripheral.push(i);
  }
  for (let k = peripheral.length - 1; k > 0; k--) {
    const j = hash[k % 32] % (k + 1);
    [peripheral[k], peripheral[j]] = [peripheral[j], peripheral[k]];
  }
  const layout = new Array(numCells);
  layout[centerIdx] = 4;
  let p = 0;
  for (let i = 0; i < numCells; i++) {
    if (i === centerIdx) continue;
    layout[i] = peripheral[p++];
  }
  const freqs = [];
  for (let step = 0; step < 4; step++) {
    const logicalIndex = layout[step];
    const cDataOffset = (logicalIndex * 3) % 26;
    const noteIndex = (hash[cDataOffset] + hash[(cDataOffset + 1) % 32]) % scale.length;
    freqs.push(scale[noteIndex]);
  }
  return freqs;
}

function runFfmpeg(args, label) {
  const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`[demo] ffmpeg ${label} failed:\n`, result.stderr?.slice(-800));
    return false;
  }
  return true;
}

function probeDuration(filePath) {
  const result = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', filePath
  ], { encoding: 'utf8' });
  const n = parseFloat(result.stdout?.trim());
  return Number.isFinite(n) ? n : null;
}

function formatSrtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function writeSrt(cues, durationSec) {
  const lines = [];
  for (let i = 0; i < cues.length; i++) {
    const start = cues[i].sec;
    const end = i + 1 < cues.length ? cues[i + 1].sec - 0.2 : durationSec - 0.3;
    if (end <= start) continue;
    lines.push(String(i + 1));
    lines.push(`${formatSrtTime(start)} --> ${formatSrtTime(end)}`);
    lines.push(cues[i].text);
    lines.push('');
  }
  fs.writeFileSync(SRT_OUT, `${lines.join('\n')}\n`, 'utf8');
  console.log(`[demo] Saved ${path.relative(rootDir, SRT_OUT)}`);
}

/**
 * Rich rhythmic bass bed (~100 BPM): 8-step pattern, warm sub + body.
 * No high ticks / mid plucks — those sounded piercing.
 */
function generateMusicBed(durationSec) {
  const dur = Math.ceil(durationSec + 2);
  const fadeOut = Math.max(0, dur - 3.5);
  // 8 steps × 0.3s ≈ 100 BPM. Degrees: root, ghost, fifth, root, minor3, ghost, fourth, fifth.
  // Freqs (Hz): 55, 0, 82.5, 55, 65.4, 0, 73.4, 82.5  — A1-centered minor groove.
  // step = floor(t/0.3)%8 ; pitch selected via nested eq()
  const pitchExpr =
    `(55` +
    `+27.5*eq(mod(floor(t/0.3)\\,8)\\,2)` +
    `+10.4*eq(mod(floor(t/0.3)\\,8)\\,4)` +
    `+18.4*eq(mod(floor(t/0.3)\\,8)\\,6)` +
    `+27.5*eq(mod(floor(t/0.3)\\,8)\\,7)` +
    `)`;
  // Mute ghost steps 1 and 5
  const gateExpr =
    `(1-eq(mod(floor(t/0.3)\\,8)\\,1))*(1-eq(mod(floor(t/0.3)\\,8)\\,5))`;
  // Soft envelope per step (longer sustain on downbeats 0,2,4,7)
  const envExpr =
    `exp(-(8+6*eq(mod(floor(t/0.3)\\,8)\\,0)+4*eq(mod(floor(t/0.3)\\,8)\\,2))*mod(t\\,0.3))`;

  // Fundamental sub
  const subBass =
    `aevalsrc=exprs='0.95*sin(2*PI*${pitchExpr}*t)*${envExpr}*${gateExpr}':d=${dur}:s=44100:c=mono`;
  // Soft 2nd harmonic for warmth (not bright)
  const body =
    `aevalsrc=exprs='0.28*sin(2*PI*2*${pitchExpr}*t)*${envExpr}*${gateExpr}':d=${dur}:s=44100:c=mono`;
  // Syncopated ghost thump on off-grid (step+0.15) — very soft, low only
  const syncop =
    `aevalsrc=exprs='0.32*sin(2*PI*48*t)*exp(-28*mod(t+0.15\\,0.6))*eq(mod(floor((t+0.15)/0.6)\\,2)\\,1)':d=${dur}:s=44100:c=mono`;

  const ok = runFfmpeg([
    '-y',
    '-f', 'lavfi', '-i', subBass,
    '-f', 'lavfi', '-i', body,
    '-f', 'lavfi', '-i', syncop,
    '-filter_complex',
    `[0:a][1:a][2:a]amix=inputs=3:duration=longest:dropout_transition=0:weights=1.4 0.55 0.4,` +
    `lowpass=f=280,highpass=f=28,` +
    `pan=stereo|c0=c0|c1=c0,` +
    `afade=t=in:st=0:d=0.6,afade=t=out:st=${fadeOut}:d=3.2`,
    MUSIC_OUT
  ], 'music bed');
  if (ok) console.log(`[demo] Saved ${path.relative(rootDir, MUSIC_OUT)}`);
  return ok;
}

/**
 * Soft low "blip" cues instead of piercing high sines.
 * Caps frequency and applies heavy lowpass so they sit under the bass.
 */
function generateAcousticCues(audioEvents, durationSec) {
  if (!audioEvents?.length) {
    if (fs.existsSync(ACOUSTIC_OUT)) fs.unlinkSync(ACOUSTIC_OUT);
    return false;
  }

  const inputs = [];
  const filterParts = [];
  const mixLabels = [];
  let inputIdx = 0;

  for (const evt of audioEvents) {
    const freqs = getMnemonicFrequencies(evt.address);
    for (let step = 0; step < 4; step++) {
      // Drop into bass/mid register (never piercing highs)
      let freq = freqs[step];
      while (freq > 220) freq /= 2;
      freq = Math.max(90, Math.min(200, freq));
      freq = Math.round(freq * 10) / 10;
      const delayMs = Math.round((evt.sec + step * 0.22) * 1000);
      inputs.push('-f', 'lavfi', '-i', `sine=frequency=${freq}:duration=0.28:sample_rate=44100`);
      filterParts.push(
        `[${inputIdx}:a]adelay=${delayMs}|${delayMs},afade=t=in:st=0:d=0.02,afade=t=out:st=0.12:d=0.16,` +
        `lowpass=f=320,volume=0.45[a${inputIdx}]`
      );
      mixLabels.push(`[a${inputIdx}]`);
      inputIdx++;
    }
  }

  const dur = Math.ceil(durationSec + 1);
  const filter = `${filterParts.join(';')};${mixLabels.join('')}amix=inputs=${inputIdx}:duration=longest:dropout_transition=0,` +
    `lowpass=f=300,pan=stereo|c0=c0|c1=c0,afade=t=out:st=${dur - 0.5}:d=0.5`;

  const ok = runFfmpeg(['-y', ...inputs, '-filter_complex', filter, ACOUSTIC_OUT], 'acoustic cues');
  if (ok) console.log(`[demo] Saved ${path.relative(rootDir, ACOUSTIC_OUT)}`);
  return ok;
}

function escapeSubPath(p) {
  return p.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");
}

function muxFinal(webmPath, durationSec) {
  const srtEsc = escapeSubPath(SRT_OUT);
  const style = 'FontName=Arial,FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,MarginV=36,Bold=1';
  const hasMusic = fs.existsSync(MUSIC_OUT);
  const hasAcoustic = fs.existsSync(ACOUSTIC_OUT);

  let filter = `[0:v]subtitles='${srtEsc}':force_style='${style}'[v]`;
  const extraInputs = [];

  if (hasMusic) extraInputs.push(MUSIC_OUT);
  if (hasAcoustic) extraInputs.push(ACOUSTIC_OUT);

  if (!extraInputs.length) {
    filter += `;anullsrc=channel_layout=stereo:sample_rate=44100:d=${durationSec}[a]`;
  } else if (extraInputs.length === 1) {
    filter += `;[1:a]volume=${hasMusic ? 1.2 : 1.5},pan=stereo|c0=c0|c1=c1,` +
      `loudnorm=I=-14:TP=-1.0:LRA=11:linear=true[a]`;
  } else {
    filter += `;[1:a]volume=1.45,pan=stereo|c0=c0|c1=c1[m];[2:a]volume=0.55,pan=stereo|c0=c0|c1=c1[c];` +
      `[m][c]amix=inputs=2:duration=first:dropout_transition=0:weights=1 0.35,pan=stereo|c0=c0|c1=c1,` +
      `loudnorm=I=-14:TP=-1.0:LRA=11:linear=true[a]`;
  }

  const args = [
    '-y', '-i', webmPath,
    ...extraInputs.flatMap((p) => ['-i', p]),
    '-filter_complex', filter,
    '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2',
    '-movflags', '+faststart',
    '-t', String(durationSec),
    MP4_OUT
  ];

  const ok = runFfmpeg(args, 'final mux');
  if (ok) {
    console.log(`[demo] Saved ${path.relative(rootDir, MP4_OUT)}`);
    const vol = spawnSync('ffmpeg', ['-i', MP4_OUT, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
    const mean = vol.stderr?.match(/mean_volume:\s*([-\d.]+)\s*dB/)?.[1];
    const max = vol.stderr?.match(/max_volume:\s*([-\d.]+)\s*dB/)?.[1];
    if (mean) console.log(`[demo] MP4 audio levels — mean: ${mean} dB, max: ${max} dB`);
  }
  return ok;
}

function loadAudioEvents() {
  if (fs.existsSync(AUDIO_EVENTS_OUT)) {
    return JSON.parse(fs.readFileSync(AUDIO_EVENTS_OUT, 'utf8'));
  }
  return [
    { sec: 15.8, address: DEMO_ADDRESS },
    { sec: 24.0, address: SAMPLE_A },
    { sec: 33.6, address: DEMO_ADDRESS }
  ];
}

async function postProcessRecording(timer) {
  const duration = probeDuration(WEBM_OUT);
  if (!duration) {
    console.error('[demo] Could not read video duration.');
    process.exit(1);
  }
  console.log(`[demo] Duration: ${duration.toFixed(1)}s`);

  if (timer?.cues?.length) writeSrt(timer.cues, duration);
  else if (!fs.existsSync(SRT_OUT)) {
    console.error('[demo] Missing SRT and no cues to write.');
    process.exit(1);
  }

  const audioEvents = timer?.audioEvents?.length ? timer.audioEvents : loadAudioEvents();
  if (timer?.audioEvents?.length) {
    fs.writeFileSync(AUDIO_EVENTS_OUT, `${JSON.stringify(audioEvents, null, 2)}\n`, 'utf8');
  }

  generateMusicBed(duration);
  generateAcousticCues(audioEvents, duration);
  muxFinal(WEBM_OUT, duration);
}

async function pause(page, ms) {
  await page.waitForTimeout(ms);
}

async function acceptTerms(page) {
  const modal = page.locator('#terms-modal.open');
  if (await modal.count()) {
    await page.locator('#terms-checkbox').check();
    await page.locator('#terms-accept-btn').click();
    await pause(page, 800);
  }
  await page.evaluate(() => {
    localStorage.setItem('mosaico_terms_accepted', JSON.stringify({ version: '1.0', acceptedAt: Date.now() }));
    localStorage.setItem('mosaico_first_use_done', '1');
    document.body.classList.remove('terms-locked');
    const m = document.getElementById('terms-modal');
    if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
    window.__dismissFirstUseTour?.(true);
  });
}

async function showTitleCard(page) {
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'demo-title-overlay';
    el.innerHTML = `
      <div class="demo-title-inner">
        <p class="demo-title-kicker">Make Waves · XRPL</p>
        <h1>Cryptographic Mosaic</h1>
        <p class="demo-title-sub">Stop lookalike-address phishing — see &amp; hear every XRPL address</p>
      </div>`;
    document.body.appendChild(el);
    if (!document.getElementById('demo-title-styles')) {
      const style = document.createElement('style');
      style.id = 'demo-title-styles';
      style.textContent = `
        #demo-title-overlay {
          position: fixed; inset: 0; z-index: 99999;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(145deg, #070b14 0%, #0f2744 45%, #071018 100%);
          color: #e2e8f0; text-align: center; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        #demo-title-overlay .demo-title-kicker { color: #38bdf8; font-size: 0.95rem; margin: 0 0 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; }
        #demo-title-overlay h1 { font-size: 2.6rem; margin: 0 0 0.65rem; color: #fff; font-weight: 700; }
        #demo-title-overlay .demo-title-sub { font-size: 1.15rem; color: #94a3b8; margin: 0; max-width: 34rem; line-height: 1.45; }
      `;
      document.head.appendChild(style);
    }
  });
}

async function showEndCard(page) {
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'demo-title-overlay';
    el.innerHTML = `
      <div class="demo-title-inner">
        <p class="demo-title-kicker">Try it on Mainnet</p>
        <h1 style="font-size:2rem">mosaico-criptografico.vercel.app</h1>
        <p class="demo-title-sub">Mint your Soulbound keychain · Verify on-chain · Make Waves</p>
      </div>`;
    document.body.appendChild(el);
  });
}

async function hideTitleCard(page) {
  await page.evaluate(() => document.getElementById('demo-title-overlay')?.remove());
}

async function switchTab(page, tabId) {
  if (tabId === 'register-tab') {
    await page.locator('#header-register-btn').click();
  } else {
    await page.locator(`[data-tab="${tabId}"]`).click();
  }
  await pause(page, 900);
}

async function showWizardDone(page) {
  await page.evaluate(({ address, tx }) => {
    document.querySelectorAll('.wizard-step').forEach((el) => el.classList.remove('active'));
    document.querySelector('.wizard-step[data-step="5"]')?.classList.add('active');
    document.querySelectorAll('.wizard-progress-step').forEach((el) => {
      el.classList.toggle('active', el.dataset.step === '5');
      el.classList.toggle('done', Number(el.dataset.step) < 5);
    });
    const addr = document.getElementById('wizard-success-address');
    const hash = document.getElementById('wizard-tx-hash');
    if (addr) addr.textContent = address;
    if (hash) hash.textContent = tx;
    const link = document.getElementById('wizard-verify-link');
    if (link) link.href = `/verify?address=${encodeURIComponent(address)}`;
    document.getElementById('wizard-next-btn')?.classList.add('hidden');
    document.getElementById('wizard-finish-btn')?.classList.remove('hidden');
  }, { address: DEMO_ADDRESS, tx: DEMO_TX });
}

async function main() {
  if (process.argv.includes('--remux-only') || process.env.DEMO_REMUX_ONLY === '1') {
    if (!fs.existsSync(WEBM_OUT)) {
      console.error('[demo] DEMO_REMUX_ONLY requires assets/demo-make-waves.webm');
      process.exit(1);
    }
    console.log('[demo] Remux only — rebuilding audio on existing webm…');
    await postProcessRecording(null);
    console.log('[demo] Done — use assets/demo-make-waves.mp4 for Devpost.');
    return;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const timer = new SceneTimer();

  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
    locale: 'en-US'
  });

  const page = await context.newPage();

  console.log('[demo] Loading app…');
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pause(page, 1200);
  await acceptTerms(page);

  await showTitleCard(page);
  timer.mark('Cryptographic Mosaic — stop lookalike-address phishing on XRPL');
  await pause(page, 3200);
  await hideTitleCard(page);

  console.log('[demo] Scene 1 — Comparator phishing (problem first)');
  await switchTab(page, 'comparator-tab');
  timer.mark('Problem: two addresses look almost identical — humans miss the middle');
  await page.locator('#compare-a-input').fill(SAMPLE_A);
  await pause(page, 900);
  await page.locator('#compare-b-input').fill(PHISHING_B);
  await pause(page, 2800);
  timer.mark('One wrong character — mosaics diverge. Phishing becomes visible.');
  timer.markAudio(SAMPLE_A);
  await page.locator('#play-audio-a-btn').click({ timeout: 5000 }).catch(() => {});
  await pause(page, 2200);
  timer.markAudio(PHISHING_B);
  await page.locator('#play-audio-b-btn').click({ timeout: 5000 }).catch(() => {});
  await pause(page, 2800);

  console.log('[demo] Scene 2 — Perfect match');
  timer.mark('Same address both sides — green verdict. Safe to sign.');
  await page.locator('#compare-b-input').fill(SAMPLE_A);
  await pause(page, 2800);

  console.log('[demo] Scene 3 — Generator + acoustic');
  await switchTab(page, 'generator-tab');
  timer.mark('Every address gets a unique mosaic — center anchor stays fixed for fast recognition');
  await page.locator('#address-input').fill(DEMO_ADDRESS);
  await pause(page, 2200);
  timer.mark('Acoustic signature — four notes unique to this address');
  timer.markAudio(DEMO_ADDRESS);
  await page.locator('#play-audio-btn').click({ timeout: 5000 }).catch(() => {});
  await pause(page, 3200);

  console.log('[demo] Scene 4 — Register / mint success');
  await switchTab(page, 'register-tab');
  timer.mark('Mainnet Soulbound NFT — taxon 1001, self-issued (Issuer = Owner)');
  await showWizardDone(page);
  await pause(page, 3800);

  console.log('[demo] Scene 5 — Verify on-chain');
  timer.mark('Public verify — account_nfts confirms a valid Mosaic Keychain');
  const verifyUrl = `${BASE}/verify?address=${encodeURIComponent(DEMO_ADDRESS)}`;
  await page.goto(verifyUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pause(page, 1500);
  await page.locator('#verify-submit-btn').click();
  await pause(page, 6500);

  await showEndCard(page);
  timer.mark('mosaico-criptografico.vercel.app — Make Waves on XRPL');
  await pause(page, 4500);
  await hideTitleCard(page);

  const video = page.video();
  await context.close();
  await browser.close();

  if (!video) {
    console.error('[demo] No video recorded.');
    process.exit(1);
  }

  const rawPath = await video.path();
  fs.copyFileSync(rawPath, WEBM_OUT);
  console.log(`[demo] Saved ${path.relative(rootDir, WEBM_OUT)}`);

  await postProcessRecording(timer);

  try {
    fs.rmSync(outDir, { recursive: true, force: true });
  } catch { /* ignore */ }

  console.log('[demo] Done — use assets/demo-make-waves.mp4 for Devpost.');
}

main().catch((err) => {
  console.error('[demo] Failed:', err);
  process.exit(1);
});
