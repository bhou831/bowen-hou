let hapticLabel: HTMLLabelElement | null = null;
let triggering = false;

export function mountHaptic(): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (hapticLabel) return;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return;

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = '___haptic___';
  input.setAttribute('switch', '');
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.opacity = '0';
  input.style.pointerEvents = 'none';
  document.body.appendChild(input);

  hapticLabel = document.createElement('label');
  hapticLabel.htmlFor = '___haptic___';
  hapticLabel.setAttribute('aria-hidden', 'true');
  hapticLabel.tabIndex = -1;
  hapticLabel.style.position = 'fixed';
  hapticLabel.style.left = '-9999px';
  hapticLabel.style.opacity = '0';
  hapticLabel.style.pointerEvents = 'none';
  document.body.appendChild(hapticLabel);
}

export function triggerHaptic(): void {
  if (!globalThis?.document || triggering) return;
  triggering = true;
  if (hapticLabel) {
    hapticLabel.click();
  } else if (navigator?.vibrate) {
    navigator.vibrate(10);
  }
  triggering = false;
}
