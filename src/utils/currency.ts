/**
 * Utility functions for robust financial & currency calculations.
 * Always works with small currency units (integer cents) to prevent float inaccuracies.
 */

export const CURRENCY_PRESETS = [
  { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
  { symbol: 'KSh', code: 'KES', name: 'Kenyan Shilling (KSh)' },
  { symbol: '₦', code: 'NGN', name: 'Nigerian Naira (₦)' },
  { symbol: '€', code: 'EUR', name: 'Euro (€)' },
  { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
  { symbol: 'R', code: 'ZAR', name: 'South African Rand (R)' },
  { symbol: '₱', code: 'PHP', name: 'Philippine Peso (₱)' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
];

export function formatCurrency(
  amountInCents: number,
  symbol: string = '$',
  showDecimals: boolean = true,
  locale?: string
): string {
  if (typeof amountInCents !== 'number' || !Number.isFinite(amountInCents)) {
    return `${symbol}0.00`;
  }

  const isNegative = amountInCents < 0;
  const digits = showDecimals ? 2 : 0;

  // Format the absolute value with thousands separator, then place the sign
  // before the symbol (e.g. "-$1.50" rather than "$-1.50").
  const formatted = Math.abs(amountInCents / 100).toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function parseInputToCents(val: string | number): number {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? Math.round(val * 100) : 0;
  }

  const trimmed = val.trim();
  if (trimmed === '') return 0;

  // Preserve a leading minus sign (also accepts the Unicode minus) instead of
  // stripping it along with every other non-numeric character.
  const isNegative = /^[-−]/.test(trimmed);
  const clean = trimmed.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(clean);
  if (!Number.isFinite(parsed)) return 0;

  return Math.round((isNegative ? -parsed : parsed) * 100);
}

export function centsToDecimalString(amountInCents: number): string {
  if (typeof amountInCents !== 'number' || !Number.isFinite(amountInCents)) {
    return '0.00';
  }
  return (amountInCents / 100).toFixed(2);
}
