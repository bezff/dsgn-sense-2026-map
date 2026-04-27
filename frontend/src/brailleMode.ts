export const BRAILLE_MODE_STORAGE_KEY = 'braille-mode-enabled';
export const BRAILLE_MODE_EVENT = 'braille-mode-changed';

export const isBrailleModeEnabled = (): boolean => {
  return localStorage.getItem(BRAILLE_MODE_STORAGE_KEY) === 'true';
};

export const setBrailleModeEnabled = (enabled: boolean): void => {
  localStorage.setItem(BRAILLE_MODE_STORAGE_KEY, String(enabled));
  window.dispatchEvent(new Event(BRAILLE_MODE_EVENT));
};
