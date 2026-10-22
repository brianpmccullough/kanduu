import { formatAsOf, formatPercentChange, formatPrice, formatString } from './stockTickerFormat';

describe('stockTickerFormat', () => {
  it('formats prices with two decimals', () => {
    expect(formatPrice(1234.5, 'en-US')).toBe('1,234.50');
  });

  it('signs positive percent changes', () => {
    expect(formatPercentChange(0.0123, 'en-US')).toBe('+1.23%');
    expect(formatPercentChange(-0.05, 'en-US')).toBe('-5.00%');
    expect(formatPercentChange(0, 'en-US')).toBe('0.00%');
  });

  it('formats valid ISO dates and passes through invalid ones', () => {
    expect(formatAsOf('2026-10-21T12:00:00Z', 'en-US')).toContain('2026');
    expect(formatAsOf('not a date', 'en-US')).toBe('not a date');
  });

  it('fills string templates', () => {
    expect(formatString('As of {0}', 'today')).toBe('As of today');
    expect(formatString('{0} {1}', 'a')).toBe('a {1}');
  });
});
