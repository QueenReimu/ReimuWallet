import { ParsedNotificationResult } from './providers/dana';
import { parseDanaNotification } from './providers/dana';
import { parseGopayNotification } from './providers/gopay';
import { parseOvoNotification } from './providers/ovo';
import { parseBankNotification } from './providers/bank';

export { ParsedNotificationResult };

const PROVIDER_PARSERS = [
  parseDanaNotification,
  parseGopayNotification,
  parseOvoNotification,
  parseBankNotification,
];

/**
 * Universal notification parser that tests against all registered financial providers.
 */
export function parseIncomingNotification(
  packageName: string,
  title: string,
  text: string
): ParsedNotificationResult | null {
  // If package indicates a specific provider, run it first
  if (packageName.includes('dana')) {
    const res = parseDanaNotification(title, text);
    if (res) return res;
  }
  if (packageName.includes('gojek')) {
    const res = parseGopayNotification(title, text);
    if (res) return res;
  }
  if (packageName.includes('ovo')) {
    const res = parseOvoNotification(title, text);
    if (res) return res;
  }
  if (packageName.includes('bca') || packageName.includes('mandiri') || packageName.includes('bri') || packageName.includes('bni')) {
    const res = parseBankNotification(title, text);
    if (res) return res;
  }

  // Otherwise, attempt all parsers
  for (const parser of PROVIDER_PARSERS) {
    const result = parser(title, text);
    if (result) {
      return result;
    }
  }

  return null;
}
