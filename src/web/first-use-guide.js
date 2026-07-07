/**
 * Post-registration guided tour: explains the new capability and first real Comparator use.
 */
import { showToast } from './onboarding.js';

const STORAGE_FIRST_USE = 'mosaico_first_use_done';
const TOTAL_STEPS = 4;

let currentStep = 1;
let guideAddress = '';

function $(id) {
  return document.getElementById(id);
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
  $('first-use-finish-btn')?.classList.toggle('hidden', currentStep < TOTAL_STEPS);
}

export function hasCompletedFirstUseGuide() {
  return localStorage.getItem(STORAGE_FIRST_USE) === '1';
}

export function openFirstUseGuide(address) {
  guideAddress = address || '';
  setStep(1);

  const preview = $('first-use-mosaic-preview');
  if (preview && guideAddress) {
    import('../core/crypto.js').then(({ sha256 }) => sha256(guideAddress)).then(hash =>
      import('../core/generator.js').then(({ generateSvg }) => {
        preview.innerHTML = generateSvg(hash, guideAddress, {
          chaoticMode: false,
          showOverlay: true,
          showAnchors: true,
          gridSize: 3
        });
      })
    );
  }

  const modal = $('first-use-modal');
  modal?.classList.add('open');
  modal?.setAttribute('aria-hidden', 'false');
}

export function closeFirstUseGuide() {
  const modal = $('first-use-modal');
  modal?.classList.remove('open');
  modal?.setAttribute('aria-hidden', 'true');
}

function openComparatorWithAddress() {
  const compareA = $('compare-a-input');
  const compareB = $('compare-b-input');
  if (compareA && guideAddress) {
    compareA.value = guideAddress;
    compareA.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (compareB && guideAddress) {
    compareB.value = guideAddress;
    compareB.dispatchEvent(new Event('input', { bubbles: true }));
  }
  document.querySelector('.nav-btn[data-tab="comparator-tab"]')?.click();
}

function finishGuide() {
  localStorage.setItem(STORAGE_FIRST_USE, '1');
  closeFirstUseGuide();
  openComparatorWithAddress();
  showToast('Use the Comparator before every send — match mosaic + sound = safe.', 'info', 7000);
}

function goNext() {
  if (currentStep === 3) {
    openComparatorWithAddress();
  }
  if (currentStep < TOTAL_STEPS) {
    setStep(currentStep + 1);
    return;
  }
  finishGuide();
}

function goBack() {
  if (currentStep > 1) setStep(currentStep - 1);
}

export function initFirstUseGuide() {
  $('first-use-next-btn')?.addEventListener('click', goNext);
  $('first-use-back-btn')?.addEventListener('click', goBack);
  $('first-use-finish-btn')?.addEventListener('click', finishGuide);
  $('first-use-modal-close')?.addEventListener('click', () => {
    localStorage.setItem(STORAGE_FIRST_USE, '1');
    closeFirstUseGuide();
  });
  $('first-use-modal-backdrop')?.addEventListener('click', () => {
    localStorage.setItem(STORAGE_FIRST_USE, '1');
    closeFirstUseGuide();
  });
}

export function maybeOpenFirstUseGuide(address) {
  if (!hasCompletedFirstUseGuide() && address) {
    openFirstUseGuide(address);
  }
}
