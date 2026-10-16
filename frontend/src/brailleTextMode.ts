const BRAILLE_MAP: Record<string, string> = {
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚',
  k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞',
  u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵',
  а: '⠁', б: '⠃', в: '⠺', г: '⠛', д: '⠙', е: '⠑', ё: '⠡', ж: '⠚', з: '⠵', и: '⠊',
  й: '⠯', к: '⠅', л: '⠇', м: '⠍', н: '⠝', о: '⠕', п: '⠏', р: '⠗', с: '⠎', т: '⠞',
  у: '⠥', ф: '⠋', х: '⠓', ц: '⠉', ч: '⠟', ш: '⠱', щ: '⠭', ъ: '⠷', ы: '⠮', ь: '⠾',
  э: '⠪', ю: '⠳', я: '⠫'
};

const DIGIT_MAP: Record<string, string> = {
  '1': '⠁',
  '2': '⠃',
  '3': '⠉',
  '4': '⠙',
  '5': '⠑',
  '6': '⠋',
  '7': '⠛',
  '8': '⠓',
  '9': '⠊',
  '0': '⠚'
};

const originalTextNodes = new Map<Text, string>();
let observer: MutationObserver | null = null;

const shouldSkipNode = (node: Text): boolean => {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest('[data-braille-ignore="true"]')) return true;
  const tag = parent.tagName;
  return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT';
};

const toBraille = (text: string): string => {
  let result = '';
  let isNumberSequence = false;

  for (const char of text) {
    if (char >= '0' && char <= '9') {
      if (!isNumberSequence) {
        result += '⠼';
        isNumberSequence = true;
      }
      result += DIGIT_MAP[char] ?? char;
      continue;
    }

    isNumberSequence = false;
    const lower = char.toLowerCase();
    result += BRAILLE_MAP[lower] ?? char;
  }

  return result;
};

const convertTextNode = (node: Text): void => {
  if (shouldSkipNode(node)) return;
  const current = node.nodeValue ?? '';
  if (!current.trim()) return;

  const knownOriginal = originalTextNodes.get(node);
  if (knownOriginal !== undefined && current === toBraille(knownOriginal)) return;

  originalTextNodes.set(node, current);
  const braille = toBraille(current);
  if (braille === current) return;
  node.nodeValue = braille;
};

const processAllTextNodes = (): void => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();

  while (current) {
    convertTextNode(current as Text);
    current = walker.nextNode();
  }
};

const startObserver = (): void => {
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
        convertTextNode(mutation.target as Text);
        continue;
      }

      mutation.addedNodes.forEach((addedNode) => {
        if (addedNode.nodeType === Node.TEXT_NODE) {
          convertTextNode(addedNode as Text);
          return;
        }

        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          const element = addedNode as Element;
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          let nested: Node | null = walker.nextNode();
          while (nested) {
            convertTextNode(nested as Text);
            nested = walker.nextNode();
          }
        }
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
};

export const enableBrailleTextMode = (): void => {
  disableBrailleTextMode();
  processAllTextNodes();
  startObserver();
};

export const disableBrailleTextMode = (): void => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }

  originalTextNodes.forEach((original, node) => {
    if (node.isConnected) {
      node.nodeValue = original;
    }
  });
  originalTextNodes.clear();
};
