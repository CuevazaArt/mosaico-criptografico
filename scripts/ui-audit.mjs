/**
 * Quick UI audit against local server — run: node scripts/ui-audit.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.AUDIT_URL || 'http://localhost:3000';
const defects = [];

function report(id, severity, message) {
  defects.push({ id, severity, message });
  console.log(`[${severity}] ${id}: ${message}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (err) {
    report('load', 'critical', `Page failed to load: ${err.message}`);
    await browser.close();
    process.exit(1);
  }

  await page.waitForTimeout(1500);

  // Accept terms if modal blocks interaction
  const termsModal = page.locator('#terms-modal.open');
  if (await termsModal.count()) {
    await page.locator('#terms-checkbox').check();
    await page.locator('#terms-accept-btn').click();
    await page.waitForTimeout(600);
    console.log('[ok] Accepted terms for audit session.');
  }

  // 1. First-use modal must NOT be visible on load
  const tourOverlay = page.locator('#first-use-modal');
  const tourState = await tourOverlay.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      isOpen: el.classList.contains('is-open'),
      ariaHidden: el.getAttribute('aria-hidden'),
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents
    };
  }).catch(() => null);

  const tourVisible = tourState?.isOpen === true || await tourOverlay.isVisible();

  if (tourState?.isOpen || await tourOverlay.isVisible()) {
    report('first-use-auto-open', 'critical', `First-use tour visible on load: ${JSON.stringify(tourState)}`);
  } else {
    console.log('[ok] First-use tour hidden on load.', tourState);
  }

  // 2. Terms modal / body lock
  const termsOpen = await page.locator('#terms-modal.open').count();
  const bodyTermsLocked = await page.evaluate(() => document.body.classList.contains('terms-locked'));
  if (termsOpen > 0 && bodyTermsLocked) {
    console.log('[info] Terms modal open (expected if terms not accepted).');
  }

  // 3. Production banner clipping
  const banner = page.locator('#production-mode-banner');
  if (await banner.isVisible()) {
    const footerText = page.locator('.app-footer, footer').first();
    if (await footerText.count()) {
      const box = await footerText.boundingBox();
      if (box && box.y < 0) {
        report('footer-clipped', 'medium', 'Footer/copyright may be clipped at top of viewport.');
      }
    }
  }

  // 4. Comparator tab
  await page.click('[data-tab="comparator-tab"]');
  await page.waitForTimeout(800);

  const compareA = page.locator('#compare-a-input');
  const compareB = page.locator('#compare-b-input');
  if (!(await compareA.isVisible()) || !(await compareB.isVisible())) {
    report('comparator-inputs', 'high', 'Comparator inputs not visible after tab switch.');
  }

  const verdict = page.locator('#compare-verdict');
  if (await verdict.isVisible()) {
    const verdictBox = await verdict.boundingBox();
    const gridBox = await page.locator('.comparison-grid').boundingBox();
    if (verdictBox && gridBox && verdictBox.width < 200) {
      report('verdict-narrow', 'low', 'Compare verdict strip appears very narrow.');
    }
  }

  // 5. Mismatch state with default sample addresses
  const badgeText = await page.locator('#comparison-badge').textContent();
  const msgText = await page.locator('#comparison-msg').textContent();
  if (!badgeText?.includes('⚠') && !msgText?.toLowerCase().includes('differ') && !msgText?.toLowerCase().includes('mismatch')) {
    report('comparator-default-state', 'medium', `Expected mismatch for default A/B samples; got badge="${badgeText?.trim()}" msg="${msgText?.trim()}"`);
  } else {
    console.log('[ok] Comparator shows mismatch for default sample addresses.');
  }

  // 6. Mosaic previews render
  const svgA = await page.locator('#compare-a-preview svg').count();
  const svgB = await page.locator('#compare-b-preview svg').count();
  if (svgA === 0 || svgB === 0) {
    report('mosaic-preview', 'high', `Mosaic SVG missing (A=${svgA}, B=${svgB}).`);
  } else {
    console.log('[ok] Mosaic previews rendered.');
  }

  // 7. Sidebar buttons visible
  const registerBtn = page.locator('#header-register-btn');
  const burnBtn = page.locator('#header-burn-btn');
  if (!(await registerBtn.isVisible()) || !(await burnBtn.isVisible())) {
    report('sidebar-primary', 'high', 'Register/Burn buttons not visible in sidebar.');
  }

  // 8–9. Tour open, centering, close controls
  await page.evaluate(() => {
    localStorage.removeItem('mosaico_first_use_done');
    sessionStorage.removeItem('mosaico_first_use_done');
  });

  await page.evaluate(async () => {
    const mod = await import('/src/web/first-use-guide.js');
    mod.authorizeMintTour();
    mod.openFirstUseGuide('rG1QQv2dh2AGTf5gZUXyZEaXcRmGRHsGQE');
  });
  await page.waitForTimeout(500);

  const tourOpenAfterMint = await tourOverlay.evaluate((el) => el.classList.contains('is-open'));
  if (!tourOpenAfterMint) {
    report('first-use-open-after-mint', 'high', 'Tour did not open when authorized after mint.');
  } else {
    console.log('[ok] Tour opens when mint-authorized.');
  }

  const panelBox = await page.locator('#first-use-modal .first-use-panel').boundingBox();
  const viewport = page.viewportSize();
  if (panelBox && viewport) {
    const panelCenterX = panelBox.x + panelBox.width / 2;
    const viewportCenterX = viewport.width / 2;
    const offset = Math.abs(panelCenterX - viewportCenterX);
    if (offset > 80) {
      report('first-use-position', 'critical', `Tour panel off-center by ${Math.round(offset)}px (likely stuck on left).`);
    } else {
      console.log('[ok] Tour panel centered on viewport.');
    }
  }

  await page.locator('#first-use-done-btn').scrollIntoViewIfNeeded();
  await page.locator('#first-use-done-btn').click();
  await page.waitForTimeout(400);

  let tourClosed = await tourOverlay.evaluate((el) => !el.classList.contains('is-open'));
  if (!tourClosed) {
    await page.click('#first-use-modal-close');
    await page.waitForTimeout(300);
    tourClosed = await tourOverlay.evaluate((el) => !el.classList.contains('is-open'));
  }
  if (!tourClosed) {
    report('first-use-close', 'critical', 'Close controls did not dismiss first-use tour.');
  } else {
    console.log('[ok] Close controls dismiss tour.');
  }

  // 10. Console errors
  const ignorable = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('config.runtime') && !e.includes('404')
  );
  if (ignorable.length) {
    report('console-errors', 'medium', `JS console errors: ${ignorable.slice(0, 3).join(' | ')}`);
  } else {
    console.log('[ok] No significant console errors.');
  }

  await browser.close();

  console.log('\n--- Summary ---');
  console.log(`Defects found: ${defects.length}`);
  defects.forEach((d) => console.log(`  ${d.severity.toUpperCase()} · ${d.id}: ${d.message}`));
  process.exit(defects.some((d) => d.severity === 'critical' || d.severity === 'high') ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
