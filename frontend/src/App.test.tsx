import { enableBrailleTextMode, disableBrailleTextMode } from './brailleTextMode';

afterEach(() => {
  disableBrailleTextMode();
  document.body.innerHTML = '';
});

test('braille mode follows text that changes in place', async () => {
  document.body.innerHTML = '<p id="label">Карта</p>';
  enableBrailleTextMode();

  const node = document.getElementById('label')!.firstChild as Text;
  expect(node.nodeValue).toBe('⠅⠁⠗⠞⠁');

  node.nodeValue = 'Метка';
  await new Promise((resolve) => setTimeout(resolve, 0));

  expect(node.nodeValue).toBe('⠍⠑⠞⠅⠁');
});
