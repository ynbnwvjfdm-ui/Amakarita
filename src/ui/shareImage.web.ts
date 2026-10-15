import { RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/**
 * Takes a picture of `view` and shares it with the browser's share sheet;
 * where the browser can't share pictures, it downloads it instead.
 */
export async function shareImage(view: RefObject<View | null>, _size: { width: number; height: number }, text: string): Promise<void> {
  // Drawn at the screen's own sharpness (no resizing, which would blur it on a plain screen).
  const dataUrl = await captureRef(view, { format: 'png', quality: 1, result: 'data-uri' });
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], 'amakarita.png', { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (e) {
      // Closing the share sheet is not a failure.
      if (e instanceof Error && e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'amakarita.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
