/**
 * Post-registration guided tour — centered overlay; user closes manually when done.
 */
import { sha256 } from '../core/crypto.js';
import { generateSvg } from '../core/generator.js';
import { activateTabPanel, showToast } from './onboarding.js';

const STORAGE_FIRST_USE = 'mosaico_first_use_done';
const TOTAL_STEPS = 4;
const OPEN_CLASS = 'is-open';

let currentStep = 1;
let guideAddress = '';
let mosaicPreviewBound = false;
let tourTimeoutId = null;
let controlsBound = false;
/** In-memory only — never survives page load. */
let mintTourAuthorized = false;

function $(id) {
  return document.getElementById(id);
}

function getOverlay() {
  return $('first-use-modal');
}

function isTourOpen() {
  return getOverlay()?.classList.contains(OPEN_CLASS) ?? false;
}

function setStep(step) {
  currentStep = Math.max(1, Math.min(TOTAL_STEPS, step));
  document.querySelectorAll('.first-use-step').forEach(panel => {
    panel.classList.toggle('active', Number(panel.dataset.step) === currentStep);
  });
  document.querySelectorAll('.first-use-progress-step').forEach(dot => {
    const n = Number(dot.dataset.step);
    dot.classList.toggle('active', n === currentStep);
    dot.classList.toggle('done', n < currentStep);
  });
  $('first-use-back-btn')?.toggleAttribute('disabled', currentStep <= 1);
  $('first-use-next-btn')?.classList.toggle('hidden', currentStep >= TOTAL_STEPS);
  $('first-use-open-comparator-btn')?.classList.toggle('hidden', currentStep < TOTAL_STEPS);

  if (currentStep === 2 && guideAddress) {
    void renderMosaicPreview(guideAddress);
  }
}

function markFirstUseGuideDone() {
  try {
    localStorage.setItem(STORAGE_FIRST_USE, '1');
    sessionStorage.setItem(STORAGE_FIRST_USE, '1');
  } catch {
    /* storage may be blocked */
  }
}

export function hasCompletedFirstUseGuide() {
  try {
    if (localStorage.getItem(STORAGE_FIRST_USE) === '1') return true;
    if (sessionStorage.getItem(STORAGE_FIRST_USE) === '1') return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function authorizeMintTour() {
  mintTourAuthorized = true;
}

export function clearScheduledFirstUseTour() {
  if (tourTimeoutId) {
    clearTimeout(tourTimeoutId);
    tourTimeoutId = null;
  }
}

export function scheduleFirstUseTour(address, delayMs = 4200) {
  clearScheduledFirstUseTour();
  if (!mintTourAuthorized || !address || hasCompletedFirstUseGuide()) return;

  tourTimeoutId = window.setTimeout(() => {
    tourTimeoutId = null;
    if (!mintTourAuthorized || hasCompletedFirstUseGuide()) return;
    mintTourAuthorized = false;
    openFirstUseGuide(address);
  }, delayMs);
}

function forceCloseBlockingModals() {
  $('cost-confirm-modal')?.classList.remove('open');
  $('cost-confirm-modal')?.setAttribute('aria-hidden', 'true');
  $('cost-confirm-modal')?.removeAttribute('data-loading');
  $('cost-confirm-modal')?.removeAttribute('data-arming');
  $('cost-confirm-modal')?.removeAttribute('data-error');
}

export function closeFirstUseGuide() {
  const overlay = getOverlay();
  overlay?.classList.remove(OPEN_CLASS);
  overlay?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('first-use-open');
}

function dismissFirstUseGuide(markDone = true) {
  if (markDone) {
    markFirstUseGuideDone();
  }
  mintTourAuthorized = false;
  clearScheduledFirstUseTour();
  closeFirstUseGuide();
}

function fillComparatorInputs(address) {
  if (!address) return false;

  const compareA = $('compare-a-input');
  const compareB = $('compare-b-input');
  if (compareA) {
    compareA.value = address;
    compareA.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (compareB) {
    compareB.value = address;
    compareB.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return Boolean(compareA && compareB);
}

export function openComparatorWithGuideAddress(address = guideAddress) {
  const resolved = address || guideAddress;
  if (!resolved) {
    showToast('No address saved for this tour — paste your address in the Comparator.', 'warn', 5000);
    return false;
  }

  activateTabPanel('comparator-tab');
  fillComparatorInputs(resolved);
  document.getElementById('comparator-tab')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}

async function renderMosaicPreview(address) {
  const canvas = document.querySelector('#first-use-mosaic-preview .first-use-mosaic-canvas');
  if (!canvas || !address) return;

  try {
    const hash = await sha256(address);
    canvas.innerHTML = generateSvg(hash, address, {
      chaoticMode: false,
      showOverlay: true,
      showAnchors: true,
      gridSize: 3
    });
  } catch (err) {
    canvas.innerHTML = '<p class="first-use-mosaic-error">Could not render mosaic preview.</p>';
    console.error('[first-use]', err);
  }
}

function bindMosaicPreviewInteraction() {
  if (mosaicPreviewBound) return;
  const preview = $('first-use-mosaic-preview');
  if (!preview) return;

  const openFromPreview = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!guideAddress) return;
    openComparatorWithGuideAddress(guideAddress);
    showToast('Comparator opened — finish the tour, then close this window.', 'info', 5000);
  };

  preview.addEventListener('click', openFromPreview);
  preview.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    openFromPreview(event);
  });

  mosaicPreviewBound = true;
}

export function openFirstUseGuide(address, { manual = false } = {}) {
  if (!address || hasCompletedFirstUseGuide()) return;
  if (!manual && !mintTourAuthorized) return;

  guideAddress = address;
  mintTourAuthorized = false;
  forceCloseBlockingModals();
  setStep(1);
  void renderMosaicPreview(guideAddress);
  bindMosaicPreviewInteraction();

  const overlay = getOverlay();
  if (!overlay) return;
  overlay.classList.add(OPEN_CLASS);
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('first-use-open');
  overlay.querySelector('.first-use-panel')?.focus();
}

function tryOpenComparatorFromTour() {
  const opened = openComparatorWithGuideAddress();
  if (opened) {
    showToast('Comparator is ready — close this window when you are done.', 'info', 6000);
  }
}

function goNext() {
  if (currentStep < TOTAL_STEPS) {
    setStep(currentStep + 1);
  }
}

function goBack() {
  if (currentStep > 1) setStep(currentStep - 1);
}

function bindControls() {
  if (controlsBound) return;
  controlsBound = true;

  $('first-use-modal-close')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    dismissFirstUseGuide(true);
  });

  $('first-use-done-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    dismissFirstUseGuide(true);
  });

  $('first-use-back-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    goBack();
  });

  $('first-use-next-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    goNext();
  });

  $('first-use-open-comparator-btn')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    tryOpenComparatorFromTour();
  });

  const panel = document.querySelector('#first-use-modal .first-use-panel');
  panel?.addEventListener('click', (event) => {
    event.stopPropagation();
  });
}

export function initFirstUseGuide() {
  mintTourAuthorized = false;
  clearScheduledFirstUseTour();
  closeFirstUseGuide();
  bindControls();

  window.__dismissFirstUseTour = (markDone = true) => dismissFirstUseGuide(markDone !== false);
  window.__isFirstUseTourOpen = () => isTourOpen();

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isTourOpen()) return;
    event.preventDefault();
    dismissFirstUseGuide(true);
  });
}

export { isTourOpen };
