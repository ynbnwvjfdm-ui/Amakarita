import * as Sharing from 'expo-sharing';
import { RefObject } from 'react';
import { PixelRatio, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/** About this many pixels across: sharp in chats and stories. */
const IMAGE_WIDTH = 1080;

/**
 * Takes a picture of `view` and opens the phone's share sheet with it. The
 * browser version is shareImage.web.ts.
 */
export async function shareImage(view: RefObject<View | null>, size: { width: number; height: number }, text: string): Promise<void> {
  const ratio = PixelRatio.get();
  const uri = await captureRef(view, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    // In points: the phone multiplies by its pixel ratio.
    width: IMAGE_WIDTH / ratio,
    height: (IMAGE_WIDTH * size.height) / size.width / ratio,
  });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available');
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: text });
}
