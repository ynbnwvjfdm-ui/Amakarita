import { Lang } from './i18n';

const DAYS_RW = ['Ku cyumweru', 'Ku wa mbere', 'Ku wa kabiri', 'Ku wa gatatu', 'Ku wa kane', 'Ku wa gatanu', 'Ku wa gatandatu'];
// Month names as taught on the Imvugo cards.
const MONTHS_RW = ['Mutarama', 'Gashyantare', 'Werurwe', 'Mata', 'Gicurasi', 'Kamena', 'Nyakanga', 'Kanama', 'Nzeri', 'Ukwakira', 'Ugushyingo', 'Ukuboza'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Ku wa kabiri, 13 Ukwakira" / "Tuesday, 13 October". */
export function longDate(date: Date, lang: Lang): string {
  const days = lang === 'rw' ? DAYS_RW : DAYS_EN;
  const months = lang === 'rw' ? MONTHS_RW : MONTHS_EN;
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
}

/** Whole days since 1 January 1970 in local time; the same all day. */
export function dayNumber(date: Date): number {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000);
}

export function greetingKey(date: Date): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}
