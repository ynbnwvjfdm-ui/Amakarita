import { Platform, Share } from 'react-native';

/**
 * Shares a short text, for example to WhatsApp. On a phone this opens the
 * share sheet. In a browser it uses the browser's share sheet when there is
 * one, otherwise copies the text. Returns false if nothing worked.
 */
export async function shareText(message: string): Promise<boolean> {
  try {
    if (Platform.OS !== 'web') {
      await Share.share({ message });
      return true;
    }
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.share) {
      await nav.share({ text: message });
      return true;
    }
    if (nav?.clipboard) {
      await nav.clipboard.writeText(message);
      return true;
    }
  } catch {
    // Closing the share sheet without sharing lands here too.
  }
  return false;
}
