import { describe, expect, it } from 'vitest';
import {
  CURRENCY_PRESETS,
  centsToDecimalString,
  formatCurrency,
  parseInputToCents,
} from '@/utils/currency';

// All formatting tests pass an explicit locale so results do not depend on
// the machine running the tests.
const LOCALE = 'en-US';

describe('CURRENCY_PRESETS', () => {
  it('exposes a symbol and code for every preset', () => {
    expect(CURRENCY_PRESETS.length).toBeGreaterThan(0);
    for (const preset of CURRENCY_PRESETS) {
      expect(preset.code).toMatch(/^[A-Z]{3}$/);
      expect(preset.symbol).not.toBe('');
      expect(preset.name).not.toBe('');
      expect(preset.name).toContain(preset.symbol);
    }
  });

  it('has unique currency codes', () => {
    const codes = CURRENCY_PRESETS.map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('formatCurrency', () => {
  it('formats a 2-decimal amount with the default symbol', () => {
    expect(formatCurrency(1500, '$', true, LOCALE)).toBe('$15.00');
  });

  it('formats zero', () => {
    expect(formatCurrency(0, '$', true, LOCALE)).toBe('$0.00');
  });

  it('formats large amounts with thousands separators', () => {
    expect(formatCurrency(123456789, '$', true, LOCALE)).toBe('$1,234,567.89');
  });

  it('places the minus sign before the symbol', () => {
    expect(formatCurrency(-150, '$', true, LOCALE)).toBe('-$1.50');
  });

  it('hides decimals when asked', () => {
    expect(formatCurrency(1500, 'KSh', false, LOCALE)).toBe('KSh15');
  });

  it('keeps the sign when decimals are hidden', () => {
    expect(formatCurrency(-200, '$', false, LOCALE)).toBe('-$2');
  });

  it('supports non-default symbols', () => {
    expect(formatCurrency(1500, '€', true, LOCALE)).toBe('€15.00');
  });

  it('renders sub-unit amounts', () => {
    expect(formatCurrency(1, '$', true, LOCALE)).toBe('$0.01');
  });

  it('falls back to zero for NaN', () => {
    expect(formatCurrency(Number.NaN, '$', true, LOCALE)).toBe('$0.00');
  });

  it('falls back to zero for Infinity', () => {
    expect(formatCurrency(Number.POSITIVE_INFINITY, '$', true, LOCALE)).toBe('$0.00');
  });

  it('falls back to zero when called with a nullish value', () => {
    expect(formatCurrency(null as unknown as number, '$', true, LOCALE)).toBe('$0.00');
    expect(formatCurrency(undefined as unknown as number, '$', true, LOCALE)).toBe('$0.00');
  });
});

describe('parseInputToCents', () => {
  it('parses a decimal string', () => {
    expect(parseInputToCents('15.00')).toBe(1500);
  });

  it('parses a whole-number string', () => {
    expect(parseInputToCents('15')).toBe(1500);
  });

  it('strips currency symbols and thousands separators', () => {
    expect(parseInputToCents('$1,234.56')).toBe(123456);
  });

  it('preserves a negative sign', () => {
    expect(parseInputToCents('-5')).toBe(-500);
    expect(parseInputToCents('-0.99')).toBe(-99);
  });

  it('accepts the Unicode minus', () => {
    expect(parseInputToCents('−2.50')).toBe(-250);
  });

  it('returns zero for empty input', () => {
    expect(parseInputToCents('')).toBe(0);
    expect(parseInputToCents('   ')).toBe(0);
  });

  it('returns zero for non-numeric input', () => {
    expect(parseInputToCents('abc')).toBe(0);
    expect(parseInputToCents('$')).toBe(0);
  });

  it('parses numeric input directly', () => {
    expect(parseInputToCents(15.5)).toBe(1550);
    expect(parseInputToCents(0)).toBe(0);
  });

  it('returns zero for NaN and Infinity numbers', () => {
    expect(parseInputToCents(Number.NaN)).toBe(0);
    expect(parseInputToCents(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('avoids floating point drift', () => {
    expect(parseInputToCents(0.1 + 0.2)).toBe(30);
    expect(parseInputToCents('0.29')).toBe(29);
  });

  it('rounds to the nearest cent', () => {
    expect(parseInputToCents('1.234')).toBe(123);
    expect(parseInputToCents('1.235')).toBe(124);
  });

  it('handles very large amounts', () => {
    expect(parseInputToCents('99999999.99')).toBe(9999999999);
  });
});

describe('centsToDecimalString', () => {
  it('converts cents to a 2-decimal string', () => {
    expect(centsToDecimalString(1500)).toBe('15.00');
  });

  it('converts zero', () => {
    expect(centsToDecimalString(0)).toBe('0.00');
  });

  it('keeps negative values', () => {
    expect(centsToDecimalString(-150)).toBe('-1.50');
  });

  it('pads sub-unit values', () => {
    expect(centsToDecimalString(5)).toBe('0.05');
  });

  it('does not use thousands separators', () => {
    expect(centsToDecimalString(123456789)).toBe('1234567.89');
  });

  it('falls back to zero for NaN', () => {
    expect(centsToDecimalString(Number.NaN)).toBe('0.00');
  });

  it('falls back to zero for a nullish value', () => {
    expect(centsToDecimalString(undefined as unknown as number)).toBe('0.00');
  });
});
